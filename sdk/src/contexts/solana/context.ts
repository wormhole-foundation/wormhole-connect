import {
  CHAIN_ID_SOLANA,
  createNonce,
  getForeignAssetSolana,
  redeemAndUnwrapOnSolana,
  redeemOnSolana,
} from '@certusone/wormhole-sdk';
import {
  ACCOUNT_SIZE,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createCloseAccountInstruction,
  createInitializeAccountInstruction,
  getMinimumBalanceForRentExemptAccount,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getAccount,
  createAssociatedTokenAccountInstruction,
  Account,
  getAssociatedTokenAddressSync,
  TokenAccountNotFoundError,
} from '@solana/spl-token';
import {
  clusterApiUrl,
  Commitment,
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  PublicKeyInitData,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { BigNumber, BigNumberish } from 'ethers';
import { arrayify, zeroPad, hexlify } from 'ethers/lib/utils';

import MAINNET_CONFIG, { MAINNET_CHAINS } from '../../config/MAINNET';
import {
  parseTokenTransferPayload,
  parseTokenTransferVaa,
  parseVaa,
} from '../../vaa';
import {
  TokenId,
  ChainName,
  ChainId,
  NATIVE,
  ParsedMessage,
  Context,
  ParsedRelayerMessage,
} from '../../types';
import { SolContracts } from './contracts';
import { WormholeContext } from '../../wormhole';
import {
  createTransferNativeInstruction,
  createTransferWrappedInstruction,
  createTransferNativeWithPayloadInstruction,
  createApproveAuthoritySignerInstruction,
  createTransferWrappedWithPayloadInstruction,
  deriveWrappedMintKey,
} from './utils/tokenBridge';
import {
  deriveClaimKey,
  deriveWormholeEmitterKey,
  getClaim,
  getPostedMessage,
} from './utils/wormhole';
import { ForeignAssetCache } from '../../utils';
import { RelayerAbstract } from '../abstracts/relayer';
import {
  createCompleteWrappedTransferWithRelayInstruction,
  createTransferNativeTokensWithRelayInstruction,
  createTransferWrappedTokensWithRelayInstruction,
  createCompleteNativeTransferWithRelayInstruction,
} from './utils/tokenBridgeRelayer';

const SOLANA_SEQ_LOG = 'Program log: Sequence: ';
const SOLANA_CHAIN_NAME = MAINNET_CONFIG.chains.solana!.key;

// Add priority fee according to 75th percentile of recent fees paid
const SOLANA_FEE_PERCENTILE = 0.75;

const SOLANA_MAINNET_EMMITER_ID =
  'ec7372995d5cc8732397fb0ad35c0121e0eaa90d26f828a534cab54391b3a4f5';
const SOLANA_TESTNET_EMITTER_ID =
  '3b26409f8aaded3f5ddca184695aa6a0fa829b0c85caf84856324896d214ca98';

/**
 * @category Solana
 */
export class SolanaContext<
  T extends WormholeContext,
> extends RelayerAbstract<Transaction> {
  readonly type = Context.SOLANA;
  readonly contracts: SolContracts<T>;
  readonly context: T;
  connection: Connection | undefined;
  private foreignAssetCache: ForeignAssetCache;

  constructor(context: T, foreignAssetCache: ForeignAssetCache) {
    super();
    this.context = context;
    const tag = context.environment === 'MAINNET' ? 'mainnet-beta' : 'devnet';
    this.connection = new Connection(
      context.conf.rpcs.solana || clusterApiUrl(tag),
    );
    this.contracts = new SolContracts(context);
    this.foreignAssetCache = foreignAssetCache;
  }

  async getTxGasFee(
    txId: string,
    chain: ChainName | ChainId,
  ): Promise<BigNumber | undefined> {
    if (!this.connection) throw new Error('no connection');
    const transaction = await this.connection.getParsedTransaction(txId);
    const parsedInstr = transaction?.meta?.innerInstructions![0].instructions;
    const gasFee = parsedInstr
      ? parsedInstr.reduce((acc, c: any) => {
          if (!c.parsed || !c.parsed.info || !c.parsed.info.lamports)
            return acc;
          return acc + c.parsed.info.lamports;
        }, 0)
      : 0;
    return BigNumber.from(gasFee);
  }

  /**
   * Sets the Connection
   *
   * @param connection The Solana Connection
   */
  async setConnection(connection: Connection) {
    this.connection = connection;
  }

  async fetchTokenDecimals(
    tokenAddr: string,
    chain?: ChainName | ChainId,
  ): Promise<number> {
    if (!this.connection) throw new Error('no connection');
    let mint = await this.connection.getParsedAccountInfo(
      new PublicKey(tokenAddr),
    );
    if (!mint) throw new Error('could not fetch token details');
    const { decimals } = (mint as any).value.data.parsed.info;
    return decimals;
  }

  /**
   * Gets the owner address of an Associated Token Account
   *
   * @param accountAddr The associated token account address
   * @returns The owner address
   */
  async getTokenAccountOwner(tokenAddr: string): Promise<string> {
    const token = await getAccount(this.connection!, new PublicKey(tokenAddr));
    return token.owner.toString();
  }

  async getNativeBalance(
    walletAddress: string,
    chain: ChainName | ChainId,
  ): Promise<BigNumber> {
    if (!this.connection) throw new Error('no connection');
    const balance = await this.connection.getBalance(
      new PublicKey(walletAddress),
    );
    return BigNumber.from(balance);
  }

  async getTokenBalance(
    walletAddress: string,
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<BigNumber | null> {
    if (!this.connection) throw new Error('no connection');
    const address = await this.getForeignAsset(tokenId, chain);
    if (!address) return null;
    const splToken = await this.connection.getTokenAccountsByOwner(
      new PublicKey(walletAddress),
      { mint: new PublicKey(address) },
    );
    if (!splToken.value[0]) return null;
    const balance = await this.connection.getTokenAccountBalance(
      splToken.value[0].pubkey,
    );

    return BigNumber.from(balance.value.amount);
  }

  async getTokenBalances(
    walletAddress: string,
    tokenIds: TokenId[],
    chain: ChainName | ChainId,
  ): Promise<(BigNumber | null)[]> {
    if (!this.connection) throw new Error('no connection');
    const addresses = await Promise.all(
      tokenIds.map((tokenId) => this.getForeignAsset(tokenId, chain)),
    );
    const splParsedTokenAccounts =
      await this.connection.getParsedTokenAccountsByOwner(
        new PublicKey(walletAddress),
        {
          programId: new PublicKey(TOKEN_PROGRAM_ID),
        },
      );
    return addresses.map((address) => {
      if (!address) return null;
      const amount = splParsedTokenAccounts.value.find(
        (v) => v?.account.data.parsed?.info?.mint === address,
      )?.account.data.parsed?.info?.tokenAmount?.amount;
      if (!amount) return null;
      return BigNumber.from(amount);
    });
  }

  /**
   * Gets the Associate Token Address
   *
   * @param token The token id (home chain/address)
   * @param account The wallet address
   * @returns The associated token address
   */
  async getAssociatedTokenAddress(token: TokenId, account: PublicKeyInitData) {
    const solAddr = await this.mustGetForeignAsset(token, SOLANA_CHAIN_NAME);
    return await getAssociatedTokenAddress(
      new PublicKey(solAddr),
      new PublicKey(account),
      undefined,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );
  }

  async getAssociatedTokenAccount(
    token: TokenId,
    account: PublicKeyInitData,
  ): Promise<Account | null> {
    if (!this.connection) throw new Error('no connection');
    const addr = await this.getAssociatedTokenAddress(token, account);
    try {
      const account = await getAccount(this.connection, addr);
      return account;
    } catch (_) {
      return null;
    }
  }

  /**
   * Creates the Associated Token Account for a given wallet address. This must exist before a user can send a token bridge transfer, also it is the recipient address when sending the transfer.
   *
   * @param token The token id (home chain/address)
   * @param account The wallet address
   * @param commitment The commitment level
   * @returns The transaction for creating the Associated Token Account
   */
  async createAssociatedTokenAccount(
    token: TokenId,
    account: PublicKeyInitData,
    commitment?: Commitment,
  ): Promise<Transaction | void> {
    if (!this.connection) throw new Error('no connection');
    const tokenAccount = await this.getAssociatedTokenAccount(token, account);
    if (tokenAccount) return;

    const solAddr = await this.mustGetForeignAsset(token, SOLANA_CHAIN_NAME);
    const associatedAddr = await this.getAssociatedTokenAddress(token, account);
    const payerPublicKey = new PublicKey(account);
    const tokenPublicKey = new PublicKey(solAddr);
    const associatedPublicKey = new PublicKey(associatedAddr);

    const createAccountInst = createAssociatedTokenAccountInstruction(
      payerPublicKey,
      associatedPublicKey,
      payerPublicKey,
      tokenPublicKey,
    );
    const transaction = new Transaction();
    transaction.add(
      ...(await this.determineComputeBudget([
        tokenPublicKey,
        associatedPublicKey,
      ])),
    );
    transaction.add(createAccountInst);

    const { blockhash } = await this.connection.getLatestBlockhash(commitment);
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = payerPublicKey;
    return transaction;
  }

  /**
   * Prepare the transfer instructions for a native token bridge transfer from Solana
   *
   * @dev This _must_ be claimed on the destination chain, see {@link WormholeContext#redeem | redeem}
   *
   * @param senderAddress The address of the sender
   * @param amount The token amount to be sent
   * @param recipientChain The destination chain name or id
   * @param recipientAddress The associated token address where funds will be sent
   * @param relayerFee The fee that would be paid to a relayer
   * @param payload Arbitrary bytes that can contain any addition information about a given transfer
   * @param commitment The commitment level
   * @returns The transaction for sending Native SOL from Solana
   */
  private async transferNativeSol(
    senderAddress: PublicKeyInitData,
    amount: bigint,
    recipientChain: ChainId | ChainName,
    recipientAddress: Uint8Array | Buffer,
    relayerFee?: bigint,
    payload?: Uint8Array | Buffer,
    commitment?: Commitment,
  ): Promise<Transaction> {
    if (!this.connection) throw new Error('no connection');
    const contracts = this.contracts.mustGetContracts(SOLANA_CHAIN_NAME);
    if (!contracts.core || !contracts.token_bridge) {
      throw new Error('contracts not found');
    }

    const rentBalance = await getMinimumBalanceForRentExemptAccount(
      this.connection,
      commitment,
    );
    const payerPublicKey = new PublicKey(senderAddress);
    const ancillaryKeypair = Keypair.generate();

    //This will create a temporary account where the wSOL will be created.
    const createAncillaryAccountIx = SystemProgram.createAccount({
      fromPubkey: payerPublicKey,
      newAccountPubkey: ancillaryKeypair.publicKey,
      lamports: rentBalance, //spl token accounts need rent exemption
      space: ACCOUNT_SIZE,
      programId: TOKEN_PROGRAM_ID,
    });

    //Send in the amount of SOL which we want converted to wSOL
    const initialBalanceTransferIx = SystemProgram.transfer({
      fromPubkey: payerPublicKey,
      lamports: amount,
      toPubkey: ancillaryKeypair.publicKey,
    });
    //Initialize the account as a WSOL account, with the original payerAddress as owner
    const initAccountIx = createInitializeAccountInstruction(
      ancillaryKeypair.publicKey,
      NATIVE_MINT,
      payerPublicKey,
    );

    //Normal approve & transfer instructions, except that the wSOL is sent from the ancillary account.
    const approvalIx = createApproveAuthoritySignerInstruction(
      contracts.token_bridge,
      ancillaryKeypair.publicKey,
      payerPublicKey,
      amount,
    );

    const message = Keypair.generate();
    const nonce = createNonce().readUInt32LE(0);
    const tokenBridgeTransferIx = payload
      ? createTransferNativeWithPayloadInstruction(
          this.connection,
          contracts.token_bridge,
          contracts.core,
          senderAddress,
          message.publicKey,
          ancillaryKeypair.publicKey,
          NATIVE_MINT,
          nonce,
          amount,
          Buffer.from(recipientAddress),
          this.context.toChainId(recipientChain),
          payload,
        )
      : createTransferNativeInstruction(
          this.connection,
          contracts.token_bridge,
          contracts.core,
          senderAddress,
          message.publicKey,
          ancillaryKeypair.publicKey,
          NATIVE_MINT,
          nonce,
          amount,
          relayerFee || BigInt(0),
          Buffer.from(recipientAddress),
          this.context.toChainId(recipientChain),
        );

    //Close the ancillary account for cleanup. Payer address receives any remaining funds
    const closeAccountIx = createCloseAccountInstruction(
      ancillaryKeypair.publicKey, //account to close
      payerPublicKey, //Remaining funds destination
      payerPublicKey, //authority
    );

    const { blockhash } = await this.connection.getLatestBlockhash(commitment);
    const transaction = new Transaction();
    transaction.add(...(await this.determineComputeBudget([NATIVE_MINT])));

    transaction.recentBlockhash = blockhash;
    transaction.feePayer = payerPublicKey;
    transaction.add(
      createAncillaryAccountIx,
      initialBalanceTransferIx,
      initAccountIx,
      approvalIx,
      tokenBridgeTransferIx,
      closeAccountIx,
    );
    transaction.partialSign(message, ancillaryKeypair);
    return transaction;
  }

  /**
   * Prepare the transfer instructions for a token bridge transfer from Solana
   *
   * @dev This _must_ be claimed on the destination chain, see {@link WormholeContext#redeem | redeem}
   *
   * @param senderAddress The address of the sender
   * @param amount The token amount to be sent
   * @param recipientChain The destination chain name or id
   * @param recipientAddress The associated token address where funds will be sent
   * @param fromAddress The token account pubkey, owned by fromOwner address
   * @param tokenChainId The id of the token's chain
   * @param mintAddress The token address on the destination
   * @param fromOwnerAddress If not specified, will default to the sender address
   * @param relayerFee The fee that would be paid to a relayer
   * @param payload Arbitrary bytes that can contain any addition information about a given transfer
   * @param commitment The commitment level
   * @returns The transaction for sending tokens from Solana
   */
  private async transferFromSolana(
    senderAddress: PublicKeyInitData,
    amount: bigint,
    recipientChain: ChainId | ChainName,
    recipientAddress: Uint8Array | Buffer,
    fromAddress: PublicKeyInitData, // token account pubkey, owned by fromOwner address
    tokenChainId: number,
    mintAddress: Uint8Array, // token address
    fromOwnerAddress?: PublicKeyInitData,
    relayerFee?: bigint,
    payload?: Uint8Array | Buffer,
    commitment?: Commitment,
  ): Promise<Transaction> {
    if (!this.connection) throw new Error('no connection');
    const contracts = this.contracts.mustGetContracts(SOLANA_CHAIN_NAME);
    if (!contracts.core || !contracts.token_bridge) {
      throw new Error('contracts not found');
    }

    const recipientChainId = this.context.toChainId(recipientChain);
    if (fromOwnerAddress === undefined) {
      fromOwnerAddress = senderAddress;
    }
    const nonce = createNonce().readUInt32LE(0);
    const approvalIx = createApproveAuthoritySignerInstruction(
      contracts.token_bridge,
      fromAddress,
      new PublicKey(fromOwnerAddress),
      amount,
    );
    const message = Keypair.generate();

    const isSolanaNative =
      tokenChainId === undefined || tokenChainId === CHAIN_ID_SOLANA;

    const tokenBridgeTransferIx = isSolanaNative
      ? payload
        ? createTransferNativeWithPayloadInstruction(
            this.connection,
            contracts.token_bridge,
            contracts.core,
            senderAddress,
            message.publicKey,
            fromAddress,
            mintAddress,
            nonce,
            amount,
            recipientAddress,
            recipientChainId,
            payload,
          )
        : createTransferNativeInstruction(
            this.connection,
            contracts.token_bridge,
            contracts.core,
            senderAddress,
            message.publicKey,
            fromAddress,
            mintAddress,
            nonce,
            amount,
            relayerFee || BigInt(0),
            recipientAddress,
            recipientChainId,
          )
      : payload
      ? createTransferWrappedWithPayloadInstruction(
          this.connection,
          contracts.token_bridge,
          contracts.core,
          senderAddress,
          message.publicKey,
          fromAddress,
          fromOwnerAddress,
          tokenChainId,
          mintAddress,
          nonce,
          amount,
          recipientAddress,
          recipientChainId,
          payload,
        )
      : createTransferWrappedInstruction(
          this.connection,
          contracts.token_bridge,
          contracts.core,
          senderAddress,
          message.publicKey,
          fromAddress,
          fromOwnerAddress,
          tokenChainId,
          mintAddress,
          nonce,
          amount,
          relayerFee || BigInt(0),
          recipientAddress,
          recipientChainId,
        );
    const transaction = new Transaction();
    transaction.add(
      ...(await this.determineComputeBudget([
        new PublicKey(fromAddress),
        new PublicKey(mintAddress),
      ])),
    );
    transaction.add(approvalIx, tokenBridgeTransferIx);
    const { blockhash } = await this.connection.getLatestBlockhash(commitment);
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = new PublicKey(senderAddress);
    transaction.partialSign(message);
    return transaction;
  }

  async send(
    token: TokenId | typeof NATIVE,
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    relayerFee?: string,
    commitment?: Commitment,
  ): Promise<Transaction> {
    if (!this.connection) throw new Error('no connection');
    const destContext = this.context.getContext(recipientChain);
    const formattedRecipient = arrayify(
      destContext.formatAddress(recipientAddress),
    );
    const relayerFeeBN = relayerFee ? BigInt(relayerFee) : undefined;
    const amountBN = BigNumber.from(amount).toBigInt();

    if (token === NATIVE) {
      return await this.transferNativeSol(
        senderAddress,
        amountBN,
        recipientChain,
        formattedRecipient,
        relayerFeeBN,
        undefined,
        'finalized',
      );
    } else {
      const tokenContext = this.context.getContext(token.chain);
      const formattedTokenAddr = arrayify(
        await tokenContext.formatAssetAddress(token.address),
      );
      const solTokenAddr = await this.mustGetForeignAsset(
        token,
        SOLANA_CHAIN_NAME,
      );
      const splToken = await this.connection.getTokenAccountsByOwner(
        new PublicKey(senderAddress),
        { mint: new PublicKey(solTokenAddr) },
      );
      if (!splToken || !splToken.value[0])
        throw new Error('account does not have any token balance');

      return await this.transferFromSolana(
        senderAddress,
        amountBN,
        recipientChain,
        formattedRecipient,
        splToken.value[0].pubkey,
        this.context.toChainId(token.chain),
        formattedTokenAddr,
        undefined,
        relayerFeeBN,
        undefined,
        'finalized',
      );
    }
  }

  async sendWithPayload(
    token: TokenId | typeof NATIVE,
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    payload: Uint8Array | Buffer,
    commitment?: Commitment,
  ): Promise<Transaction> {
    if (!this.connection) throw new Error('no connection');
    const amountBN = BigInt(amount);
    const destContext = this.context.getContext(recipientChain);
    const formattedRecipient = arrayify(
      destContext.formatAddress(recipientAddress),
    );

    if (token === NATIVE) {
      return await this.transferNativeSol(
        senderAddress,
        amountBN,
        recipientChain,
        formattedRecipient,
        undefined,
        payload,
        'finalized',
      );
    } else {
      const tokenContext = this.context.getContext(token.chain);
      const formattedTokenAddr = arrayify(
        await tokenContext.formatAssetAddress(token.address),
      );
      const solTokenAddr = await this.mustGetForeignAsset(
        token,
        SOLANA_CHAIN_NAME,
      );
      const splToken = await this.connection.getTokenAccountsByOwner(
        new PublicKey(senderAddress),
        { mint: new PublicKey(solTokenAddr) },
      );
      if (!splToken || !splToken.value[0])
        throw new Error('account does not have any token balance');

      return await this.transferFromSolana(
        senderAddress,
        amountBN,
        recipientChain,
        formattedRecipient,
        splToken.value[0].pubkey,
        this.context.resolveDomain(token.chain),
        formattedTokenAddr,
        undefined,
        undefined,
        payload,
        'finalized',
      );
    }
  }

  async estimateSendGas(
    token: TokenId | typeof NATIVE,
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
  ): Promise<BigNumber> {
    throw new Error('not implemented');
  }
  async estimateClaimGas(
    destChain: ChainName | ChainId,
    VAA: Uint8Array,
  ): Promise<BigNumber> {
    throw new Error('not implemented');
  }

  formatAddress(address: PublicKeyInitData): Uint8Array {
    const addr =
      typeof address === 'string' && address.startsWith('0x')
        ? arrayify(address)
        : address;
    return arrayify(zeroPad(new PublicKey(addr).toBytes(), 32));
  }

  async estimateSendWithRelayGas(
    token: TokenId | typeof NATIVE,
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    relayerFee: any,
    toNativeToken: string,
  ): Promise<BigNumber> {
    throw new Error('not implemented');
  }

  parseAddress(address: string): string {
    const addr =
      typeof address === 'string' && address.startsWith('0x')
        ? arrayify(address)
        : address;
    return new PublicKey(addr).toString();
  }

  async formatAssetAddress(address: string): Promise<Uint8Array> {
    return this.formatAddress(address);
  }

  async parseAssetAddress(address: string): Promise<string> {
    return this.parseAddress(address);
  }

  async getForeignAsset(
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<string | null> {
    const chainName = this.context.toChainName(chain);
    if (this.foreignAssetCache.get(tokenId.chain, tokenId.address, chainName)) {
      return this.foreignAssetCache.get(
        tokenId.chain,
        tokenId.address,
        chainName,
      )!;
    }

    if (!this.connection) throw new Error('no connection');

    const chainId = this.context.toChainId(tokenId.chain);
    const toChainId = this.context.toChainId(chain);
    if (toChainId === chainId) return tokenId.address;

    const contracts = this.context.mustGetContracts(chain);
    if (!contracts.token_bridge) throw new Error('contracts not found');

    const tokenContext = this.context.getContext(tokenId.chain);
    const formattedAddr = await tokenContext.formatAssetAddress(
      tokenId.address,
    );
    const addr = await getForeignAssetSolana(
      this.connection,
      contracts.token_bridge,
      chainId,
      arrayify(formattedAddr),
    );
    if (!addr) return null;
    this.foreignAssetCache.set(tokenId.chain, tokenId.address, chainName, addr);
    return addr;
  }

  async getMessage(
    tx: string,
    chain: ChainName | ChainId,
    parseRelayerPayload: boolean = true,
  ): Promise<ParsedMessage | ParsedRelayerMessage> {
    if (!this.connection) throw new Error('no connection');
    const contracts = this.contracts.mustGetContracts(SOLANA_CHAIN_NAME);
    if (!contracts.core || !contracts.token_bridge)
      throw new Error('contracts not found');
    const response = await this.connection.getTransaction(tx);
    if (!response || !response.meta?.innerInstructions![0].instructions)
      throw new Error('transaction not found');
    const transaction = await this.connection.getParsedTransaction(tx);

    // the first instruction may be creating the associated token account
    // for an automatic transfer of the native token
    const wormholeInstructionIndex =
      response.meta?.innerInstructions.length - 1;
    const instructions =
      response.meta?.innerInstructions![wormholeInstructionIndex].instructions;
    const accounts = response.transaction.message.accountKeys;

    // find the instruction where the programId equals the Wormhole ProgramId and the emitter equals the Token Bridge
    const bridgeInstructions = instructions.filter((i) => {
      const programId = accounts[i.programIdIndex].toString();
      const emitterId = accounts[i.accounts[2]];
      const wormholeCore = contracts.core;
      const tokenBridge = deriveWormholeEmitterKey(contracts.token_bridge!);
      return programId === wormholeCore && emitterId.equals(tokenBridge);
    });

    const messageAccount = accounts[bridgeInstructions[0].accounts[1]];
    const { message } = await getPostedMessage(
      this.connection,
      messageAccount,
      'finalized',
    );

    const parsedInstr = transaction?.meta?.innerInstructions![0].instructions;
    const gasFee = parsedInstr
      ? parsedInstr.reduce((acc, c: any) => {
          if (!c.parsed || !c.parsed.info || !c.parsed.info.lamports)
            return acc;
          return acc + c.parsed.info.lamports;
        }, 0)
      : 0;

    // parse message payload
    const transfer = parseTokenTransferPayload(message.payload);

    // get sequence
    let sequence = response.meta?.logMessages
      ?.filter((msg) => msg.startsWith(SOLANA_SEQ_LOG))?.[0]
      ?.replace(SOLANA_SEQ_LOG, '');

    if (!sequence) {
      // fallback to message account data
      const info = await this.connection.getAccountInfo(messageAccount);
      sequence = info?.data.readBigUInt64LE(49).toString();

      if (!sequence) {
        throw new Error('sequence not found');
      }
    }

    // format response
    const tokenContext = this.context.getContext(
      transfer.tokenChain as ChainId,
    );
    const destContext = this.context.getContext(transfer.toChain as ChainId);

    const tokenAddress = await tokenContext.parseAssetAddress(
      hexlify(transfer.tokenAddress),
    );
    const tokenChain = this.context.toChainName(transfer.tokenChain);

    const fromChain = this.context.toChainName(chain);
    const toChain = this.context.toChainName(transfer.toChain);
    const toAddress = destContext.parseAddress(hexlify(transfer.to));

    const parsedMessage: ParsedMessage = {
      sendTx: tx,
      sender: accounts[0].toString(),
      amount: BigNumber.from(transfer.amount),
      payloadID: transfer.payloadType,
      recipient: toAddress,
      toChain,
      fromChain,
      tokenAddress,
      tokenChain,
      tokenId: {
        chain: tokenChain,
        address: tokenAddress,
      },
      sequence: BigNumber.from(sequence),
      emitterAddress:
        this.context.conf.env === 'MAINNET'
          ? SOLANA_MAINNET_EMMITER_ID
          : SOLANA_TESTNET_EMITTER_ID,
      gasFee: BigNumber.from(gasFee),
      block: response.slot,
      payload: transfer.tokenTransferPayload.length
        ? hexlify(transfer.tokenTransferPayload)
        : undefined,
    };

    if (parseRelayerPayload && parsedMessage.payloadID === 3) {
      const destContext = this.context.getContext(transfer.toChain as ChainId);
      const parsedPayload = destContext.parseRelayerPayload(
        transfer.tokenTransferPayload,
      );
      const parsedPayloadMessage: ParsedRelayerMessage = {
        ...parsedMessage,
        relayerPayloadId: parsedPayload.relayerPayloadId,
        recipient: destContext.parseAddress(parsedPayload.to),
        to: toAddress,
        relayerFee: parsedPayload.relayerFee,
        toNativeTokenAmount: parsedPayload.toNativeTokenAmount,
        payload: transfer.tokenTransferPayload.length
          ? hexlify(transfer.tokenTransferPayload)
          : undefined,
      };
      return parsedPayloadMessage;
    }

    return parsedMessage;
  }

  async redeem(
    destChain: ChainName | ChainId,
    signedVAA: Uint8Array,
    overrides: any,
    payerAddr?: PublicKeyInitData,
  ): Promise<Transaction> {
    if (!payerAddr)
      throw new Error(
        'receiving wallet address required for redeeming on Solana',
      );
    if (!this.connection) throw new Error('no connection');
    const contracts = this.contracts.mustGetContracts(SOLANA_CHAIN_NAME);
    if (!contracts.core || !contracts.token_bridge) {
      throw new Error('contracts not found for solana');
    }

    const parsed = parseTokenTransferVaa(signedVAA);
    const isNativeSol =
      parsed.tokenChain === MAINNET_CHAINS.solana &&
      new PublicKey(parsed.tokenAddress).equals(NATIVE_MINT);
    if (isNativeSol) {
      return await redeemAndUnwrapOnSolana(
        this.connection,
        contracts.core,
        contracts.token_bridge,
        payerAddr,
        signedVAA,
      );
    } else {
      return await redeemOnSolana(
        this.connection,
        contracts.core,
        contracts.token_bridge,
        payerAddr,
        signedVAA,
      );
    }
  }

  async redeemRelay(
    destChain: ChainName | ChainId,
    signedVAA: Uint8Array,
    overrides: any,
    payerAddr?: string,
  ): Promise<Transaction> {
    if (!payerAddr)
      throw new Error(
        'receiving wallet address required for redeeming on Solana',
      );
    if (!this.connection) throw new Error('no connection');
    const { core, token_bridge, relayer } =
      this.contracts.mustGetContracts(SOLANA_CHAIN_NAME);
    if (!core || !token_bridge || !relayer) {
      throw new Error('contracts not found');
    }
    const parsed = parseTokenTransferVaa(signedVAA);
    const { to } = this.parseRelayerPayload(parsed.tokenTransferPayload);
    const recipient = new PublicKey(arrayify(to));
    if (!recipient.equals(new PublicKey(payerAddr))) {
      throw new Error('recipient address does not match payer address');
    }
    const isNative = parsed.tokenChain === MAINNET_CHAINS.solana;
    const mint = isNative
      ? new PublicKey(parsed.tokenAddress)
      : deriveWrappedMintKey(
          token_bridge,
          parsed.tokenChain,
          parsed.tokenAddress,
        );
    const transaction = new Transaction();
    transaction.add(...(await this.determineComputeBudget([mint])));
    const recipientTokenAccount = getAssociatedTokenAddressSync(
      mint,
      recipient,
    );
    const recipientTokenAccountInfo = await this.connection.getAccountInfo(
      recipientTokenAccount,
    );
    // Create the associated token account if it doesn't exist
    if (!recipientTokenAccountInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          recipient,
          recipientTokenAccount,
          recipient,
          mint,
        ),
      );
    }
    let redeemIx: TransactionInstruction;
    if (isNative) {
      redeemIx = await createCompleteNativeTransferWithRelayInstruction(
        this.connection,
        relayer,
        recipient,
        token_bridge,
        core,
        signedVAA,
        recipient,
      );
    } else {
      redeemIx = await createCompleteWrappedTransferWithRelayInstruction(
        this.connection,
        relayer,
        recipient,
        token_bridge,
        core,
        signedVAA,
        recipient,
      );
    }
    transaction.add(redeemIx);
    const { blockhash } = await this.connection.getLatestBlockhash('finalized');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = new PublicKey(recipient);
    return transaction;
  }

  async isTransferCompleted(
    destChain: ChainName | ChainId,
    signedVaa: string,
  ): Promise<boolean> {
    if (!this.connection) throw new Error('no connection');
    const parsed = parseVaa(arrayify(signedVaa, { allowMissingPrefix: true }));
    const tokenBridge = this.contracts.mustGetBridge(destChain);
    return getClaim(
      this.connection,
      tokenBridge.programId,
      parsed.emitterAddress,
      parsed.emitterChain,
      parsed.sequence,
      'finalized',
    ).catch((e) => false);
  }

  async fetchRedeemedSignature(
    emitterChainId: ChainId,
    emitterAddress: string,
    sequence: string,
  ): Promise<string | null> {
    if (!this.connection) throw new Error('no connection');
    const tokenBridge = this.contracts.mustGetBridge(SOLANA_CHAIN_NAME);
    const claimKey = deriveClaimKey(
      tokenBridge.programId,
      emitterAddress,
      emitterChainId,
      BigInt(sequence),
    );
    const signatures = await this.connection.getSignaturesForAddress(claimKey, {
      limit: 1,
    });
    return signatures ? signatures[0].signature : null;
  }

  async getCurrentBlock(): Promise<number> {
    if (!this.connection) throw new Error('no connection');
    return await this.connection.getSlot();
  }

  async sendWithRelay(
    token: TokenId | 'native',
    amount: string,
    toNativeToken: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    overrides?: any,
  ): Promise<Transaction> {
    if (!this.connection) throw new Error('no connection');
    const { core, token_bridge, relayer } =
      this.contracts.mustGetContracts(SOLANA_CHAIN_NAME);
    if (!core || !token_bridge || !relayer) {
      throw new Error('contracts not found');
    }
    const destContext = this.context.getContext(recipientChain);
    const formattedRecipient = arrayify(
      destContext.formatAddress(recipientAddress),
    );
    const recipientChainId = this.context.toChainId(recipientChain);
    const nonce = createNonce().readUint32LE();
    const transaction = new Transaction();

    if (token === NATIVE || token.chain === SOLANA_CHAIN_NAME) {
      const mint = token === NATIVE ? NATIVE_MINT : token.address;
      const wrapToken = token === NATIVE;

      let writableAddresses: PublicKey[] = [NATIVE_MINT];

      if (wrapToken) {
        const ata = getAssociatedTokenAddressSync(
          NATIVE_MINT,
          new PublicKey(senderAddress),
        );

        writableAddresses.push(ata);

        try {
          await getAccount(this.connection, ata);
        } catch (e: any) {
          if (e instanceof TokenAccountNotFoundError) {
            // the relayer expects the WSOL associated token account to exist
            const createAccountInst = createAssociatedTokenAccountInstruction(
              new PublicKey(senderAddress),
              new PublicKey(ata),
              new PublicKey(senderAddress),
              new PublicKey(NATIVE_MINT),
            );
            transaction.add(createAccountInst);
          } else {
            throw e;
          }
        }
      }

      transaction.add(
        ...(await this.determineComputeBudget(writableAddresses)),
      );
      transaction.add(
        await createTransferNativeTokensWithRelayInstruction(
          this.connection,
          relayer,
          senderAddress,
          token_bridge,
          core,
          mint,
          BigInt(amount),
          BigInt(toNativeToken),
          formattedRecipient,
          recipientChainId,
          nonce,
          wrapToken,
        ),
      );
    } else {
      const mint = await this.mustGetForeignAsset(token, sendingChain);

      transaction.add(
        ...(await this.determineComputeBudget([new PublicKey(mint)])),
      );
      transaction.add(
        await createTransferWrappedTokensWithRelayInstruction(
          this.connection,
          relayer,
          senderAddress,
          token_bridge,
          core,
          mint,
          BigInt(amount),
          BigInt(toNativeToken),
          formattedRecipient,
          recipientChainId,
          nonce,
        ),
      );
    }

    const { blockhash } = await this.connection.getLatestBlockhash('finalized');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = new PublicKey(senderAddress);
    return transaction;
  }

  async calculateNativeTokenAmt(
    destChain: ChainName | ChainId,
    tokenId: TokenId,
    amount: BigNumberish,
    walletAddress: string,
  ): Promise<BigNumber> {
    const relayer = this.contracts.mustGetTokenBridgeRelayer(destChain);
    const address = await this.mustGetForeignAsset(tokenId, destChain);
    const decimals = await this.fetchTokenDecimals(address, destChain);
    const nativeTokenAmount = await relayer.calculateNativeSwapAmountOut(
      new PublicKey(address),
      BigNumber.from(amount).toBigInt(),
      decimals,
    );
    // an non-existent account cannot be sent less than the rent exempt amount
    // in order to create the wallet, it must be sent at least the rent exemption minimum
    const acctExists =
      (await this.connection!.getAccountInfo(new PublicKey(walletAddress))) !==
      null;
    if (acctExists) return BigNumber.from(nativeTokenAmount);
    const minBalance = await this.connection!.getMinimumBalanceForRentExemption(
      0,
    );
    return nativeTokenAmount > minBalance
      ? BigNumber.from(nativeTokenAmount)
      : BigNumber.from(0);
  }

  async calculateMaxSwapAmount(
    destChain: ChainName | ChainId,
    tokenId: TokenId,
    walletAddress: string,
  ): Promise<BigNumber> {
    const relayer = this.contracts.mustGetTokenBridgeRelayer(destChain);
    const address = await this.mustGetForeignAsset(tokenId, destChain);
    const decimals = await this.fetchTokenDecimals(address, destChain);
    const maxSwap = await relayer.calculateMaxSwapAmountIn(
      new PublicKey(address),
      decimals,
    );
    return BigNumber.from(maxSwap);
  }

  async getRelayerFee(
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    tokenId: TokenId,
  ): Promise<BigNumber> {
    const relayer = this.contracts.mustGetTokenBridgeRelayer(sourceChain);
    const address = await this.mustGetForeignAsset(tokenId, sourceChain);
    const decimals = await this.fetchTokenDecimals(address, sourceChain);
    const destChainId = this.context.toChainId(destChain);
    const fee = await relayer.calculateRelayerFee(
      destChainId,
      new PublicKey(address),
      decimals,
    );
    return BigNumber.from(fee);
  }

  async getWrappedNativeTokenId(chain: ChainName | ChainId): Promise<TokenId> {
    return {
      address: NATIVE_MINT.toString(),
      chain: 'solana',
    };
  }

  async determineComputeBudget(
    lockedWritableAccounts: PublicKey[] = [],
  ): Promise<TransactionInstruction[]> {
    let fee = 100_000; // Set fee to 100,000 microlamport by default

    const recentFeesResponse =
      await this.connection?.getRecentPrioritizationFees({
        lockedWritableAccounts,
      });

    try {
      if (recentFeesResponse) {
        // Get 75th percentile fee paid in recent slots
        const recentFees = recentFeesResponse
          .map((dp) => dp.prioritizationFee)
          .sort((a, b) => a - b);
        fee = recentFees[Math.floor(recentFees.length * SOLANA_FEE_PERCENTILE)];
      }
    } catch (e) {
      console.error('Error fetching Solana recent fees', e);
    }

    console.info(`Setting Solana compute unit price to ${fee} microLamports`);

    return [
      ComputeBudgetProgram.setComputeUnitLimit({
        units: 250_000,
      }),
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: fee,
      }),
    ];
  }
}
