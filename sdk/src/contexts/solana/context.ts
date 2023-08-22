import {
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
} from '@solana/spl-token';
import {
  clusterApiUrl,
  Commitment,
  Connection,
  Keypair,
  PublicKey,
  PublicKeyInitData,
  SystemProgram,
  Transaction,
  TransactionResponse,
} from '@solana/web3.js';
import { BigNumber } from 'ethers';
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
  ParsedRelayerPayload,
  ParsedRelayerMessage,
  VaaInfo,
} from '../../types';
import { SolContracts } from './contracts';
import { WormholeContext } from '../../wormhole';
import {
  createTransferNativeInstruction,
  createTransferWrappedInstruction,
  createTransferNativeWithPayloadInstruction,
  createApproveAuthoritySignerInstruction,
  createTransferWrappedWithPayloadInstruction,
} from './utils/tokenBridge';
import {
  PostedMessageData,
  deriveWormholeEmitterKey,
  getClaim,
} from './utils/wormhole';
import { TokenBridgeAbstract } from '../abstracts/tokenBridge';
import { getAccountData } from './utils';
import base58 from 'bs58';

const SOLANA_CHAIN_NAME = MAINNET_CONFIG.chains.solana!.key;

const SOLANA_MAINNET_EMMITER_ID =
  'ec7372995d5cc8732397fb0ad35c0121e0eaa90d26f828a534cab54391b3a4f5';
const SOLANA_TESTNET_EMITTER_ID =
  '3b26409f8aaded3f5ddca184695aa6a0fa829b0c85caf84856324896d214ca98';

/**
 * @category Solana
 */
export class SolanaContext<
  T extends WormholeContext,
> extends TokenBridgeAbstract<Transaction> {
  readonly type = Context.SOLANA;
  protected contracts: SolContracts<T>;
  readonly context: T;
  connection: Connection | undefined;

  constructor(context: T) {
    super();
    this.context = context;
    const tag = context.environment === 'MAINNET' ? 'mainnet-beta' : 'devnet';
    this.connection = new Connection(
      context.conf.rpcs.solana || clusterApiUrl(tag),
    );
    this.contracts = new SolContracts(context);
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
    const transaction = new Transaction().add(createAccountInst);
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

    const tokenBridgeTransferIx = payload
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
    const transaction = new Transaction().add(
      approvalIx,
      tokenBridgeTransferIx,
    );
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

  formatAddress(address: PublicKeyInitData): Uint8Array {
    const addr =
      typeof address === 'string' && address.startsWith('0x')
        ? arrayify(address)
        : address;
    return arrayify(zeroPad(new PublicKey(addr).toBytes(), 32));
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
    return addr;
  }

  async mustGetForeignAsset(
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<string> {
    const addr = await this.getForeignAsset(tokenId, chain);
    if (!addr) throw new Error('token not registered');
    return addr;
  }

  async getVaa(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<VaaInfo<TransactionResponse>> {
    if (!this.connection) throw new Error('no connection');
    const contracts = this.contracts.mustGetContracts(SOLANA_CHAIN_NAME);
    if (!contracts.core || !contracts.token_bridge)
      throw new Error('contracts not found');
    const response = await this.connection.getTransaction(tx);
    if (!response || !response.meta?.innerInstructions![0].instructions)
      throw new Error('transaction not found');

    const instructions = response.meta?.innerInstructions![0].instructions;
    const accounts = response.transaction.message.accountKeys;

    // find the instruction where the programId equals the Wormhole ProgramId and the emitter equals the Token Bridge
    const bridgeInstructions = instructions.filter((i) => {
      const programId = accounts[i.programIdIndex].toString();
      const emitterId = accounts[i.accounts[2]];
      const wormholeCore = contracts.core;
      const tokenBridge = deriveWormholeEmitterKey(contracts.token_bridge!);
      return programId === wormholeCore && emitterId.equals(tokenBridge);
    });

    const messageKey = accounts[bridgeInstructions[0].accounts[1]];
    const messageAccountInfo = await this.connection.getAccountInfo(
      new PublicKey(messageKey),
    );
    const vaaBytes = getAccountData(messageAccountInfo);
    const { message } = PostedMessageData.deserialize(vaaBytes);

    return {
      transaction: response,
      rawVaa: vaaBytes,
      vaa: {
        ...message,
        version: message.vaaVersion,
        timestamp: message.vaaTime,
        hash: Buffer.from([]),
        guardianSetIndex: 0,
        guardianSignatures: [],
      },
    };
  }

  async parseMessage(
    info: VaaInfo<TransactionResponse>,
  ): Promise<ParsedMessage | ParsedRelayerMessage> {
    const { transaction, vaa } = info;
    if (!this.connection) throw new Error('no connection');

    const parsedInstr = transaction?.meta?.innerInstructions![0].instructions;
    const gasFee = parsedInstr
      ? parsedInstr.reduce((acc, c: any) => {
          if (!c.parsed || !c.parsed.info || !c.parsed.info.lamports)
            return acc;
          return acc + c.parsed.info.lamports;
        }, 0)
      : 0;

    const sender = transaction.transaction.message.accountKeys[0].toString();

    const txId = base58.encode(
      Transaction.populate(
        transaction.transaction.message,
        transaction.transaction.signatures,
      ).signature!,
    );
    // parse message payload
    const transfer = parseTokenTransferPayload(vaa.payload);

    // format response
    const tokenContext = this.context.getContext(
      transfer.tokenChain as ChainId,
    );
    const destContext = this.context.getContext(transfer.toChain as ChainId);

    const tokenAddress = await tokenContext.parseAssetAddress(
      hexlify(transfer.tokenAddress),
    );
    const tokenChain = this.context.toChainName(transfer.tokenChain);

    const fromChain = this.context.toChainName(vaa.emitterChain);
    const toChain = this.context.toChainName(transfer.toChain);
    const toAddress = destContext.parseAddress(hexlify(transfer.to));

    const parsedMessage: ParsedMessage = {
      sendTx: txId,
      sender,
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
      sequence: BigNumber.from(vaa.sequence),
      emitterAddress:
        this.context.conf.env === 'MAINNET'
          ? SOLANA_MAINNET_EMMITER_ID
          : SOLANA_TESTNET_EMITTER_ID,
      gasFee: BigNumber.from(gasFee),
      block: transaction.slot,
    };

    if (parsedMessage.payloadID === 3) {
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
    const tokenChain = parsed.tokenChain;
    if (tokenChain === MAINNET_CHAINS.solana) {
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

  async getCurrentBlock(): Promise<number> {
    if (!this.connection) throw new Error('no connection');
    return await this.connection.getSlot();
  }

  parseRelayerPayload(payload: Buffer): ParsedRelayerPayload {
    throw new Error('relaying is not supported on solana');
  }
}
