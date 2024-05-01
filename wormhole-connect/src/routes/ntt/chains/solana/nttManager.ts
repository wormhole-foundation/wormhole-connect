import {
  addComputeBudget,
  ChainId,
  ChainName,
  TokenId,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { InboundQueuedTransfer } from '../../types';
import { solanaContext, toChainId, toChainName } from 'utils/sdk';
import { TransferWallet, postVaa, signAndSendTransaction } from 'utils/wallet';
import {
  AddressLookupTableAccount,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import {
  createApproveInstruction,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  getTransferHook,
  getMint,
  addExtraAccountMetasForExecute,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import { BN, IdlAccounts, Program } from '@coral-xyz/anchor';
import { SignedVaa, parseVaa } from '@certusone/wormhole-sdk/lib/esm';
import { utils } from 'ethers';
import { deserializePayload } from '@wormhole-foundation/sdk-definitions';
import { Ntt } from '@wormhole-foundation/sdk-definitions-ntt';
import {
  ExampleNativeTokenTransfers as ExampleNativeTokenTransfers_1_0_0,
  IDL as IDL_1_0_0,
} from './types/1.0.0/example_native_token_transfers';
import {
  ExampleNativeTokenTransfers as ExampleNativeTokenTransfers_2_0_0,
  IDL as IDL_2_0_0,
} from './types/2.0.0/example_native_token_transfers';
import {
  derivePostedVaaKey,
  getWormholeDerivedAccounts,
} from '@certusone/wormhole-sdk/lib/esm/solana/wormhole';
import { NttQuoter } from './nttQuoter';
import { Keccak } from 'sha3';
import CONFIG from 'config';
import { toChain as SDKv2toChain } from '@wormhole-foundation/sdk-base';
import { hexlify } from 'ethers/lib/utils';
import { getNttManagerConfigByAddress } from 'utils/ntt';
import {
  ContractIsPausedError,
  NotEnoughCapacityError,
  UnsupportedContractAbiVersion,
} from 'routes/ntt/errors';

const RATE_LIMIT_DURATION = 24 * 60 * 60;

type ExampleNativeTokenTransfersIdl =
  | ExampleNativeTokenTransfers_1_0_0
  | ExampleNativeTokenTransfers_2_0_0;

type Config = IdlAccounts<ExampleNativeTokenTransfersIdl>['config'];
type InboxItem = IdlAccounts<ExampleNativeTokenTransfersIdl>['inboxItem'];
type OutboxRateLimit =
  IdlAccounts<ExampleNativeTokenTransfersIdl>['outboxRateLimit'];
type InboxRateLimit =
  IdlAccounts<ExampleNativeTokenTransfersIdl>['inboxRateLimit'];

type ProgramType =
  | Program<ExampleNativeTokenTransfers_1_0_0>
  | Program<ExampleNativeTokenTransfers_2_0_0>;

type VersionedProgram<T extends '1.0.0' | '2.0.0'> = T extends '1.0.0'
  ? Program<ExampleNativeTokenTransfers_1_0_0>
  : Program<ExampleNativeTokenTransfers_2_0_0>;

interface TransferArgs {
  amount: BN;
  recipientChain: { id: ChainId };
  recipientAddress: number[];
  shouldQueue: boolean;
}

export class NttManager {
  readonly connection: Connection;
  readonly wormholeId: string;
  readonly program: ProgramType;
  addressLookupTable: AddressLookupTableAccount | null = null;

  constructor(readonly nttId: string, readonly version: string) {
    const { connection } = solanaContext();
    if (!connection) throw new Error('Connection not found');
    this.connection = connection;
    const core = CONFIG.wh.mustGetContracts('solana').core;
    if (!core) throw new Error('Core not found');
    this.wormholeId = core;
    if (version === '1.0.0') {
      this.program = new Program(IDL_1_0_0, this.nttId, {
        connection: this.connection,
      });
    } else if (version === '2.0.0') {
      this.program = new Program(IDL_2_0_0, this.nttId, {
        connection: this.connection,
      });
    } else {
      throw new UnsupportedContractAbiVersion();
    }
  }

  isVersion<T extends '1.0.0' | '2.0.0'>(
    version: T,
    program: ProgramType,
  ): program is VersionedProgram<T> {
    return this.version === version;
  }

  async send(
    token: TokenId,
    sender: string,
    recipient: string,
    amount: bigint,
    toChain: ChainName | ChainId,
    shouldSkipRelayerSend: boolean,
  ): Promise<string> {
    const config = await this.getConfig();
    const outboxItem = Keypair.generate();
    const destContext = CONFIG.wh.getContext(toChain);
    const payer = new PublicKey(sender);
    const tokenAccount = getAssociatedTokenAddressSync(
      new PublicKey(token.address),
      payer,
      true,
      config.tokenProgram,
    );
    const txArgs = {
      payer,
      from: tokenAccount,
      amount: new BN(amount.toString()),
      recipientChain: toChainName(toChain),
      recipientAddress: destContext.formatAddress(recipient),
      fromAuthority: payer,
      outboxItem: outboxItem.publicKey,
      config,
      shouldQueue: false, // revert instead of getting queued
    };
    let transferIx;
    if (config.mode.locking) {
      transferIx = await this.createTransferLockInstruction(txArgs);
    } else {
      transferIx = await this.createTransferBurnInstruction(txArgs);
    }
    const releaseIx = await this.createReleaseOutboundInstruction({
      payer,
      outboxItem: outboxItem.publicKey,
      revertOnDelay: !txArgs.shouldQueue,
    });
    const transferArgs: TransferArgs = {
      amount: txArgs.amount,
      recipientChain: { id: toChainId(txArgs.recipientChain) },
      recipientAddress: Array.from(txArgs.recipientAddress),
      shouldQueue: txArgs.shouldQueue,
    };
    const approveIx = createApproveInstruction(
      tokenAccount,
      this.sessionAuthorityAddress(txArgs.fromAuthority, transferArgs),
      payer,
      BigInt(amount.toString()),
      undefined,
      config.tokenProgram,
    );
    const tx = new Transaction();
    tx.add(approveIx, transferIx, releaseIx);
    if (!shouldSkipRelayerSend) {
      const nttConfig = getNttManagerConfigByAddress(
        this.program.programId.toString(),
        'solana',
      );
      if (!nttConfig || !nttConfig.solanaQuoter) throw new Error('no quoter');
      const quoter = new NttQuoter(nttConfig.solanaQuoter);
      const fee = await quoter.calcRelayCost(toChain, nttConfig.address);
      const relayIx = await quoter.createRequestRelayInstruction(
        payer,
        outboxItem.publicKey,
        toChain,
        fee,
        nttConfig.address,
      );
      tx.add(relayIx);
    }
    tx.feePayer = payer;
    await addComputeBudget(this.connection, tx);
    const txId = await this.signAndSendTransaction(
      tx,
      payer,
      TransferWallet.SENDING,
      [outboxItem],
    );
    return txId;
  }

  async receiveMessage(vaa: string, payer: string): Promise<string> {
    const core = CONFIG.wh.mustGetContracts('solana').core;
    if (!core) throw new Error('Core not found');
    const config = await this.getConfig();
    const vaaArray = utils.arrayify(vaa, { allowMissingPrefix: true });
    const payerPublicKey = new PublicKey(payer);
    const redeemArgs = {
      payer: payerPublicKey,
      vaa: vaaArray,
      config,
    };
    const parsedVaa = parseVaa(vaaArray);
    const chainId = toChainId(parsedVaa.emitterChain as ChainId);
    // First post the VAA
    await postVaa(this.connection, core, Buffer.from(vaaArray));
    const tx = new Transaction();
    // Create the ATA if it doesn't exist
    const mint = await this.mintAccountAddress(config);
    const ata = getAssociatedTokenAddressSync(
      mint,
      payerPublicKey,
      true,
      config.tokenProgram,
    );
    if (!(await this.connection.getAccountInfo(ata))) {
      const createAtaIx = createAssociatedTokenAccountInstruction(
        payerPublicKey,
        ata,
        payerPublicKey,
        mint,
        config.tokenProgram,
      );
      if (this.isVersion('1.0.0', this.program)) {
        // Version 1.0.0 doesn't use transfer hooks, so we can create the ATA
        // in the same transaction
        tx.add(createAtaIx);
      } else {
        // Version 2.0.0 uses transfer hooks, so we need to create the ATA
        // in a separate transaction, because it must exist in order to populate
        // the extra accounts needed by the transfer hook
        const createAtaTx = new Transaction().add(createAtaIx);
        createAtaTx.feePayer = payerPublicKey;
        const { blockhash } = await this.connection.getLatestBlockhash(
          'finalized',
        );
        createAtaTx.recentBlockhash = blockhash;
        await signAndSendTransaction(
          'solana',
          createAtaTx,
          TransferWallet.RECEIVING,
          { commitment: 'finalized' },
        );
      }
    }
    // Here we create a transaction with three instructions:
    // 1. receive wormhole message (vaa)
    // 2. redeem
    // 3. releaseInboundMint or releaseInboundUnlock (depending on mode)
    //
    // The first instruction verifies the VAA.
    // The second instruction places the transfer in the inbox, then the third instruction
    // releases it.
    //
    // In case the redeemed amount exceeds the remaining inbound rate limit capacity,
    // the transaction gets delayed. If this happens, the second instruction will not actually
    // be able to release the transfer yet.
    // To make sure the transaction still succeeds, we set revertOnDelay to false, which will
    // just make the second instruction a no-op in case the transfer is delayed.
    tx.add(await this.createReceiveWormholeMessageInstruction(redeemArgs));
    tx.add(await this.createRedeemInstruction(redeemArgs));
    const { nttManagerPayload } = deserializePayload(
      'Ntt:WormholeTransfer',
      parsedVaa.payload,
    );
    const messageDigest = Ntt.messageDigest(
      SDKv2toChain(chainId),
      nttManagerPayload,
    );
    const releaseArgs = {
      ...redeemArgs,
      messageDigest: hexlify(messageDigest),
      recipient: new PublicKey(
        nttManagerPayload.payload.recipientAddress.toUint8Array(),
      ),
      chain: chainId,
      revertOnDelay: false,
      config,
    };
    if (config.mode.locking) {
      tx.add(await this.createReleaseInboundUnlockInstruction(releaseArgs));
    } else {
      tx.add(await this.createReleaseInboundMintInstruction(releaseArgs));
    }
    tx.feePayer = payerPublicKey;
    await addComputeBudget(this.connection, tx);
    const txId = await this.signAndSendTransaction(
      tx,
      payerPublicKey,
      TransferWallet.RECEIVING,
    );
    return txId;
  }

  async getCurrentOutboundCapacity(): Promise<string> {
    const {
      rateLimit: { limit, capacityAtLastTx, lastTxTimestamp },
    } = await this.getOutboxRateLimit();
    return await this.getCurrentCapacity(
      limit,
      capacityAtLastTx,
      lastTxTimestamp,
    );
  }

  async getCurrentInboundCapacity(
    fromChain: ChainName | ChainId,
  ): Promise<string> {
    const {
      rateLimit: { limit, capacityAtLastTx, lastTxTimestamp },
    } = await this.getInboxRateLimit(fromChain);
    return await this.getCurrentCapacity(
      limit,
      capacityAtLastTx,
      lastTxTimestamp,
    );
  }

  async getCurrentCapacity(
    limit: BN,
    capacityAtLastTx: BN,
    lastTxTimestamp: BN,
  ) {
    const timePassed = BN.max(
      new BN(Date.now() / 1000).sub(lastTxTimestamp),
      new BN(0),
    );
    const duration = await this.getRateLimitDuration();
    const calculatedCapacity = capacityAtLastTx.add(
      timePassed.mul(limit).div(new BN(duration)),
    );
    return calculatedCapacity.lt(limit)
      ? calculatedCapacity.toString()
      : limit.toString();
  }

  async getRateLimitDuration(): Promise<number> {
    return RATE_LIMIT_DURATION;
  }

  async getInboundQueuedTransfer(
    messageDigest: string,
  ): Promise<InboundQueuedTransfer | undefined> {
    let inboxItem;
    try {
      inboxItem = await this.getInboxItem(messageDigest);
    } catch (e: any) {
      if (e.message?.includes('Account does not exist')) {
        return undefined;
      }
      throw e;
    }
    if (inboxItem.releaseStatus.releaseAfter) {
      return {
        recipient: inboxItem.recipientAddress.toString(),
        amount: inboxItem.amount.toString(),
        rateLimitExpiryTimestamp:
          inboxItem.releaseStatus.releaseAfter[0].toNumber(),
      };
    }
    return undefined;
  }

  async completeInboundQueuedTransfer(
    messageDigest: string,
    recipientAddress: string,
    payer: string,
  ): Promise<string> {
    const payerPublicKey = new PublicKey(payer);
    const releaseArgs = {
      payer: payerPublicKey,
      messageDigest,
      recipient: new PublicKey(recipientAddress),
      revertOnDelay: false,
    };
    const config = await this.getConfig();
    const tx = new Transaction();
    // Create the ATA if it doesn't exist
    const mint = await this.mintAccountAddress(config);
    const ata = getAssociatedTokenAddressSync(
      mint,
      payerPublicKey,
      true,
      config.tokenProgram,
    );
    if (!(await this.connection.getAccountInfo(ata))) {
      const createAtaIx = createAssociatedTokenAccountInstruction(
        payerPublicKey,
        ata,
        payerPublicKey,
        mint,
        config.tokenProgram,
      );
      if (this.isVersion('1.0.0', this.program)) {
        // Version 1.0.0 doesn't use transfer hooks, so we can create the ATA
        // in the same transaction
        tx.add(createAtaIx);
      } else {
        // Version 2.0.0 uses transfer hooks, so we need to create the ATA
        // in a separate transaction, because it must exist in order to populate
        // the extra accounts needed by the transfer hook
        const createAtaTx = new Transaction().add(createAtaIx);
        createAtaTx.feePayer = payerPublicKey;
        const { blockhash } = await this.connection.getLatestBlockhash(
          'finalized',
        );
        createAtaTx.recentBlockhash = blockhash;
        await signAndSendTransaction(
          'solana',
          createAtaTx,
          TransferWallet.RECEIVING,
          { commitment: 'finalized' },
        );
      }
    }
    if (config.mode.locking) {
      tx.add(await this.createReleaseInboundUnlockInstruction(releaseArgs));
    } else {
      tx.add(await this.createReleaseInboundMintInstruction(releaseArgs));
    }
    tx.feePayer = payerPublicKey;
    await addComputeBudget(this.connection, tx);
    const txId = await this.signAndSendTransaction(
      tx,
      payerPublicKey,
      TransferWallet.RECEIVING,
    );
    return txId;
  }

  async isTransferCompleted(messageDigest: string): Promise<boolean> {
    try {
      const inboxItem = await this.getInboxItem(messageDigest);
      return !!inboxItem.releaseStatus.released;
    } catch (e: any) {
      if (e.message?.includes('Account does not exist')) {
        return false;
      }
      throw e;
    }
  }

  async fetchRedeemTx(messageDigest: string): Promise<string | undefined> {
    const address = await this.inboxItemAccountAddress(messageDigest);
    // fetch the most recent signature
    const signatures = await this.connection.getSignaturesForAddress(address, {
      limit: 1,
    });
    return signatures?.[0]?.signature;
  }

  // Account addresses

  derivePda(seeds: Buffer | Array<Uint8Array | Buffer>): PublicKey {
    const seedsArray = seeds instanceof Buffer ? [seeds] : seeds;
    const [address] = PublicKey.findProgramAddressSync(
      seedsArray,
      new PublicKey(this.nttId),
    );
    return address;
  }

  configAccountAddress(): PublicKey {
    return this.derivePda(Buffer.from('config'));
  }

  lutAccountAddress(): PublicKey {
    return this.derivePda(Buffer.from('lut'));
  }

  lutAuthorityAddress(): PublicKey {
    return this.derivePda(Buffer.from('lut_authority'));
  }

  outboxRateLimitAccountAddress(): PublicKey {
    return this.derivePda(Buffer.from('outbox_rate_limit'));
  }

  inboxRateLimitAccountAddress(chain: ChainName | ChainId): PublicKey {
    const chainId = toChainId(chain);
    return this.derivePda([
      Buffer.from('inbox_rate_limit'),
      new BN(chainId).toBuffer('be', 2),
    ]);
  }

  inboxItemAccountAddress(messageDigest: string): PublicKey {
    return this.derivePda([
      Buffer.from('inbox_item'),
      Buffer.from(messageDigest.slice(2), 'hex'),
    ]);
  }

  sessionAuthorityAddress(sender: PublicKey, args: TransferArgs): PublicKey {
    const { amount, recipientChain, recipientAddress, shouldQueue } = args;
    const serialized = Buffer.concat([
      amount.toArrayLike(Buffer, 'be', 8),
      Buffer.from(new BN(recipientChain.id).toArrayLike(Buffer, 'be', 2)),
      Buffer.from(new Uint8Array(recipientAddress)),
      Buffer.from([shouldQueue ? 1 : 0]),
    ]);
    const hasher = new Keccak(256);
    hasher.update(serialized);
    return this.derivePda([
      Buffer.from('session_authority'),
      sender.toBytes(),
      hasher.digest(),
    ]);
  }

  tokenAuthorityAddress(): PublicKey {
    return this.derivePda([Buffer.from('token_authority')]);
  }

  emitterAccountAddress(): PublicKey {
    return this.derivePda([Buffer.from('emitter')]);
  }

  wormholeMessageAccountAddress(outboxItem: PublicKey): PublicKey {
    return this.derivePda([Buffer.from('message'), outboxItem.toBuffer()]);
  }

  peerAccountAddress(chain: ChainName | ChainId): PublicKey {
    const chainId = toChainId(chain);
    return this.derivePda([
      Buffer.from('peer'),
      new BN(chainId).toBuffer('be', 2),
    ]);
  }

  transceiverPeerAccountAddress(chain: ChainName | ChainId): PublicKey {
    const chainId = toChainId(chain);
    return this.derivePda([
      Buffer.from('transceiver_peer'),
      new BN(chainId).toBuffer('be', 2),
    ]);
  }

  transceiverMessageAccountAddress(
    chain: ChainName | ChainId,
    id: Buffer,
  ): PublicKey {
    const chainId = toChainId(chain);
    if (id.length !== 32) {
      throw new Error('id must be 32 bytes');
    }
    return this.derivePda([
      Buffer.from('transceiver_message'),
      new BN(chainId).toBuffer('be', 2),
      id,
    ]);
  }

  registeredTransceiverAddress(transceiver: PublicKey): PublicKey {
    return this.derivePda([
      Buffer.from('registered_transceiver'),
      transceiver.toBuffer(),
    ]);
  }

  // Instructions

  /**
   * Creates a transfer_burn instruction. The `payer` and `fromAuthority`
   * arguments must sign the transaction
   */
  async createTransferBurnInstruction(args: {
    payer: PublicKey;
    from: PublicKey;
    fromAuthority: PublicKey;
    amount: BN;
    recipientChain: ChainName;
    recipientAddress: ArrayLike<number>;
    outboxItem: PublicKey;
    shouldQueue: boolean;
    config?: Config;
  }): Promise<TransactionInstruction> {
    const config = await this.getConfig(args.config);
    const chainId = toChainId(args.recipientChain);
    const mint = await this.mintAccountAddress(config);
    const transferArgs: TransferArgs = {
      amount: args.amount,
      recipientChain: { id: chainId },
      recipientAddress: Array.from(args.recipientAddress),
      shouldQueue: args.shouldQueue,
    };
    if (this.isVersion('1.0.0', this.program)) {
      const transferIx = await this.program.methods
        .transferBurn({
          amount: args.amount,
          recipientChain: { id: chainId },
          recipientAddress: Array.from(args.recipientAddress),
          shouldQueue: args.shouldQueue,
        })
        .accounts({
          common: {
            payer: args.payer,
            config: { config: this.configAccountAddress() },
            mint,
            from: args.from,
            outboxItem: args.outboxItem,
            outboxRateLimit: this.outboxRateLimitAccountAddress(),
          },
          peer: this.peerAccountAddress(args.recipientChain),
          inboxRateLimit: this.inboxRateLimitAccountAddress(
            args.recipientChain,
          ),
          sessionAuthority: this.sessionAuthorityAddress(
            args.fromAuthority,
            transferArgs,
          ),
        })
        .instruction();
      return transferIx;
    } else {
      const transferIx = await this.program.methods
        .transferBurn({
          amount: args.amount,
          recipientChain: { id: chainId },
          recipientAddress: Array.from(args.recipientAddress),
          shouldQueue: args.shouldQueue,
        })
        .accountsStrict({
          common: {
            payer: args.payer,
            config: { config: this.configAccountAddress() },
            mint,
            from: args.from,
            tokenProgram: await this.tokenProgram(config),
            outboxItem: args.outboxItem,
            outboxRateLimit: this.outboxRateLimitAccountAddress(),
            custody: await this.custodyAccountAddress(config),
            systemProgram: SystemProgram.programId,
          },
          peer: this.peerAccountAddress(args.recipientChain),
          inboxRateLimit: this.inboxRateLimitAccountAddress(
            args.recipientChain,
          ),
          sessionAuthority: this.sessionAuthorityAddress(
            args.fromAuthority,
            transferArgs,
          ),
          tokenAuthority: this.tokenAuthorityAddress(),
        })
        .instruction();
      const source = args.from;
      const destination = await this.custodyAccountAddress(config);
      const owner = this.sessionAuthorityAddress(
        args.fromAuthority,
        transferArgs,
      );
      await this.maybeAddExtraTransferHookAccounts(
        config,
        source,
        destination,
        owner,
        transferIx,
      );
      return transferIx;
    }
  }

  /**
   * Creates a transfer_lock instruction. The `payer`, `fromAuthority`, and `outboxItem`
   * arguments must sign the transaction
   */
  async createTransferLockInstruction(args: {
    payer: PublicKey;
    from: PublicKey;
    fromAuthority: PublicKey;
    amount: BN;
    recipientChain: ChainName;
    recipientAddress: ArrayLike<number>;
    shouldQueue: boolean;
    outboxItem: PublicKey;
    config: Config;
  }): Promise<TransactionInstruction> {
    const chainId = toChainId(args.recipientChain);
    const mint = await this.mintAccountAddress(args.config);
    const transferArgs: TransferArgs = {
      amount: args.amount,
      recipientChain: { id: chainId },
      recipientAddress: Array.from(args.recipientAddress),
      shouldQueue: args.shouldQueue,
    };
    if (this.isVersion('1.0.0', this.program)) {
      return await this.program.methods
        .transferLock({
          amount: args.amount,
          recipientChain: { id: chainId },
          recipientAddress: Array.from(args.recipientAddress),
          shouldQueue: args.shouldQueue,
        })
        .accounts({
          common: {
            payer: args.payer,
            config: { config: this.configAccountAddress() },
            mint,
            from: args.from,
            tokenProgram: await this.tokenProgram(args.config),
            outboxItem: args.outboxItem,
            outboxRateLimit: this.outboxRateLimitAccountAddress(),
          },
          peer: this.peerAccountAddress(args.recipientChain),
          inboxRateLimit: this.inboxRateLimitAccountAddress(
            args.recipientChain,
          ),
          custody: await this.custodyAccountAddress(args.config),
          sessionAuthority: this.sessionAuthorityAddress(
            args.fromAuthority,
            transferArgs,
          ),
        })
        .instruction();
    } else {
      const transferIx = await this.program.methods
        .transferLock({
          amount: args.amount,
          recipientChain: { id: chainId },
          recipientAddress: Array.from(args.recipientAddress),
          shouldQueue: args.shouldQueue,
        })
        .accountsStrict({
          common: {
            payer: args.payer,
            config: { config: this.configAccountAddress() },
            mint,
            from: args.from,
            tokenProgram: await this.tokenProgram(args.config),
            outboxItem: args.outboxItem,
            outboxRateLimit: this.outboxRateLimitAccountAddress(),
            custody: await this.custodyAccountAddress(args.config),
            systemProgram: SystemProgram.programId,
          },
          peer: this.peerAccountAddress(args.recipientChain),
          inboxRateLimit: this.inboxRateLimitAccountAddress(
            args.recipientChain,
          ),
          sessionAuthority: this.sessionAuthorityAddress(
            args.fromAuthority,
            transferArgs,
          ),
        })
        .instruction();
      const source = args.from;
      const destination = await this.custodyAccountAddress(args.config);
      const owner = this.sessionAuthorityAddress(
        args.fromAuthority,
        transferArgs,
      );
      await this.maybeAddExtraTransferHookAccounts(
        args.config,
        source,
        destination,
        owner,
        transferIx,
      );
      return transferIx;
    }
  }

  /**
   * Creates a release_outbound instruction. The `payer` needs to sign the transaction.
   */
  async createReleaseOutboundInstruction(args: {
    payer: PublicKey;
    outboxItem: PublicKey;
    revertOnDelay: boolean;
  }): Promise<TransactionInstruction> {
    const whAccs = getWormholeDerivedAccounts(
      this.program.programId,
      this.wormholeId,
    );
    return await this.program.methods
      .releaseWormholeOutbound({
        revertOnDelay: args.revertOnDelay,
      })
      .accounts({
        payer: args.payer,
        config: { config: this.configAccountAddress() },
        outboxItem: args.outboxItem,
        wormholeMessage: this.wormholeMessageAccountAddress(args.outboxItem),
        emitter: whAccs.wormholeEmitter,
        transceiver: this.registeredTransceiverAddress(this.program.programId),
        wormhole: {
          bridge: whAccs.wormholeBridge,
          feeCollector: whAccs.wormholeFeeCollector,
          sequence: whAccs.wormholeSequence,
          program: this.wormholeId,
        },
      })
      .instruction();
  }

  async createReleaseInboundMintInstruction(args: {
    payer: PublicKey;
    messageDigest: string;
    revertOnDelay: boolean;
    recipient: PublicKey;
    config?: Config;
  }): Promise<TransactionInstruction> {
    const config = await this.getConfig(args.config);
    const mint = await this.mintAccountAddress(config);
    if (this.isVersion('1.0.0', this.program)) {
      return await this.program.methods
        .releaseInboundMint({
          revertOnDelay: args.revertOnDelay,
        })
        .accounts({
          common: {
            payer: args.payer,
            config: { config: this.configAccountAddress() },
            inboxItem: this.inboxItemAccountAddress(args.messageDigest),
            recipient: getAssociatedTokenAddressSync(mint, args.recipient),
            mint,
            tokenAuthority: this.tokenAuthorityAddress(),
          },
        })
        .instruction();
    } else {
      const transferIx = await this.program.methods
        .releaseInboundMint({
          revertOnDelay: args.revertOnDelay,
        })
        .accountsStrict({
          common: {
            payer: args.payer,
            config: { config: this.configAccountAddress() },
            inboxItem: this.inboxItemAccountAddress(args.messageDigest),
            recipient: getAssociatedTokenAddressSync(
              mint,
              args.recipient,
              true,
              config.tokenProgram,
            ),
            mint,
            tokenAuthority: this.tokenAuthorityAddress(),
            tokenProgram: config.tokenProgram,
            custody: await this.custodyAccountAddress(config),
          },
        })
        .instruction();
      const source = await this.custodyAccountAddress(config);
      const destination = getAssociatedTokenAddressSync(
        mint,
        args.recipient,
        true,
        config.tokenProgram,
      );
      const owner = this.tokenAuthorityAddress();
      await this.maybeAddExtraTransferHookAccounts(
        config,
        source,
        destination,
        owner,
        transferIx,
      );
      return transferIx;
    }
  }

  async createReleaseInboundUnlockInstruction(args: {
    payer: PublicKey;
    messageDigest: string;
    revertOnDelay: boolean;
    recipient: PublicKey;
    config?: Config;
  }): Promise<TransactionInstruction> {
    const config = await this.getConfig(args.config);
    const mint = await this.mintAccountAddress(config);
    if (this.isVersion('1.0.0', this.program)) {
      return await this.program.methods
        .releaseInboundUnlock({
          revertOnDelay: args.revertOnDelay,
        })
        .accounts({
          common: {
            payer: args.payer,
            config: { config: this.configAccountAddress() },
            inboxItem: this.inboxItemAccountAddress(args.messageDigest),
            recipient: getAssociatedTokenAddressSync(mint, args.recipient),
            mint,
            tokenAuthority: this.tokenAuthorityAddress(),
          },
          custody: await this.custodyAccountAddress(config),
        })
        .instruction();
    } else {
      const transferIx = await this.program.methods
        .releaseInboundUnlock({
          revertOnDelay: args.revertOnDelay,
        })
        .accounts({
          common: {
            payer: args.payer,
            config: { config: this.configAccountAddress() },
            inboxItem: this.inboxItemAccountAddress(args.messageDigest),
            recipient: getAssociatedTokenAddressSync(
              mint,
              args.recipient,
              true,
              config.tokenProgram,
            ),
            mint,
            tokenAuthority: this.tokenAuthorityAddress(),
            tokenProgram: config.tokenProgram,
            custody: await this.custodyAccountAddress(config),
          },
        })
        .instruction();

      const source = await this.custodyAccountAddress(config);
      const destination = getAssociatedTokenAddressSync(
        mint,
        args.recipient,
        true,
        config.tokenProgram,
      );
      const owner = this.tokenAuthorityAddress();
      await this.maybeAddExtraTransferHookAccounts(
        config,
        source,
        destination,
        owner,
        transferIx,
      );
      return transferIx;
    }
  }

  async createReceiveWormholeMessageInstruction(args: {
    payer: PublicKey;
    vaa: SignedVaa;
    config?: Config;
  }): Promise<TransactionInstruction> {
    const parsedVaa = parseVaa(args.vaa);
    const { nttManagerPayload } = deserializePayload(
      'Ntt:WormholeTransfer',
      parsedVaa.payload,
    );
    const chainId = toChainId(parsedVaa.emitterChain as ChainId);
    const transceiverPeer = this.transceiverPeerAccountAddress(chainId);
    return await this.program.methods
      .receiveWormholeMessage()
      .accounts({
        payer: args.payer,
        config: { config: this.configAccountAddress() },
        peer: transceiverPeer,
        vaa: derivePostedVaaKey(this.wormholeId, parsedVaa.hash),
        transceiverMessage: this.transceiverMessageAccountAddress(
          chainId,
          Buffer.from(nttManagerPayload.id),
        ),
      })
      .instruction();
  }

  async createRedeemInstruction(args: {
    payer: PublicKey;
    vaa: SignedVaa;
    config?: Config;
  }): Promise<TransactionInstruction> {
    const config = await this.getConfig(args.config);
    const parsedVaa = parseVaa(args.vaa);
    const { nttManagerPayload } = deserializePayload(
      'Ntt:WormholeTransfer',
      parsedVaa.payload,
    );
    const chainId = toChainId(parsedVaa.emitterChain as ChainId);
    const messageDigest = Ntt.messageDigest(
      SDKv2toChain(chainId),
      nttManagerPayload,
    );
    const nttManagerPeer = this.peerAccountAddress(chainId);
    const inboxRateLimit = this.inboxRateLimitAccountAddress(chainId);
    return await this.program.methods
      .redeem({})
      .accounts({
        payer: args.payer,
        config: this.configAccountAddress(),
        peer: nttManagerPeer,
        transceiverMessage: this.transceiverMessageAccountAddress(
          chainId,
          Buffer.from(nttManagerPayload.id),
        ),
        transceiver: this.registeredTransceiverAddress(this.program.programId),
        mint: await this.mintAccountAddress(config),
        inboxItem: this.inboxItemAccountAddress(hexlify(messageDigest)),
        inboxRateLimit,
        outboxRateLimit: this.outboxRateLimitAccountAddress(),
      })
      .instruction();
  }

  // Account access

  /**
   * Fetches the Config account from the contract.
   *
   * @param config If provided, the config is just returned without making a
   *               network request. This is handy in case multiple config
   *               accessor functions are used, the config can just be queried
   *               once and passed around.
   */
  async getConfig(config?: Config): Promise<Config> {
    return (
      config ??
      (await this.program.account.config.fetch(this.configAccountAddress()))
    );
  }

  async isPaused(config?: Config): Promise<boolean> {
    return (await this.getConfig(config)).paused;
  }

  async mintAccountAddress(config?: Config): Promise<PublicKey> {
    return (await this.getConfig(config)).mint;
  }

  async tokenProgram(config?: Config): Promise<PublicKey> {
    return (await this.getConfig(config)).tokenProgram;
  }

  async getInboxItem(messageDigest: string): Promise<InboxItem> {
    return await this.program.account.inboxItem.fetch(
      this.inboxItemAccountAddress(messageDigest),
    );
  }

  async getOutboxRateLimit(): Promise<OutboxRateLimit> {
    return await this.program.account.outboxRateLimit.fetch(
      this.outboxRateLimitAccountAddress(),
    );
  }

  async getInboxRateLimit(chain: ChainName | ChainId): Promise<InboxRateLimit> {
    return await this.program.account.inboxRateLimit.fetch(
      this.inboxRateLimitAccountAddress(chain),
    );
  }

  async getAddressLookupTable(): Promise<AddressLookupTableAccount | null> {
    if (this.isVersion('1.0.0', this.program)) {
      return null;
    }
    if (!this.addressLookupTable) {
      // @ts-ignore
      // Note: lut is 'LUT' in the IDL, but 'lut' in the generated code
      // It needs to be upper-cased in the IDL to compute the anchor
      // account discriminator correctly
      const lut = await this.program.account.lut.fetchNullable(
        this.lutAccountAddress(),
      );
      if (!lut) {
        throw new Error(
          'Address lookup table not found. Did you forget to initialize it?',
        );
      }
      const response = await this.connection.getAddressLookupTable(lut.address);
      if (!response.value) {
        throw new Error('Address lookup table not found');
      }
      this.addressLookupTable = response.value;
    }
    if (!this.addressLookupTable) {
      throw new Error(
        'Address lookup table not found. Did you forget to call initialize it?',
      );
    }
    return this.addressLookupTable;
  }

  /**
   * Returns the address of the custody account.
   */
  async custodyAccountAddress(config: Config): Promise<PublicKey> {
    return getAssociatedTokenAddress(
      config.mint,
      this.tokenAuthorityAddress(),
      true,
      config.tokenProgram,
    );
  }

  // Simulate transaction to catch and translate errors before sending
  async simulate(tx: VersionedTransaction): Promise<void> {
    const response = await this.connection.simulateTransaction(tx);
    if (response.value.err) {
      const errorLog = response.value.logs?.find((log) =>
        log.startsWith('Program log: AnchorError occurred.'),
      );
      if (errorLog) {
        const errorCode = errorLog.match(/Error Code: ([^\\.]+)/)?.[1];
        if (errorCode) {
          if (errorCode === 'TransferExceedsRateLimit') {
            throw new NotEnoughCapacityError();
          }
          if (errorCode === 'Paused') {
            throw new ContractIsPausedError();
          }
          throw new Error(errorCode);
        }
      }
      throw new Error(`Simulation error: ${JSON.stringify(response)}`);
    }
  }

  async maybeAddExtraTransferHookAccounts(
    config: Config,
    source: PublicKey,
    destination: PublicKey,
    owner: PublicKey,
    transferIx: TransactionInstruction,
  ) {
    const mintInfo = await getMint(
      this.program.provider.connection,
      config.mint,
      undefined,
      config.tokenProgram,
    );
    const transferHook = getTransferHook(mintInfo);
    if (transferHook) {
      await addExtraAccountMetasForExecute(
        this.program.provider.connection,
        transferIx,
        transferHook.programId,
        source,
        config.mint,
        destination,
        owner,
        // TODO(csonger): compute the amount that's passed into transfer.
        // Leaving this 0 is fine unless the transfer hook accounts addresses
        // depend on the amount (which is unlikely).
        // If this turns out to be the case, the amount to put here is the
        // untrimmed amount after removing dust.
        0,
      );
    }
  }

  async signAndSendTransaction(
    tx: Transaction,
    payerKey: PublicKey,
    transferWallet: TransferWallet,
    signers?: Keypair[],
  ) {
    const lut = await this.getAddressLookupTable();
    const { blockhash } = await this.connection.getLatestBlockhash('finalized');
    const messageV0 = new TransactionMessage({
      payerKey,
      recentBlockhash: blockhash,
      instructions: tx.instructions,
    }).compileToV0Message(lut ? [lut] : undefined);
    const transactionV0 = new VersionedTransaction(messageV0);
    await this.simulate(transactionV0);
    if (signers && signers.length > 0) {
      transactionV0.sign(signers);
    }
    return await signAndSendTransaction(
      'solana',
      transactionV0,
      transferWallet,
      { commitment: 'finalized' },
    );
  }
}
