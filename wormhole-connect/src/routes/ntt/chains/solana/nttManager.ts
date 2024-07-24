import {
  addComputeBudget,
  ChainId,
  ChainName,
  TokenId,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { InboundQueuedTransfer } from '../../types';
import { solanaContext, toChainId, toChainName } from 'utils/sdk';
import {
  TransferWallet,
  getWalletConnection,
  postVaa,
  signAndSendTransaction,
} from 'utils/wallet';
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import {
  createApproveInstruction,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import { BN, IdlAccounts, Program } from '@coral-xyz/anchor';
import { SignedVaa, parseVaa } from '@certusone/wormhole-sdk/lib/esm';
import { utils } from 'ethers';
import { deserializePayload } from '@wormhole-foundation/sdk-definitions';
import { Ntt } from '@wormhole-foundation/sdk-definitions-ntt';
import {
  ExampleNativeTokenTransfers,
  IDL,
} from './types/1.0.0/example_native_token_transfers';
import {
  derivePostedVaaKey,
  getWormholeDerivedAccounts,
} from '@certusone/wormhole-sdk/lib/esm/solana/wormhole';
import { associatedAddress } from '@coral-xyz/anchor/dist/esm/utils/token';
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
import { abiVersionMatches } from 'routes/ntt/utils';

const RATE_LIMIT_DURATION = 24 * 60 * 60;

type Config = IdlAccounts<ExampleNativeTokenTransfers>['config'];
type InboxItem = IdlAccounts<ExampleNativeTokenTransfers>['inboxItem'];
type OutboxRateLimit =
  IdlAccounts<ExampleNativeTokenTransfers>['outboxRateLimit'];
type InboxRateLimit =
  IdlAccounts<ExampleNativeTokenTransfers>['inboxRateLimit'];

interface TransferArgs {
  amount: BN;
  recipientChain: { id: ChainId };
  recipientAddress: number[];
  shouldQueue: boolean;
}

export class NttManagerSolana {
  static readonly abiVersionCache = new Map<
    string,
    Program<ExampleNativeTokenTransfers>
  >();

  readonly connection: Connection;
  readonly wormholeId: string;
  readonly isMultisignWallet: boolean;

  constructor(readonly nttId: string) {
    const { connection } = solanaContext();
    if (!connection) throw new Error('Connection not found');
    this.connection = connection;
    const core = CONFIG.wh.mustGetContracts('solana').core;
    if (!core) throw new Error('Core not found');
    this.wormholeId = core;
    this.isMultisignWallet =
      getWalletConnection(TransferWallet.SENDING)?.getName() === 'SquadsX';
  }

  async send(
    token: TokenId,
    sender: string,
    recipient: string,
    amount: bigint,
    toChain: ChainName | ChainId,
    shouldSkipRelayerSend: boolean,
  ): Promise<string> {
    const program = await this.getProgram();
    const config = await this.getConfig();
    const outboxItem = Keypair.generate();
    const destContext = CONFIG.wh.getContext(toChain);
    const payer = new PublicKey(sender);
    const tokenAccount = getAssociatedTokenAddressSync(
      new PublicKey(token.address),
      payer,
      this.isMultisignWallet,
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
    );
    const tx = new Transaction();
    tx.add(approveIx, transferIx, releaseIx);
    if (!shouldSkipRelayerSend) {
      const nttConfig = getNttManagerConfigByAddress(
        program.programId.toString(),
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
    const { blockhash } = await this.connection.getLatestBlockhash('finalized');
    tx.recentBlockhash = blockhash;

    /*if (this.isMultisignWallet) {
      const { value: lookupTableAccount } = await this.connection.getAddressLookupTable(new PublicKey(''));
      if (lookupTableAccount) {
        const message = new TransactionMessage({
          payerKey: payer,
          recentBlockhash: blockhash,
          instructions: tx.instructions,
        }).compileToV0Message([lookupTableAccount]);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const transactionV0 = new VersionedTransaction(message);
        const txId = await signAndSendTransaction(
          'solana',
          tx,
          TransferWallet.SENDING,
          { commitment: 'finalized' },
        );
        return txId;
      }
      return '';
    } else {*/
    await this.simulate(tx);
    await addComputeBudget(this.connection, tx);
    tx.partialSign(outboxItem);
    const txId = await signAndSendTransaction(
      'solana',
      tx,
      TransferWallet.SENDING,
      { commitment: 'finalized' },
    );
    return txId;
    //}
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
    const ata = getAssociatedTokenAddressSync(mint, payerPublicKey);
    if (!(await this.connection.getAccountInfo(ata))) {
      const createAtaIx = createAssociatedTokenAccountInstruction(
        payerPublicKey,
        ata,
        payerPublicKey,
        mint,
      );
      tx.add(createAtaIx);
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
    const { blockhash } = await this.connection.getLatestBlockhash('finalized');
    tx.recentBlockhash = blockhash;
    await this.simulate(tx);
    await addComputeBudget(this.connection, tx);
    const txId = await signAndSendTransaction(
      'solana',
      tx,
      TransferWallet.RECEIVING,
      { commitment: 'finalized' },
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
    const ata = getAssociatedTokenAddressSync(mint, payerPublicKey);
    if (!(await this.connection.getAccountInfo(ata))) {
      const createAtaIx = createAssociatedTokenAccountInstruction(
        payerPublicKey,
        ata,
        payerPublicKey,
        mint,
      );
      tx.add(createAtaIx);
    }
    if (config.mode.locking) {
      tx.add(await this.createReleaseInboundUnlockInstruction(releaseArgs));
    } else {
      tx.add(await this.createReleaseInboundMintInstruction(releaseArgs));
    }
    tx.feePayer = payerPublicKey;
    const { blockhash } = await this.connection.getLatestBlockhash('finalized');
    tx.recentBlockhash = blockhash;
    await this.simulate(tx);
    await addComputeBudget(this.connection, tx);
    const txId = await signAndSendTransaction(
      'solana',
      tx,
      TransferWallet.RECEIVING,
      { commitment: 'finalized' },
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
    const program = await this.getProgram();
    return await program.methods
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
        inboxRateLimit: this.inboxRateLimitAccountAddress(args.recipientChain),
        sessionAuthority: this.sessionAuthorityAddress(
          args.fromAuthority,
          transferArgs,
        ),
      })
      .instruction();
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
    const program = await this.getProgram();
    return await program.methods
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
        inboxRateLimit: this.inboxRateLimitAccountAddress(args.recipientChain),
        custody: await this.custodyAccountAddress(args.config),
        sessionAuthority: this.sessionAuthorityAddress(
          args.fromAuthority,
          transferArgs,
        ),
      })
      .instruction();
  }

  /**
   * Creates a release_outbound instruction. The `payer` needs to sign the transaction.
   */
  async createReleaseOutboundInstruction(args: {
    payer: PublicKey;
    outboxItem: PublicKey;
    revertOnDelay: boolean;
  }): Promise<TransactionInstruction> {
    const program = await this.getProgram();
    const whAccs = getWormholeDerivedAccounts(
      program.programId,
      this.wormholeId,
    );
    return await program.methods
      .releaseWormholeOutbound({
        revertOnDelay: args.revertOnDelay,
      })
      .accounts({
        payer: args.payer,
        config: { config: this.configAccountAddress() },
        outboxItem: args.outboxItem,
        wormholeMessage: this.wormholeMessageAccountAddress(args.outboxItem),
        emitter: whAccs.wormholeEmitter,
        transceiver: this.registeredTransceiverAddress(program.programId),
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
    const program = await this.getProgram();
    const config = await this.getConfig(args.config);
    const mint = await this.mintAccountAddress(config);
    return await program.methods
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
  }

  async createReleaseInboundUnlockInstruction(args: {
    payer: PublicKey;
    messageDigest: string;
    revertOnDelay: boolean;
    recipient: PublicKey;
    config?: Config;
  }): Promise<TransactionInstruction> {
    const program = await this.getProgram();
    const config = await this.getConfig(args.config);
    const mint = await this.mintAccountAddress(config);
    return await program.methods
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
    const program = await this.getProgram();
    return await program.methods
      .receiveWormholeMessage()
      .accounts({
        payer: args.payer,
        config: { config: this.configAccountAddress() },
        peer: transceiverPeer,
        vaa: derivePostedVaaKey(this.wormholeId, parseVaa(args.vaa).hash),
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
    const program = await this.getProgram();
    return await program.methods
      .redeem({})
      .accounts({
        payer: args.payer,
        config: this.configAccountAddress(),
        peer: nttManagerPeer,
        transceiverMessage: this.transceiverMessageAccountAddress(
          chainId,
          Buffer.from(nttManagerPayload.id),
        ),
        transceiver: this.registeredTransceiverAddress(program.programId),
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
      (await (
        await this.getProgram()
      ).account.config.fetch(this.configAccountAddress()))
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
    const program = await this.getProgram();
    return await program.account.inboxItem.fetch(
      this.inboxItemAccountAddress(messageDigest),
    );
  }

  async getOutboxRateLimit(): Promise<OutboxRateLimit> {
    const program = await this.getProgram();
    return await program.account.outboxRateLimit.fetch(
      this.outboxRateLimitAccountAddress(),
    );
  }

  async getInboxRateLimit(chain: ChainName | ChainId): Promise<InboxRateLimit> {
    const program = await this.getProgram();
    return await program.account.inboxRateLimit.fetch(
      this.inboxRateLimitAccountAddress(chain),
    );
  }

  // View functions

  async getVersion(): Promise<string> {
    // the anchor library has a built-in method to read view functions. However,
    // it requires a signer, which would trigger a wallet prompt on the frontend.
    // Instead, we manually construct a versioned transaction and call the
    // simulate function with sigVerify: false below.
    //
    // This way, the simulation won't require a signer, but it still requires
    // the pubkey of an account that has some lamports in it (since the
    // simulation checks if the account has enough money to pay for the transaction).
    //
    // It's a little unfortunate but it's the best we can do.
    const program = new Program(IDL, this.nttId, {
      connection: this.connection,
    });
    const ix = await program.methods.version().accountsStrict({}).instruction();
    const latestBlockHash = await this.connection.getLatestBlockhash();

    // The default pubkey is a mainnet and devnet funded account
    // that can be used when simulating transactions
    const pubkey = new PublicKey(
      'Hk3SdYTJFpawrvRz4qRztuEt2SqoCG7BGj2yJfDJSFbJ',
    );
    const msg = new TransactionMessage({
      payerKey: pubkey,
      recentBlockhash: latestBlockHash.blockhash,
      instructions: [ix],
    }).compileToV0Message();

    try {
      const tx = new VersionedTransaction(msg);
      const txSimulation = await this.connection.simulateTransaction(tx, {
        sigVerify: false,
      });
      // the return buffer is in base64 and it encodes the string with a 32 bit
      // little endian length prefix.
      const data = txSimulation.value.returnData?.data[0];
      if (!data) throw new Error('No version() return data');
      const buffer = Buffer.from(data, 'base64');
      const len = buffer.readUInt32LE(0);
      return buffer.slice(4, len + 4).toString();
    } catch (e) {
      console.error(`Unable to fetch solana contract version: ${e}`);
      throw e;
    }
  }

  /**
   * Returns the address of the custody account. If the config is available
   * (i.e. the program is initialized), the mint is derived from the config.
   * Otherwise, the mint must be provided.
   */
  async custodyAccountAddress(
    configOrMint: Config | PublicKey,
  ): Promise<PublicKey> {
    if (configOrMint instanceof PublicKey) {
      return associatedAddress({
        mint: configOrMint,
        owner: this.tokenAuthorityAddress(),
      });
    } else {
      return associatedAddress({
        mint: await this.mintAccountAddress(configOrMint),
        owner: this.tokenAuthorityAddress(),
      });
    }
  }

  async getProgram(): Promise<Program<ExampleNativeTokenTransfers>> {
    let program = NttManagerSolana.abiVersionCache.get(this.nttId);
    if (!program) {
      const abiVersion = await this.getVersion();
      // For now we only have a single interface version for Solana
      if (!abiVersionMatches(abiVersion, '1.0.0')) {
        throw new UnsupportedContractAbiVersion();
      }
      program = new Program(IDL, this.nttId, { connection: this.connection });
      NttManagerSolana.abiVersionCache.set(this.nttId, program);
    }
    return program;
  }

  // Simulate transaction to catch and translate errors before sending
  async simulate(tx: Transaction): Promise<void> {
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
}
