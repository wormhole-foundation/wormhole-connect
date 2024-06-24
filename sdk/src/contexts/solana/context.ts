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
  redeemAndUnwrapOnSolana,
} from './utils/tokenBridge';
import {
  deriveClaimKey,
  deriveWormholeEmitterKey,
  getClaim,
  getPostedMessage,
} from './utils/wormhole';
import { addComputeBudget } from './utils/computeBudget';
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

  formatAddress(address: PublicKeyInitData): Uint8Array {
    const addr =
      typeof address === 'string' && address.startsWith('0x')
        ? arrayify(address)
        : address;
    return arrayify(zeroPad(new PublicKey(addr).toBytes(), 32));
  }

  parseAddress(address: PublicKeyInitData): string {
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
        this.context.conf.env === 'mainnet'
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

  async getWrappedNativeTokenId(chain: ChainName | ChainId): Promise<TokenId> {
    return {
      address: NATIVE_MINT.toString(),
      chain: 'solana',
    };
  }
}
