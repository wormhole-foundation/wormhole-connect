import { createNonce, hexToUint8Array } from '@certusone/wormhole-sdk';
import { WormholeContext } from '../wormhole';
import { Context } from './contextAbstract';
import { TokenId, ChainName, ChainId, NATIVE } from '../types';
import {
  ACCOUNT_SIZE,
  createCloseAccountInstruction,
  createInitializeAccountInstruction,
  getMinimumBalanceForRentExemptAccount,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  Commitment,
  Connection,
  Keypair,
  PublicKey,
  PublicKeyInitData,
  SystemProgram,
  Transaction as SolanaTransaction,
  TransactionResponse,
} from '@solana/web3.js';
import {
  createApproveAuthoritySignerInstruction,
  createTransferNativeInstruction,
  createTransferNativeWithPayloadInstruction,
  createTransferWrappedInstruction,
  createTransferWrappedWithPayloadInstruction,
} from '@certusone/wormhole-sdk/lib/cjs/solana/tokenBridge';
import { deriveWormholeEmitterKey } from '@certusone/wormhole-sdk/lib/cjs/solana/wormhole';
const SOLANA_SEQ_LOG = 'Program log: Sequence: ';

export class SolanaContext<T extends WormholeContext> extends Context {
  readonly context: T;

  constructor(context: T) {
    super();
    this.context = context;
  }

  private async transferNativeSol(
    connection: Connection,
    coreAddress: string,
    tokenBridgeAddress: string,
    senderAddress: PublicKeyInitData,
    amount: bigint,
    recipientChain: ChainId | ChainName,
    recipientAddress: Uint8Array | Buffer,
    relayerFee?: bigint,
    payload?: Uint8Array | Buffer,
    commitment?: Commitment,
  ): Promise<SolanaTransaction> {
    const rentBalance = await getMinimumBalanceForRentExemptAccount(
      connection,
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
      tokenBridgeAddress,
      ancillaryKeypair.publicKey,
      payerPublicKey,
      amount,
    );

    const message = Keypair.generate();
    const nonce = createNonce().readUInt32LE(0);
    const tokenBridgeTransferIx = payload
      ? createTransferNativeWithPayloadInstruction(
          tokenBridgeAddress,
          coreAddress,
          senderAddress,
          message.publicKey,
          ancillaryKeypair.publicKey,
          NATIVE_MINT,
          nonce,
          amount,
          Buffer.from(recipientAddress),
          this.context.resolveDomain(recipientChain),
          payload,
        )
      : createTransferNativeInstruction(
          tokenBridgeAddress,
          coreAddress,
          senderAddress,
          message.publicKey,
          ancillaryKeypair.publicKey,
          NATIVE_MINT,
          nonce,
          amount,
          relayerFee || BigInt(0),
          Buffer.from(recipientAddress),
          this.context.resolveDomain(recipientChain),
        );

    //Close the ancillary account for cleanup. Payer address receives any remaining funds
    const closeAccountIx = createCloseAccountInstruction(
      ancillaryKeypair.publicKey, //account to close
      payerPublicKey, //Remaining funds destination
      payerPublicKey, //authority
    );

    const { blockhash } = await connection.getLatestBlockhash(commitment);
    const transaction = new SolanaTransaction();
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
    connection: Connection,
    coreAddress: string,
    tokenBridgeAddress: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    amount: bigint,
    recipientChain: ChainId | ChainName,
    recipientAddress: Uint8Array | Buffer,
    fromAddress: PublicKeyInitData, // token account pubkey, owned by fromOwner address
    mintAddress: PublicKeyInitData, // token address
    fromOwnerAddress?: PublicKeyInitData,
    relayerFee?: bigint,
    payload?: Uint8Array | Buffer,
    commitment?: Commitment,
  ): Promise<SolanaTransaction> {
    const sendingChainId = this.context.resolveDomain(sendingChain) as ChainId;
    const recipientChainId = this.context.resolveDomain(
      recipientChain,
    ) as ChainId;
    if (fromOwnerAddress === undefined) {
      fromOwnerAddress = senderAddress;
    }
    const nonce = createNonce().readUInt32LE(0);
    const approvalIx = createApproveAuthoritySignerInstruction(
      tokenBridgeAddress,
      fromAddress,
      fromOwnerAddress,
      amount,
    );
    const message = Keypair.generate();
    const isSolanaNative =
      sendingChainId === this.context.resolveDomain('solana');
    if (!isSolanaNative && !senderAddress) {
      return Promise.reject(
        'originAddress is required when specifying originChain',
      );
    }
    const tokenBridgeTransferIx = isSolanaNative
      ? // native transfers
        payload
        ? createTransferNativeWithPayloadInstruction(
            tokenBridgeAddress,
            coreAddress,
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
            tokenBridgeAddress,
            coreAddress,
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
      : // non-native transfers
      payload
      ? createTransferWrappedWithPayloadInstruction(
          tokenBridgeAddress,
          coreAddress,
          senderAddress,
          message.publicKey,
          fromAddress,
          fromOwnerAddress,
          sendingChainId,
          hexToUint8Array(senderAddress),
          nonce,
          amount,
          recipientAddress,
          recipientChainId,
          payload,
        )
      : createTransferWrappedInstruction(
          tokenBridgeAddress,
          coreAddress,
          senderAddress,
          message.publicKey,
          fromAddress,
          fromOwnerAddress,
          sendingChainId,
          hexToUint8Array(senderAddress),
          nonce,
          amount,
          relayerFee || BigInt(0),
          recipientAddress,
          recipientChainId,
        );
    const transaction = new SolanaTransaction().add(
      approvalIx,
      tokenBridgeTransferIx,
    );
    const { blockhash } = await connection.getLatestBlockhash(commitment);
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
  ): Promise<SolanaTransaction> {
    const networkName = this.context.resolveDomainName(
      sendingChain,
    ) as ChainName;
    const rpc = this.context.conf.rpcs[networkName];
    if (!rpc) throw new Error(`No connection available for ${networkName}`);
    const connection = new Connection(rpc, 'confirmed');
    const coreAddress = this.context.mustGetCore(sendingChain).address;
    const tokenBridgeAddress = this.context.mustGetBridge(sendingChain).address;
    const amountBN = BigInt(amount);
    const relayerFeeBN = relayerFee ? BigInt(relayerFee) : undefined;

    if (token === NATIVE) {
      return await this.transferNativeSol(
        connection,
        coreAddress,
        tokenBridgeAddress,
        senderAddress,
        amountBN,
        recipientChain,
        hexToUint8Array(recipientAddress),
        relayerFeeBN,
        undefined,
        commitment,
      );
    } else {
      return await this.transferFromSolana(
        connection,
        coreAddress,
        tokenBridgeAddress,
        sendingChain,
        senderAddress,
        amountBN,
        recipientChain,
        hexToUint8Array(recipientAddress),
        senderAddress,
        token.address,
        relayerFeeBN,
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
  ): Promise<SolanaTransaction> {
    const networkName = this.context.resolveDomainName(
      sendingChain,
    ) as ChainName;
    const rpc = this.context.conf.rpcs[networkName];
    if (!rpc) throw new Error(`No connection available for ${networkName}`);
    const connection = new Connection(rpc, 'confirmed');
    const coreAddress = this.context.mustGetCore(sendingChain).address;
    const tokenBridgeAddress = this.context.mustGetBridge(sendingChain).address;
    const amountBN = BigInt(amount);

    if (token === NATIVE) {
      return await this.transferNativeSol(
        connection,
        coreAddress,
        tokenBridgeAddress,
        senderAddress,
        amountBN,
        recipientChain,
        hexToUint8Array(recipientAddress),
        undefined,
        payload,
        commitment,
      );
    } else {
      return await this.transferFromSolana(
        connection,
        coreAddress,
        tokenBridgeAddress,
        sendingChain,
        senderAddress,
        amountBN,
        recipientChain,
        hexToUint8Array(recipientAddress),
        senderAddress,
        token.address,
        undefined,
        undefined,
        payload,
        commitment,
      );
    }
  }

  parseSequenceFromLog(
    receipt: TransactionResponse,
    chain: ChainName | ChainId,
  ): string {
    const sequences = this.parseSequencesFromLog(receipt, chain);
    if (sequences.length === 0) throw new Error('no sequence found in log');
    return sequences[0];
  }

  parseSequencesFromLog(
    receipt: TransactionResponse,
    chain: ChainName | ChainId,
  ): string[] {
    // TODO: better parsing, safer
    const sequences = receipt.meta?.logMessages
      ?.filter((msg: string) => msg.startsWith(SOLANA_SEQ_LOG))
      .map((msg: string) => msg.replace(SOLANA_SEQ_LOG, ''));
    if (!sequences || sequences.length <= 0)
      throw new Error('no sequence found in log');
    return sequences;
  }

  formatAddress(address: PublicKeyInitData): string {
    return deriveWormholeEmitterKey(address).toBuffer().toString('hex');
  }
}
