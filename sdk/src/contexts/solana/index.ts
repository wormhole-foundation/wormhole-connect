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
} from '../../types';
import { SolContracts } from './contracts';
import { WormholeContext } from '../../wormhole';
import {
  createTransferNativeInstruction,
  createTransferWrappedInstruction,
  createApproveAuthoritySignerInstruction,
} from './solana/tokenBridge';
import {
  deriveWormholeEmitterKey,
  getClaim,
  getPostedMessage,
} from './solana/wormhole';
import { TokenBridgeAbstract } from '../abstracts/tokenBridge';

const SOLANA_SEQ_LOG = 'Program log: Sequence: ';
const SOLANA_CHAIN_NAME = MAINNET_CONFIG.chains.solana!.key;

const SOLANA_MAINNET_EMMITER_ID =
  'ec7372995d5cc8732397fb0ad35c0121e0eaa90d26f828a534cab54391b3a4f5';
const SOLANA_TESTNET_EMITTER_ID =
  '3b26409f8aaded3f5ddca184695aa6a0fa829b0c85caf84856324896d214ca98';

export class SolanaContext<
  T extends WormholeContext,
> extends TokenBridgeAbstract {
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
    const tokenBridgeTransferIx = createTransferNativeInstruction(
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

    const tokenBridgeTransferIx = createTransferWrappedInstruction(
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
      // TODO: I don't think this is right, we should be passing the external address to formatAssetAddress
      const formattedTokenAddr = arrayify(
        await destContext.formatAssetAddress(token.address),
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
      const formattedTokenAddr = arrayify(
        await destContext.formatAssetAddress(token.address),
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

  formatAddress(address: PublicKeyInitData): string {
    const addr =
      typeof address === 'string' && address.startsWith('0x')
        ? arrayify(address)
        : address;
    return hexlify(zeroPad(new PublicKey(addr).toBytes(), 32));
  }

  parseAddress(address: string): string {
    const addr =
      typeof address === 'string' && address.startsWith('0x')
        ? arrayify(address)
        : address;
    return new PublicKey(addr).toString();
  }

  async formatAssetAddress(address: string): Promise<string> {
    return this.formatAddress(address);
  }

  async parseAssetAddress(address: any): Promise<string> {
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

  async parseMessageFromTx(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<ParsedMessage[]> {
    if (!this.connection) throw new Error('no connection');
    const contracts = this.contracts.mustGetContracts(SOLANA_CHAIN_NAME);
    if (!contracts.core || !contracts.token_bridge)
      throw new Error('contracts not found');
    const response = await this.connection.getTransaction(tx);
    const parsedResponse = await this.connection.getParsedTransaction(tx);
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
    const { message } = await getPostedMessage(
      this.connection,
      accounts[bridgeInstructions[0].accounts[1]],
    );

    const parsedInstr =
      parsedResponse?.meta?.innerInstructions![0].instructions;
    const gasFee = parsedInstr
      ? parsedInstr.reduce((acc, c: any) => {
          if (!c.parsed || !c.parsed.info || !c.parsed.info.lamports)
            return acc;
          return acc + c.parsed.info.lamports;
        }, 0)
      : 0;

    // parse message payload
    const parsed = parseTokenTransferPayload(message.payload);

    // get sequence
    const sequence = response.meta?.logMessages
      ?.filter((msg) => msg.startsWith(SOLANA_SEQ_LOG))?.[0]
      ?.replace(SOLANA_SEQ_LOG, '');
    if (!sequence) {
      throw new Error('sequence not found');
    }

    // format response
    const tokenContext = this.context.getContext(parsed.tokenChain as ChainId);
    const destContext = this.context.getContext(parsed.toChain as ChainId);

    const tokenAddress = await tokenContext.parseAssetAddress(
      hexlify(parsed.tokenAddress),
    );
    const tokenChain = this.context.toChainName(parsed.tokenChain);

    const parsedMessage: ParsedMessage = {
      sendTx: tx,
      sender: accounts[0].toString(),
      amount: BigNumber.from(parsed.amount),
      payloadID: parsed.payloadType,
      recipient: destContext.parseAddress(hexlify(parsed.to)),
      toChain: this.context.toChainName(parsed.toChain),
      fromChain: this.context.toChainName(chain),
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
    };
    return [parsedMessage];
  }

  async redeem(
    destChain: ChainName | ChainId,
    signedVAA: Uint8Array,
    overrides: any,
    payerAddr?: PublicKeyInitData,
  ): Promise<any> {
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
    const parsed = parseVaa(arrayify(signedVaa));
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

  getTxIdFromReceipt(receipt: Transaction) {
    return receipt.signatures[0].publicKey.toString();
  }
}
