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
  type Program,
} from '@coral-xyz/anchor';
import { associatedAddress } from '@coral-xyz/anchor/dist/cjs/utils/token';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import {
  type PublicKeyInitData,
  PublicKey,
  Keypair,
  type TransactionInstruction,
  Transaction,
  sendAndConfirmTransaction,
  type TransactionSignature,
} from '@solana/web3.js';
import { Keccak } from 'sha3';
import { type ExampleNativeTokenTransfers as Idl } from '../abis/example_native_token_transfers';
import { ManagerMessage } from './payloads/common';
import { NativeTokenTransfer } from './payloads/transfers';
import { WormholeEndpointMessage } from './payloads/wormhole';
import * as splToken from '@solana/spl-token';
import { wh } from 'utils/sdk';

export { NormalizedAmount } from './normalized_amount';
export { EndpointMessage, ManagerMessage } from './payloads/common';
export { NativeTokenTransfer } from './payloads/transfers';
export { WormholeEndpointMessage } from './payloads/wormhole';

// This is a workaround for the fact that the anchor idl doesn't support generics
// yet. This type is used to remove the generics from the idl types.
type OmitGenerics<T> = {
  [P in keyof T]: T[P] extends Record<'generics', any>
    ? never
    : T[P] extends object
    ? OmitGenerics<T[P]>
    : T[P];
};

export type ExampleNativeTokenTransfers = OmitGenerics<Idl>;

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

  constructor(args: {
    program: Program<ExampleNativeTokenTransfers>;
    wormholeId: PublicKeyInitData;
  }) {
    // TODO: initialise a new Program here with a passed in Connection
    this.program = args.program;
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
    managerMessage: ManagerMessage<NativeTokenTransfer>,
  ): PublicKey {
    const chainId = wh.toChainId(chain);
    const serialized = ManagerMessage.serialize(
      managerMessage,
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

  siblingAccountAddress(chain: ChainName | ChainId): PublicKey {
    const chainId = wh.toChainId(chain);
    return this.derive_pda([
      Buffer.from('sibling'),
      new BN(chainId).toBuffer('be', 2),
    ]);
  }

  endpointSiblingAccountAddress(chain: ChainName | ChainId): PublicKey {
    const chainId = wh.toChainId(chain);
    return this.derive_pda([
      Buffer.from('endpoint_sibling'),
      new BN(chainId).toBuffer('be', 2),
    ]);
  }

  endpointMessageAccountAddress(
    chain: ChainName | ChainId,
    sequence: BN,
  ): PublicKey {
    const chainId = wh.toChainId(chain);
    return this.derive_pda([
      Buffer.from('endpoint_message'),
      new BN(chainId).toBuffer('be', 2),
      sequence.toBuffer('be', 8),
    ]);
  }

  registeredEndpointAddress(endpoint: PublicKey): PublicKey {
    return this.derive_pda([
      Buffer.from('registered_endpoint'),
      endpoint.toBuffer(),
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
      .releaseOutbound({
        revertOnDelay: args.revertOnDelay,
      })
      .accounts({
        payer: args.payer,
        config: { config: this.configAccountAddress() },
        outboxItem: args.outboxItem,
        wormholeMessage: this.wormholeMessageAccountAddress(args.outboxItem),
        emitter: whAccs.wormholeEmitter,
        endpoint: this.registeredEndpointAddress(this.program.programId),
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
  }): Promise<void> {
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
    await sendAndConfirmTransaction(
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
    managerMessage: ManagerMessage<NativeTokenTransfer>;
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
      (await this.getInboxItem(args.chain, args.managerMessage))
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
            args.managerMessage,
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
    managerMessage: ManagerMessage<NativeTokenTransfer>;
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
    managerMessage: ManagerMessage<NativeTokenTransfer>;
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
      (await this.getInboxItem(args.chain, args.managerMessage))
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
            args.managerMessage,
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
    managerMessage: ManagerMessage<NativeTokenTransfer>;
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

  async setSibling(args: {
    payer: Keypair;
    owner: Keypair;
    chain: ChainName;
    address: ArrayLike<number>;
    limit: BN;
    config?: Config;
  }): Promise<void> {
    await this.program.methods
      .setSibling({
        chainId: { id: wh.toChainId(args.chain) },
        address: Array.from(args.address),
        limit: args.limit,
      })
      .accounts({
        payer: args.payer.publicKey,
        owner: args.owner.publicKey,
        config: this.configAccountAddress(),
        sibling: this.siblingAccountAddress(args.chain),
        inboxRateLimit: this.inboxRateLimitAccountAddress(args.chain),
      })
      .signers([args.payer, args.owner])
      .rpc();
  }

  async setWormholeEndpointSibling(args: {
    payer: Keypair;
    owner: Keypair;
    chain: ChainName;
    address: ArrayLike<number>;
    config?: Config;
  }) {
    await this.program.methods
      .setWormholeSibling({
        chainId: { id: wh.toChainId(args.chain) },
        address: Array.from(args.address),
      })
      .accounts({
        payer: args.payer.publicKey,
        owner: args.owner.publicKey,
        config: this.configAccountAddress(),
        sibling: this.endpointSiblingAccountAddress(args.chain),
      })
      .signers([args.payer, args.owner])
      .rpc();
  }

  async registerEndpoint(args: {
    payer: Keypair;
    owner: Keypair;
    endpoint: PublicKey;
  }): Promise<void> {
    await this.program.methods
      .registerEndpoint()
      .accounts({
        payer: args.payer.publicKey,
        owner: args.owner.publicKey,
        config: this.configAccountAddress(),
        endpoint: args.endpoint,
        registeredEndpoint: this.registeredEndpointAddress(args.endpoint),
      })
      .signers([args.payer, args.owner])
      .rpc();
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
    const managerMessage = WormholeEndpointMessage.deserialize(
      parsedVaa.payload,
      (a) => ManagerMessage.deserialize(a, (a) => a),
    ).managerPayload;
    // NOTE: we do an 'as ChainId' cast here, which is generally unsafe.
    // TODO: explain why this is fine here
    const chainId = parsedVaa.emitterChain as ChainId;

    const endpointSibling = this.endpointSiblingAccountAddress(chainId);

    return await this.program.methods
      .receiveWormholeMessage()
      .accounts({
        payer: args.payer,
        config: this.configAccountAddress(),
        sibling: endpointSibling,
        vaa: derivePostedVaaKey(this.wormholeId, parseVaa(args.vaa).hash),
        endpointMessage: this.endpointMessageAccountAddress(
          chainId,
          new BN(managerMessage.sequence.toString()),
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
    const endpointMessage = WormholeEndpointMessage.deserialize(
      parsedVaa.payload,
      (a) => ManagerMessage.deserialize(a, NativeTokenTransfer.deserialize),
    );
    const managerMessage = endpointMessage.managerPayload;
    // NOTE: we do an 'as ChainId' cast here, which is generally unsafe.
    // TODO: explain why this is fine here
    const chainId = parsedVaa.emitterChain as ChainId;

    const managerSibling = this.siblingAccountAddress(chainId);
    const inboxRateLimit = this.inboxRateLimitAccountAddress(chainId);

    return await this.program.methods
      .redeem({})
      .accounts({
        payer: args.payer,
        config: this.configAccountAddress(),
        sibling: managerSibling,
        endpointMessage: this.endpointMessageAccountAddress(
          chainId,
          new BN(managerMessage.sequence.toString()),
        ),
        endpoint: this.registeredEndpointAddress(this.program.programId),
        mint: await this.mintAccountAddress(config),
        inboxItem: this.inboxItemAccountAddress(chainId, managerMessage),
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

    const managerMessage = WormholeEndpointMessage.deserialize(
      parsedVaa.payload,
      (a) => ManagerMessage.deserialize(a, NativeTokenTransfer.deserialize),
    ).managerPayload;
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
      managerMessage,
      recipient: new PublicKey(managerMessage.payload.recipientAddress),
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
    const inboxItem = await this.getInboxItem(chainId, managerMessage);
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
    managerMessage: ManagerMessage<NativeTokenTransfer>,
  ): Promise<InboxItem> {
    return await this.program.account.inboxItem.fetch(
      this.inboxItemAccountAddress(chain, managerMessage),
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
