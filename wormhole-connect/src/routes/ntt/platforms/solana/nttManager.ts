import {
  ChainId,
  ChainName,
  TokenId,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { InboundQueuedTransfer } from '../../types';
import { NTT } from './sdk';
import { solanaContext, wh } from 'utils/sdk';
import { TransferWallet, postVaa, signAndSendTransaction } from 'utils/wallet';
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import {
  createApproveInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { RATE_LIMIT_DURATION } from 'routes/ntt/consts';
import { parseVaa } from '@certusone/wormhole-sdk/lib/esm';
import { utils } from 'ethers';
import { WormholeTransceiverMessage } from '../../payloads/wormhole';
import { NttManagerMessage } from '../../payloads/common';
import { NativeTokenTransfer } from '../../payloads/transfers';
import { RequireContractIsNotPausedError } from 'routes/ntt/errors';

export class NttManagerSolana {
  readonly ntt: NTT;
  readonly connection: Connection;

  constructor(readonly nttId: string) {
    const connection = solanaContext().connection;
    if (!connection) throw new Error('Connection not found');
    this.connection = connection;
    const core = wh.mustGetContracts('solana').core;
    if (!core) throw new Error('Core not found');
    this.ntt = new NTT(connection, {
      nttId,
      wormholeId: core,
    });
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
    wormholeTransceiver: string,
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
    // TODO: make sure limits change
    const limit = await this.getCurrentOutboundCapacity();
    console.log('limit', limit);
    const txArgs = {
      payer,
      from: tokenAccount,
      amount: new BN(amount.toString()),
      recipientChain: wh.toChainName(toChain),
      recipientAddress: destContext.formatAddress(recipient),
      fromAuthority: payer,
      outboxItem: outboxItem.publicKey,
      config,
      shouldQueue: false, // revert instead of getting queued
    };
    let transferIx;
    if (config.mode.locking) {
      transferIx = await this.ntt.createTransferLockInstruction(txArgs);
    } else if (config.mode.burning) {
      transferIx = await this.ntt.createTransferBurnInstruction(txArgs);
    } else {
      throw new Error('Invalid mode');
    }
    const releaseIx = await this.ntt.createReleaseOutboundInstruction({
      payer,
      outboxItem: outboxItem.publicKey,
      revertOnDelay: !txArgs.shouldQueue,
    });
    const approveIx = createApproveInstruction(
      tokenAccount,
      this.ntt.tokenAuthorityAddress(),
      payer,
      BigInt(amount.toString()),
    );
    const tx = new Transaction();
    tx.add(approveIx, transferIx, releaseIx);
    tx.feePayer = payer;
    const { blockhash } = await this.connection.getLatestBlockhash('finalized');
    tx.recentBlockhash = blockhash;
    tx.partialSign(outboxItem);
    const txId = await signAndSendTransaction(
      'solana',
      tx,
      TransferWallet.SENDING,
      { commitment: 'finalized' },
    );
    return txId;
  }

  // TODO: create the ATA if it doesn't exist
  async receiveMessage(vaa: string, payer: string): Promise<string> {
    if (await this.isPaused()) {
      throw new RequireContractIsNotPausedError();
    }
    const config = await this.ntt.getConfig();
    const vaaArray = utils.arrayify(vaa, { allowMissingPrefix: true });
    const payerPublicKey = new PublicKey(payer);
    const redeemArgs = {
      payer: payerPublicKey,
      vaa: vaaArray,
      config,
    };
    const parsedVaa = parseVaa(vaaArray);
    const chainId = parsedVaa.emitterChain as ChainId;
    const core = wh.mustGetContracts('solana').core;
    if (!core) throw new Error('Core not found');
    await postVaa(this.connection, core, Buffer.from(vaaArray));
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
    const tx = new Transaction();
    tx.add(await this.ntt.createReceiveWormholeMessageInstruction(redeemArgs));
    tx.add(await this.ntt.createRedeemInstruction(redeemArgs));
    const nttManagerMessage = WormholeTransceiverMessage.deserialize(
      parsedVaa.payload,
      (a) => NttManagerMessage.deserialize(a, NativeTokenTransfer.deserialize),
    ).ntt_managerPayload;
    const releaseArgs = {
      ...redeemArgs,
      ntt_managerMessage: nttManagerMessage,
      recipient: new PublicKey(nttManagerMessage.payload.recipientAddress),
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
      { commitment: 'finalized' },
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
    managerMessage: NttManagerMessage<NativeTokenTransfer>,
  ): Promise<InboundQueuedTransfer | undefined> {
    let inboxItem;
    try {
      inboxItem = await this.ntt.getInboxItem(emitterChain, managerMessage);
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

  // TODO: create the ATA if it doesn't exist
  async completeInboundQueuedTransfer(
    emitterChain: ChainName | ChainId,
    nttManagerMessage: NttManagerMessage<NativeTokenTransfer>,
    payer: string,
  ): Promise<string> {
    if (await this.isPaused()) {
      throw new RequireContractIsNotPausedError();
    }
    const payerPublicKey = new PublicKey(payer);
    const releaseArgs = {
      payer: payerPublicKey,
      ntt_managerMessage: nttManagerMessage,
      recipient: new PublicKey(nttManagerMessage.payload.recipientAddress),
      chain: emitterChain,
      revertOnDelay: false,
    };
    const config = await this.ntt.getConfig();
    const tx = new Transaction();
    if (config.mode.locking) {
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
      { commitment: 'finalized' },
    );
    return txId;
  }

  async isMessageExecuted(
    emitterChain: ChainName | ChainId,
    nttManagerMessage: NttManagerMessage<NativeTokenTransfer>,
  ): Promise<boolean> {
    try {
      const inboxItem = await this.ntt.getInboxItem(
        emitterChain,
        nttManagerMessage,
      );
      return (
        inboxItem.releaseStatus.released !== null &&
        inboxItem.releaseStatus.released !== undefined
      );
    } catch (e: any) {
      if (e.message?.includes('Account does not exist')) {
        return false;
      }
      throw e;
    }
  }

  async isPaused(): Promise<boolean> {
    return this.ntt.isPaused();
  }

  async fetchRedeemTx(
    emitterChain: ChainName | ChainId,
    nttManagerMessage: NttManagerMessage<NativeTokenTransfer>,
  ): Promise<string | undefined> {
    const address = await this.ntt.inboxItemAccountAddress(
      emitterChain,
      nttManagerMessage,
    );
    // fetch the most recent signature
    const signatures = await this.connection.getSignaturesForAddress(address, {
      limit: 1,
    });
    console.log(`fetchRedeemTx: ${signatures[0].signature}`);
    return signatures ? signatures[0].signature : undefined;
  }
}
