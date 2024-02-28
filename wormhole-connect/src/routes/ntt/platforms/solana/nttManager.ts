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
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { parseVaa } from '@certusone/wormhole-sdk/lib/esm';
import { utils } from 'ethers';
import { NttManagerMessage } from '../../payloads/common';
import { NativeTokenTransfer } from '../../payloads/transfers';
import { parseWormholeTransceiverMessage } from 'routes/ntt/utils';

// TODO: make sure this is in sync with the contract
const RATE_LIMIT_DURATION = 24 * 60 * 60;

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
    // Solana does not support standard relaying yet
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

  async receiveMessage(vaa: string, payer: string): Promise<string> {
    const core = wh.mustGetContracts('solana').core;
    if (!core) throw new Error('Core not found');
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
    // First post the VAA
    await postVaa(this.connection, core, Buffer.from(vaaArray));
    const tx = new Transaction();
    // Create the ATA if it doesn't exist
    const mint = await this.ntt.mintAccountAddress(config);
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
    tx.add(await this.ntt.createReceiveWormholeMessageInstruction(redeemArgs));
    tx.add(await this.ntt.createRedeemInstruction(redeemArgs));
    const { nttManagerPayload } = parseWormholeTransceiverMessage(
      parsedVaa.payload,
    );
    const releaseArgs = {
      ...redeemArgs,
      ntt_managerMessage: nttManagerPayload,
      recipient: new PublicKey(nttManagerPayload.payload.recipientAddress),
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
    } = await this.ntt.getInboxRateLimit(fromChain);
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
    // TODO: how will solana implement this?
    // const config = await this.ntt.getConfig();
    // return config.rateLimitDuration.toNumber();
    return RATE_LIMIT_DURATION;
  }

  async getInboundQueuedTransfer(
    emitterChain: ChainName | ChainId,
    message: NttManagerMessage<NativeTokenTransfer>,
  ): Promise<InboundQueuedTransfer | undefined> {
    let inboxItem;
    try {
      inboxItem = await this.ntt.getInboxItem(emitterChain, message);
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
    emitterChain: ChainName | ChainId,
    message: NttManagerMessage<NativeTokenTransfer>,
    payer: string,
  ): Promise<string> {
    const payerPublicKey = new PublicKey(payer);
    const releaseArgs = {
      payer: payerPublicKey,
      ntt_managerMessage: message,
      recipient: new PublicKey(message.payload.recipientAddress),
      chain: emitterChain,
      revertOnDelay: false,
    };
    const config = await this.ntt.getConfig();
    const tx = new Transaction();
    // Create the ATA if it doesn't exist
    const mint = await this.ntt.mintAccountAddress(config);
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
    message: NttManagerMessage<NativeTokenTransfer>,
  ): Promise<boolean> {
    try {
      const inboxItem = await this.ntt.getInboxItem(emitterChain, message);
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
    message: NttManagerMessage<NativeTokenTransfer>,
  ): Promise<string | undefined> {
    const address = await this.ntt.inboxItemAccountAddress(
      emitterChain,
      message,
    );
    // fetch the most recent signature
    const signatures = await this.connection.getSignaturesForAddress(address, {
      limit: 1,
    });
    console.log(`fetchRedeemTx: ${signatures[0].signature}`);
    return signatures ? signatures[0].signature : undefined;
  }
}
