import {
  ChainId,
  ChainName,
  TokenId,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { InboundQueuedTransfer } from '../../types';
import {
  ManagerMessage,
  NTT,
  NativeTokenTransfer,
  WormholeEndpointMessage,
} from './sdk';
import { solanaContext, wh } from 'utils/sdk';
import { TransferWallet, signAndSendTransaction } from 'utils/wallet';
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { BN, Program } from '@coral-xyz/anchor';
import { IDL } from './abis';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { RATE_LIMIT_DURATION } from 'routes/ntt/consts';
import { parseVaa } from '@certusone/wormhole-sdk/lib/esm';
import { utils } from 'ethers';

export class ManagerSolana {
  readonly ntt: NTT;
  readonly connection: Connection;

  constructor(readonly managerAddress: string) {
    const connection = solanaContext().connection;
    if (!connection) throw new Error('Connection not found');
    this.connection = connection;
    const program = new Program(IDL as any, this.managerAddress, {
      connection,
    });
    this.ntt = new NTT({ program, wormholeId: this.managerAddress });
  }

  async isWormholeRelayingEnabled(
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    // TODO: implement
    return false;
  }

  async isSpecialRelayingEnabled(
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    // TODO: implement
    return false;
  }

  async quoteDeliveryPrice(
    destChain: ChainName | ChainId,
    wormholeEndpoint: string,
  ): Promise<string> {
    throw new Error('Not implemented');
  }

  async send(
    token: TokenId,
    sender: string,
    recipient: string,
    amount: bigint,
    toChain: ChainName | ChainId,
    shouldSkipRelayerSend: boolean,
  ): Promise<string> {
    const config = await this.ntt.getConfig();
    const outboxItem = Keypair.generate();
    const destContext = wh.getContext(toChain);
    const payer = new PublicKey(sender);
    const tokenAccount = getAssociatedTokenAddressSync(
      new PublicKey(token.address),
      payer,
    );
    const txArgs = {
      payer,
      from: tokenAccount,
      amount: new BN(amount.toString()),
      recipientChain: wh.toChainName(toChain),
      recipientAddress: destContext.formatAddress(recipient),
      fromAuthority: payer,
      outboxItem: outboxItem.publicKey,
      config,
      shouldQueue: false,
    };
    let transferIx: TransactionInstruction;
    console.log(config.mode);
    if (config.mode.locking) {
      console.log('locking');
      transferIx = await this.ntt.createTransferLockInstruction(txArgs);
    } else if (config.mode.burning) {
      transferIx = await this.ntt.createTransferBurnInstruction(txArgs);
    } else {
      throw new Error('Invalid mode');
    }
    const releaseIx: TransactionInstruction =
      await this.ntt.createReleaseOutboundInstruction({
        payer,
        outboxItem: outboxItem.publicKey,
        revertOnDelay: !txArgs.shouldQueue,
      });
    const tx = new Transaction();
    tx.add(transferIx, releaseIx);
    tx.feePayer = payer;
    const { blockhash } = await this.connection.getLatestBlockhash('finalized');
    tx.recentBlockhash = blockhash;
    tx.partialSign(outboxItem); // TODO: needed?
    const txId = await signAndSendTransaction(
      'solana',
      tx,
      TransferWallet.SENDING,
      { skipPreflight: true },
      // { commitment: 'confirmed' }, // TODO: what to set to?
    );
    return txId;
  }

  async receiveMessage(vaa: string, payer: string): Promise<string> {
    const config = await this.ntt.getConfig();
    const vaaArray = utils.arrayify(vaa, { allowMissingPrefix: true });
    const payerPublicKey = new PublicKey(payer);
    const redeemArgs = {
      payer: payerPublicKey,
      vaa: vaaArray,
      config,
    };
    const parsedVaa = parseVaa(vaaArray);
    const managerMessage = WormholeEndpointMessage.deserialize(
      parsedVaa.payload,
      (a) => ManagerMessage.deserialize(a, NativeTokenTransfer.deserialize),
    ).managerPayload;
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
    tx.add(await this.ntt.createReceiveWormholeMessageInstruction(redeemArgs));
    tx.add(await this.ntt.createRedeemInstruction(redeemArgs));
    const releaseArgs = {
      ...redeemArgs,
      managerMessage,
      recipient: new PublicKey(managerMessage.payload.recipientAddress),
      chain: chainId,
      revertOnDelay: false,
    };
    if (config.mode.locking != null) {
      tx.add(await this.ntt.createReleaseInboundUnlockInstruction(releaseArgs));
    } else {
      tx.add(await this.ntt.createReleaseInboundMintInstruction(releaseArgs));
    }
    tx.feePayer = payerPublicKey;
    const { blockhash } = await this.connection.getLatestBlockhash('finalized');
    tx.recentBlockhash = blockhash;
    const txId = await signAndSendTransaction(
      'solana',
      tx,
      TransferWallet.RECEIVING,
      // { commitment: 'confirmed' }, // TODO: what to set to?
    );
    return txId;
  }

  async getCurrentOutboundCapacity(): Promise<string> {
    const {
      rateLimit: { limit, capacityAtLastTx, lastTxTimestamp },
    } = await this.ntt.getOutboxRateLimit();
    return this.getCurrentCapacity(limit, capacityAtLastTx, lastTxTimestamp);
  }

  async getCurrentInboundCapacity(
    fromChain: ChainName | ChainId,
  ): Promise<string> {
    const {
      rateLimit: { limit, capacityAtLastTx, lastTxTimestamp },
    } = await this.ntt.getInboxRateLimit(fromChain);
    return this.getCurrentCapacity(limit, capacityAtLastTx, lastTxTimestamp);
  }

  getCurrentCapacity(limit: BN, capacityAtLastTx: BN, lastTxTimestamp: BN) {
    const timePassed = BN.max(
      new BN(Date.now() / 1000).sub(lastTxTimestamp),
      new BN(0),
    );
    const calculatedCapacity = capacityAtLastTx.add(
      timePassed.mul(limit).div(new BN(RATE_LIMIT_DURATION)),
    );
    return calculatedCapacity.lt(limit)
      ? calculatedCapacity.toString()
      : limit.toString();
  }

  async getInboundQueuedTransfer(
    emitterChain: ChainName | ChainId,
    managerMessage: ManagerMessage<NativeTokenTransfer>,
  ): Promise<InboundQueuedTransfer | undefined> {
    // TODO: does this throw if the account doesn't exist?
    const inboxItem = await this.ntt.getInboxItem(emitterChain, managerMessage);
    // TODO: what if it's released or not found,
    // race condition calling this immediately after tx confirmed?
    // TODO: not approved - hasn't been fully attested yet
    // inbox item will exist when we call redeem
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
    emitterChain: ChainName | ChainId,
    managerMessage: ManagerMessage<NativeTokenTransfer>,
    payer: string,
  ): Promise<string> {
    const payerPublicKey = new PublicKey(payer);
    const releaseArgs = {
      payer: payerPublicKey,
      managerMessage,
      // TODO: need to format?
      recipient: new PublicKey(managerMessage.payload.recipientAddress),
      chain: emitterChain,
      revertOnDelay: false,
    };
    const config = await this.ntt.getConfig();
    const tx = new Transaction();
    if (config.mode.locking != null) {
      tx.add(await this.ntt.createReleaseInboundUnlockInstruction(releaseArgs));
    } else {
      tx.add(await this.ntt.createReleaseInboundMintInstruction(releaseArgs));
    }
    tx.feePayer = payerPublicKey;
    const { blockhash } = await this.connection.getLatestBlockhash('finalized');
    tx.recentBlockhash = blockhash;
    const txId = await signAndSendTransaction(
      'solana',
      tx,
      TransferWallet.RECEIVING,
      // { commitment: 'confirmed' }, // TODO: what to set to?
    );
    return txId;
  }

  async isMessageExecuted(
    emitterChain: ChainName | ChainId,
    managerMessage: ManagerMessage<NativeTokenTransfer>,
  ): Promise<boolean> {
    const inboxItem = await this.ntt.getInboxItem(emitterChain, managerMessage);
    // TODO: will this be undefined ever?
    return inboxItem.releaseStatus.released !== null;
  }

  async isPaused(): Promise<boolean> {
    return this.ntt.isPaused();
  }
}
