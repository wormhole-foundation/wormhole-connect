import { SignedVaa, parseVaa } from '@certusone/wormhole-sdk';
import { ChainName, ChainId } from '@wormhole-foundation/wormhole-connect-sdk';
import {
  derivePostedVaaKey,
  getWormholeDerivedAccounts,
} from '@certusone/wormhole-sdk/lib/cjs/solana/wormhole';
import {
  BN,
  translateError,
  type IdlAccounts,
  Program,
} from '@coral-xyz/anchor';
import { associatedAddress } from '@coral-xyz/anchor/dist/cjs/utils/token';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import {
  PublicKey,
  Keypair,
  type TransactionInstruction,
  Transaction,
  sendAndConfirmTransaction,
  type TransactionSignature,
  Connection,
} from '@solana/web3.js';
import { Keccak } from 'sha3';
import { NttManagerMessage } from '../../../payloads/common';
import { NativeTokenTransfer } from '../../../payloads/transfers';
import { WormholeTransceiverMessage } from '../../../payloads/wormhole';
import * as splToken from '@solana/spl-token';
import {
  IDL,
  type ExampleNativeTokenTransfers as RawExampleNativeTokenTransfers,
} from '../abis/example_native_token_transfers';
import { wh } from 'utils/sdk';

// This is a workaround for the fact that the anchor idl doesn't support generics
// yet. This type is used to remove the generics from the idl types.
type OmitGenerics<T> = {
  [P in keyof T]: T[P] extends Record<'generics', any>
    ? never
    : T[P] extends object
    ? OmitGenerics<T[P]>
    : T[P];
};

export type ExampleNativeTokenTransfers =
  OmitGenerics<RawExampleNativeTokenTransfers>;

export type Config = IdlAccounts<ExampleNativeTokenTransfers>['config'];
export type InboxItem = IdlAccounts<ExampleNativeTokenTransfers>['inboxItem'];
export type OutboxRateLimit =
  IdlAccounts<ExampleNativeTokenTransfers>['outboxRateLimit'];
export type InboxRateLimit =
  IdlAccounts<ExampleNativeTokenTransfers>['inboxRateLimit'];

export class NTT {
  readonly program: Program<ExampleNativeTokenTransfers>;
  readonly wormholeId: PublicKey;
  // mapping from error code to error message. Used for prettifying error messages
  private readonly errors: Map<number, string>;

  constructor(
    connection: Connection,
    args: { nttId: string; wormholeId: string },
  ) {
    // TODO: initialise a new Program here with a passed in Connection
    this.program = new Program(IDL as any, new PublicKey(args.nttId), {
      connection,
    });
    this.wormholeId = new PublicKey(args.wormholeId);
    this.errors = this.processErrors();
  }

  // The `translateError` function expects this format, but the idl gives us a
  // different one, so we preprocess the idl and store the expected format.
  // NOTE: I'm sure there's a function within anchor that does this, but I
  // couldn't find it.
  private processErrors(): Map<number, string> {
    const errors = this.program.idl.errors;
    const result: Map<number, string> = new Map<number, string>();
    errors.forEach((entry) => result.set(entry.code, entry.msg));
    return result;
  }

  // Account addresses

  private derive_pda(
    seeds: Buffer | Array<Uint8Array | Buffer>,
    program = this.program.programId,
  ): PublicKey {
    const seedsArray = seeds instanceof Buffer ? [seeds] : seeds;
    const [address] = PublicKey.findProgramAddressSync(seedsArray, program);
    return address;
  }

  configAccountAddress(): PublicKey {
    return this.derive_pda(Buffer.from('config'));
  }

  sequenceTrackerAccountAddress(): PublicKey {
    return this.derive_pda(Buffer.from('sequence'));
  }

  outboxRateLimitAccountAddress(): PublicKey {
    return this.derive_pda(Buffer.from('outbox_rate_limit'));
  }

  inboxRateLimitAccountAddress(chain: ChainName | ChainId): PublicKey {
    const chainId = wh.toChainId(chain);
    return this.derive_pda([
      Buffer.from('inbox_rate_limit'),
      new BN(chainId).toBuffer('be', 2),
    ]);
  }

  inboxItemAccountAddress(
    chain: ChainName | ChainId,
    ntt_managerMessage: NttManagerMessage<NativeTokenTransfer>,
  ): PublicKey {
    const chainId = wh.toChainId(chain);
    const serialized = NttManagerMessage.serialize(
      ntt_managerMessage,
      NativeTokenTransfer.serialize,
    );
    const hasher = new Keccak(256);
    hasher.update(new BN(chainId).toBuffer('be', 2));
    hasher.update(serialized);
    const hash = hasher.digest('hex');
    return this.derive_pda([
      Buffer.from('inbox_item'),
      Buffer.from(hash, 'hex'),
    ]);
  }

  tokenAuthorityAddress(): PublicKey {
    return this.derive_pda([Buffer.from('token_authority')]);
  }

  emitterAccountAddress(): PublicKey {
    return this.derive_pda([Buffer.from('emitter')]);
  }

  wormholeMessageAccountAddress(outboxItem: PublicKey): PublicKey {
    return this.derive_pda([Buffer.from('message'), outboxItem.toBuffer()]);
  }

  peerAccountAddress(chain: ChainName | ChainId): PublicKey {
    const chainId = wh.toChainId(chain);
    return this.derive_pda([
      Buffer.from('peer'),
      new BN(chainId).toBuffer('be', 2),
    ]);
  }

  transceiverPeerAccountAddress(chain: ChainName | ChainId): PublicKey {
    const chainId = wh.toChainId(chain);
    return this.derive_pda([
      Buffer.from('transceiver_peer'),
      new BN(chainId).toBuffer('be', 2),
    ]);
  }

  transceiverMessageAccountAddress(
    chain: ChainName | ChainId,
    sequence: BN,
  ): PublicKey {
    const chainId = wh.toChainId(chain);
    return this.derive_pda([
      Buffer.from('transceiver_message'),
      new BN(chainId).toBuffer('be', 2),
      sequence.toBuffer('be', 8),
    ]);
  }

  registeredTransceiverAddress(transceiver: PublicKey): PublicKey {
    return this.derive_pda([
      Buffer.from('registered_transceiver'),
      transceiver.toBuffer(),
    ]);
  }

  // Instructions

  async transfer(args: {
    payer: Keypair;
    from: PublicKey;
    fromAuthority: Keypair;
    amount: BN;
    recipientChain: ChainName;
    recipientAddress: ArrayLike<number>;
    shouldQueue: boolean;
    outboxItem?: Keypair;
    config?: Config;
  }): Promise<PublicKey> {
    const config: Config = await this.getConfig(args.config);

    const outboxItem = args.outboxItem ?? Keypair.generate();

    const txArgs = {
      ...args,
      payer: args.payer.publicKey,
      fromAuthority: args.fromAuthority.publicKey,
      outboxItem: outboxItem.publicKey,
      config,
    };

    let transferIx: TransactionInstruction;
    if (config.mode.locking != null) {
      transferIx = await this.createTransferLockInstruction(txArgs);
    } else if (config.mode.burning != null) {
      transferIx = await this.createTransferBurnInstruction(txArgs);
    } else {
      transferIx = exhaustive(config.mode);
    }

    const releaseIx: TransactionInstruction =
      await this.createReleaseOutboundInstruction({
        payer: args.payer.publicKey,
        outboxItem: outboxItem.publicKey,
        revertOnDelay: !args.shouldQueue,
      });

    const signers = [args.payer, args.fromAuthority, outboxItem];

    const approveIx = splToken.createApproveInstruction(
      args.from,
      this.tokenAuthorityAddress(),
      args.fromAuthority.publicKey,
      BigInt(args.amount.toString()),
    );
    const tx = new Transaction();
    tx.add(approveIx, transferIx, releaseIx);
    await this.sendAndConfirmTransaction(tx, signers);

    return outboxItem.publicKey;
  }

  /**
   * Like `sendAndConfirmTransaction` but parses the anchor error code.
   */
  private async sendAndConfirmTransaction(
    tx: Transaction,
    signers: Keypair[],
  ): Promise<TransactionSignature> {
    try {
      return await sendAndConfirmTransaction(
        this.program.provider.connection,
        tx,
        signers,
      );
    } catch (err) {
      throw translateError(err, this.errors);
    }
  }

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

    if (await this.isPaused(config)) {
      throw new Error('Contract is paused');
    }

    const chainId = wh.toChainId(args.recipientChain);
    const mint = await this.mintAccountAddress(config);

    return await this.program.methods
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
          sender: args.fromAuthority,
          seq: this.sequenceTrackerAccountAddress(),
          outboxItem: args.outboxItem,
          outboxRateLimit: this.outboxRateLimitAccountAddress(),
          tokenAuthority: this.tokenAuthorityAddress(),
        },
        peer: this.peerAccountAddress(args.recipientChain),
        inboxRateLimit: this.inboxRateLimitAccountAddress(args.recipientChain),
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
    config?: Config;
  }): Promise<TransactionInstruction> {
    const config = await this.getConfig(args.config);

    if (await this.isPaused(config)) {
      throw new Error('Contract is paused');
    }

    const chainId = wh.toChainId(args.recipientChain);
    const mint = await this.mintAccountAddress(config);

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
          sender: args.fromAuthority,
          tokenProgram: await this.tokenProgram(config),
          seq: this.sequenceTrackerAccountAddress(),
          outboxItem: args.outboxItem,
          outboxRateLimit: this.outboxRateLimitAccountAddress(),
          tokenAuthority: this.tokenAuthorityAddress(),
        },
        peer: this.peerAccountAddress(args.recipientChain),
        inboxRateLimit: this.inboxRateLimitAccountAddress(args.recipientChain),
        custody: await this.custodyAccountAddress(config),
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
        wormholeBridge: whAccs.wormholeBridge,
        wormholeFeeCollector: whAccs.wormholeFeeCollector,
        wormholeSequence: whAccs.wormholeSequence,
        wormholeProgram: this.wormholeId,
      })
      .instruction();
  }

  async releaseOutbound(args: {
    payer: Keypair;
    outboxItem: PublicKey;
    revertOnDelay: boolean;
    config?: Config;
  }) {
    if (await this.isPaused()) {
      throw new Error('Contract is paused');
    }

    const txArgs = {
      ...args,
      payer: args.payer.publicKey,
    };

    const tx = new Transaction();
    tx.add(await this.createReleaseOutboundInstruction(txArgs));

    const signers = [args.payer];
    return await sendAndConfirmTransaction(
      this.program.provider.connection,
      tx,
      signers,
    );
  }

  // TODO: document that if recipient is provided, then the instruction can be
  // created before the inbox item is created (i.e. they can be put in the same tx)
  async createReleaseInboundMintInstruction(args: {
    payer: PublicKey;
    chain: ChainName | ChainId;
    ntt_managerMessage: NttManagerMessage<NativeTokenTransfer>;
    revertOnDelay: boolean;
    recipient?: PublicKey;
    config?: Config;
  }): Promise<TransactionInstruction> {
    const config = await this.getConfig(args.config);

    if (await this.isPaused(config)) {
      throw new Error('Contract is paused');
    }

    const recipientAddress =
      args.recipient ??
      (await this.getInboxItem(args.chain, args.ntt_managerMessage))
        .recipientAddress;

    const mint = await this.mintAccountAddress(config);

    return await this.program.methods
      .releaseInboundMint({
        revertOnDelay: args.revertOnDelay,
      })
      .accounts({
        common: {
          payer: args.payer,
          config: { config: this.configAccountAddress() },
          inboxItem: this.inboxItemAccountAddress(
            args.chain,
            args.ntt_managerMessage,
          ),
          recipient: getAssociatedTokenAddressSync(mint, recipientAddress),
          mint,
          tokenAuthority: this.tokenAuthorityAddress(),
        },
      })
      .instruction();
  }

  async releaseInboundMint(args: {
    payer: Keypair;
    chain: ChainName | ChainId;
    ntt_managerMessage: NttManagerMessage<NativeTokenTransfer>;
    revertOnDelay: boolean;
    config?: Config;
  }): Promise<void> {
    if (await this.isPaused()) {
      throw new Error('Contract is paused');
    }

    const txArgs = {
      ...args,
      payer: args.payer.publicKey,
    };

    const tx = new Transaction();
    tx.add(await this.createReleaseInboundMintInstruction(txArgs));

    const signers = [args.payer];
    await this.sendAndConfirmTransaction(tx, signers);
  }

  async createReleaseInboundUnlockInstruction(args: {
    payer: PublicKey;
    chain: ChainName | ChainId;
    ntt_managerMessage: NttManagerMessage<NativeTokenTransfer>;
    revertOnDelay: boolean;
    recipient?: PublicKey;
    config?: Config;
  }): Promise<TransactionInstruction> {
    const config = await this.getConfig(args.config);

    if (await this.isPaused(config)) {
      throw new Error('Contract is paused');
    }

    const recipientAddress =
      args.recipient ??
      (await this.getInboxItem(args.chain, args.ntt_managerMessage))
        .recipientAddress;

    const mint = await this.mintAccountAddress(config);

    return await this.program.methods
      .releaseInboundUnlock({
        revertOnDelay: args.revertOnDelay,
      })
      .accounts({
        common: {
          payer: args.payer,
          config: { config: this.configAccountAddress() },
          inboxItem: this.inboxItemAccountAddress(
            args.chain,
            args.ntt_managerMessage,
          ),
          recipient: getAssociatedTokenAddressSync(mint, recipientAddress),
          mint,
          tokenAuthority: this.tokenAuthorityAddress(),
        },
        custody: await this.custodyAccountAddress(config),
      })
      .instruction();
  }

  async releaseInboundUnlock(args: {
    payer: Keypair;
    chain: ChainName | ChainId;
    ntt_managerMessage: NttManagerMessage<NativeTokenTransfer>;
    revertOnDelay: boolean;
    config?: Config;
  }): Promise<void> {
    if (await this.isPaused()) {
      throw new Error('Contract is paused');
    }

    const txArgs = {
      ...args,
      payer: args.payer.publicKey,
    };

    const tx = new Transaction();
    tx.add(await this.createReleaseInboundUnlockInstruction(txArgs));

    const signers = [args.payer];
    await this.sendAndConfirmTransaction(tx, signers);
  }

  async setPeer(args: {
    payer: Keypair;
    owner: Keypair;
    chain: ChainName;
    address: ArrayLike<number>;
    limit: BN;
    config?: Config;
  }) {
    const ix = await this.program.methods
      .setPeer({
        chainId: { id: wh.toChainId(args.chain) },
        address: Array.from(args.address),
        limit: args.limit,
      })
      .accounts({
        payer: args.payer.publicKey,
        owner: args.owner.publicKey,
        config: this.configAccountAddress(),
        peer: this.peerAccountAddress(args.chain),
        inboxRateLimit: this.inboxRateLimitAccountAddress(args.chain),
      })
      .instruction();
    return sendAndConfirmTransaction(
      this.program.provider.connection,
      new Transaction().add(ix),
      [args.payer, args.owner],
    );
  }

  async setWormholeTransceiverPeer(args: {
    payer: Keypair;
    owner: Keypair;
    chain: ChainName;
    address: ArrayLike<number>;
    config?: Config;
  }) {
    const ix = await this.program.methods
      .setWormholePeer({
        chainId: { id: wh.toChainId(args.chain) },
        address: Array.from(args.address),
      })
      .accounts({
        payer: args.payer.publicKey,
        owner: args.owner.publicKey,
        config: this.configAccountAddress(),
        peer: this.transceiverPeerAccountAddress(args.chain),
      })
      .instruction();
    return sendAndConfirmTransaction(
      this.program.provider.connection,
      new Transaction().add(ix),
      [args.payer, args.owner],
    );
  }

  async registerTransceiver(args: {
    payer: Keypair;
    owner: Keypair;
    transceiver: PublicKey;
  }) {
    const ix = await this.program.methods
      .registerTransceiver()
      .accounts({
        payer: args.payer.publicKey,
        owner: args.owner.publicKey,
        config: this.configAccountAddress(),
        transceiver: args.transceiver,
        registeredTransceiver: this.registeredTransceiverAddress(
          args.transceiver,
        ),
      })
      .instruction();
    return sendAndConfirmTransaction(
      this.program.provider.connection,
      new Transaction().add(ix),
      [args.payer, args.owner],
    );
  }

  async createReceiveWormholeMessageInstruction(args: {
    payer: PublicKey;
    vaa: SignedVaa;
    config?: Config;
  }): Promise<TransactionInstruction> {
    const config = await this.getConfig(args.config);

    if (await this.isPaused(config)) {
      throw new Error('Contract is paused');
    }

    const parsedVaa = parseVaa(args.vaa);
    const ntt_managerMessage = WormholeTransceiverMessage.deserialize(
      parsedVaa.payload,
      (a) => NttManagerMessage.deserialize(a, (a) => a),
    ).ntt_managerPayload;
    // NOTE: we do an 'as ChainId' cast here, which is generally unsafe.
    // TODO: explain why this is fine here
    const chainId = parsedVaa.emitterChain as ChainId;

    const transceiverPeer = this.transceiverPeerAccountAddress(chainId);

    return await this.program.methods
      .receiveWormholeMessage()
      .accounts({
        payer: args.payer,
        config: this.configAccountAddress(),
        peer: transceiverPeer,
        vaa: derivePostedVaaKey(this.wormholeId, parseVaa(args.vaa).hash),
        transceiverMessage: this.transceiverMessageAccountAddress(
          chainId,
          new BN(ntt_managerMessage.sequence.toString()),
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

    if (await this.isPaused(config)) {
      throw new Error('Contract is paused');
    }

    const parsedVaa = parseVaa(args.vaa);
    const transceiverMessage = WormholeTransceiverMessage.deserialize(
      parsedVaa.payload,
      (a) => NttManagerMessage.deserialize(a, NativeTokenTransfer.deserialize),
    );
    const ntt_managerMessage = transceiverMessage.ntt_managerPayload;
    // NOTE: we do an 'as ChainId' cast here, which is generally unsafe.
    // TODO: explain why this is fine here
    const chainId = parsedVaa.emitterChain as ChainId;

    const ntt_managerPeer = this.peerAccountAddress(chainId);
    const inboxRateLimit = this.inboxRateLimitAccountAddress(chainId);

    return await this.program.methods
      .redeem({})
      .accounts({
        payer: args.payer,
        config: this.configAccountAddress(),
        peer: ntt_managerPeer,
        transceiverMessage: this.transceiverMessageAccountAddress(
          chainId,
          new BN(ntt_managerMessage.sequence.toString()),
        ),
        transceiver: this.registeredTransceiverAddress(this.program.programId),
        mint: await this.mintAccountAddress(config),
        inboxItem: this.inboxItemAccountAddress(chainId, ntt_managerMessage),
        inboxRateLimit,
        outboxRateLimit: this.outboxRateLimitAccountAddress(),
      })
      .instruction();
  }

  /**
   * Redeems a VAA.
   *
   * @returns Whether the transfer was released. If the transfer was delayed,
   *          this will be false. In that case, a subsequent call to
   *          `releaseInboundMint` or `releaseInboundUnlock` will release the
   *          transfer after the delay (24h).
   */
  async redeem(args: {
    payer: Keypair;
    vaa: SignedVaa;
    config?: Config;
  }): Promise<boolean> {
    const config = await this.getConfig(args.config);

    const redeemArgs = {
      ...args,
      payer: args.payer.publicKey,
    };

    const parsedVaa = parseVaa(args.vaa);

    const ntt_managerMessage = WormholeTransceiverMessage.deserialize(
      parsedVaa.payload,
      (a) => NttManagerMessage.deserialize(a, NativeTokenTransfer.deserialize),
    ).ntt_managerPayload;
    // TODO: explain why this is fine here
    const chainId = parsedVaa.emitterChain as ChainId;

    // Here we create a transaction with three instructions:
    // 1. receive wormhole messsage (vaa)
    // 1. redeem
    // 2. releaseInboundMint or releaseInboundUnlock (depending on mode)
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

    const tx = new Transaction();
    tx.add(await this.createReceiveWormholeMessageInstruction(redeemArgs));
    tx.add(await this.createRedeemInstruction(redeemArgs));

    const releaseArgs = {
      ...args,
      payer: args.payer.publicKey,
      ntt_managerMessage,
      recipient: new PublicKey(ntt_managerMessage.payload.recipientAddress),
      chain: chainId,
      revertOnDelay: false,
    };

    if (config.mode.locking != null) {
      tx.add(await this.createReleaseInboundUnlockInstruction(releaseArgs));
    } else {
      tx.add(await this.createReleaseInboundMintInstruction(releaseArgs));
    }

    const signers = [args.payer];
    await this.sendAndConfirmTransaction(tx, signers);

    // Let's check if the transfer was released
    const inboxItem = await this.getInboxItem(chainId, ntt_managerMessage);
    return inboxItem.releaseStatus.released !== null;
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

  async getInboxItem(
    chain: ChainName | ChainId,
    ntt_managerMessage: NttManagerMessage<NativeTokenTransfer>,
  ): Promise<InboxItem> {
    return await this.program.account.inboxItem.fetch(
      this.inboxItemAccountAddress(chain, ntt_managerMessage),
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

  /**
   * Returns the address of the custody account. If the config is available
   * (i.e. the program is initialised), the mint is derived from the config.
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
}

function exhaustive<A>(_: never): A {
  throw new Error('Impossible');
}
