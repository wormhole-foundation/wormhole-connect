import {
  ChainId,
  ChainName,
  EthContext,
  TokenId,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { getTokenById, tryParseErrorMessage } from 'utils';
import { wh } from 'utils/sdk';
import { TransferWallet, signAndSendTransaction } from 'utils/wallet';
import { BigNumber, PopulatedTransaction } from 'ethers';
import { InboundQueuedTransfer } from '../../types';
import {
  InboundQueuedTransferNotFoundError,
  InboundQueuedTransferStillQueuedError,
  NotEnoughCapacityError,
  ContractIsPausedError,
} from '../../errors';
import { RATE_LIMIT_DURATION } from 'routes/ntt/consts';
import {
  encodeTransceiverInstructions,
  encodeWormholeTransceiverInstruction,
  getNttManagerMessageDigest,
} from 'routes/ntt/utils';
import { NttManager__factory } from './abis/NttManager__factory';
import { NttManager as NttManagerAbi } from './abis/NttManager';
import { NttManagerMessage } from '../../payloads/common';
import { NativeTokenTransfer } from '../../payloads/transfers';
import { CHAINS } from 'config';

export class NttManagerEvm {
  readonly nttManager: NttManagerAbi;

  constructor(readonly chain: ChainName | ChainId, nttManager: string) {
    this.nttManager = NttManager__factory.connect(
      nttManager,
      wh.mustGetProvider(chain),
    );
  }

  async signAndSendTransaction(
    tx: PopulatedTransaction,
    walletType: TransferWallet,
  ): Promise<string> {
    const signer = await wh.mustGetSigner(this.chain);
    const response = await signer.sendTransaction(tx);
    const receipt = await response.wait();
    const txId = await signAndSendTransaction(
      wh.toChainName(this.chain),
      receipt,
      walletType,
    );
    return txId;
  }

  // Quotes the delivery price using the wormhole transceiver
  async quoteDeliveryPrice(
    destChain: ChainName | ChainId,
    wormholeTransceiver: string,
  ): Promise<string> {
    const endpointIxs = [
      {
        index: 0,
        payload: encodeWormholeTransceiverInstruction({
          shouldSkipRelayerSend: false,
        }),
      },
    ];
    const [, deliveryPrice] = await this.nttManager.quoteDeliveryPrice(
      wh.toChainId(destChain),
      endpointIxs,
      [wormholeTransceiver],
    );
    return deliveryPrice.toString();
  }

  async send(
    token: TokenId,
    sender: string,
    recipient: string,
    amount: bigint,
    toChain: ChainName | ChainId,
    shouldSkipRelayerSend: boolean,
  ): Promise<string> {
    const tokenConfig = getTokenById(token);
    if (!tokenConfig?.ntt?.wormholeTransceiver)
      throw new Error('invalid token');
    const deliveryPrice = !shouldSkipRelayerSend
      ? BigNumber.from(
          await this.quoteDeliveryPrice(
            toChain,
            tokenConfig.ntt.wormholeTransceiver,
          ),
        )
      : undefined;
    const endpointIxs = encodeTransceiverInstructions([
      {
        index: 0,
        payload: encodeWormholeTransceiverInstruction({
          shouldSkipRelayerSend,
        }),
      },
    ]);
    const tx = await this.nttManager.populateTransaction[
      'transfer(uint256,uint16,bytes32,bool,bytes)'
    ](
      amount,
      wh.toChainId(toChain),
      wh.formatAddress(recipient, toChain),
      false, // revert instead of getting outbound queued
      endpointIxs,
      { value: deliveryPrice },
    );
    const context = wh.getContext(this.chain) as EthContext<WormholeContext>;
    await context.approve(
      this.chain,
      this.nttManager.address,
      token.address,
      amount,
    );
    try {
      return await this.signAndSendTransaction(tx, TransferWallet.SENDING);
    } catch (e: any) {
      this.throwParsedError(e);
    }
  }

  async getCurrentOutboundCapacity(): Promise<string> {
    return (await this.nttManager.getCurrentOutboundCapacity()).toString();
  }

  async getCurrentInboundCapacity(
    fromChain: ChainName | ChainId,
  ): Promise<string> {
    return (
      await this.nttManager.getCurrentInboundCapacity(wh.toChainId(fromChain))
    ).toString();
  }

  async getInboundQueuedTransfer(
    emitterChain: ChainName | ChainId,
    nttManagerMessage: NttManagerMessage<NativeTokenTransfer>,
  ): Promise<InboundQueuedTransfer | undefined> {
    const digest = getNttManagerMessageDigest(emitterChain, nttManagerMessage);
    const queuedTransfer = await this.nttManager.getInboundQueuedTransfer(
      digest,
    );
    if (queuedTransfer.txTimestamp.gt(0)) {
      const { recipient, amount, txTimestamp } = queuedTransfer;
      return {
        recipient: wh.parseAddress(recipient, this.chain),
        amount: amount.toString(),
        rateLimitExpiryTimestamp: txTimestamp
          .add(RATE_LIMIT_DURATION)
          .toNumber(),
      };
    }
    return undefined;
  }

  async completeInboundQueuedTransfer(
    emitterChain: ChainName | ChainId,
    nttManagerMessage: NttManagerMessage<NativeTokenTransfer>,
  ): Promise<string> {
    const digest = getNttManagerMessageDigest(emitterChain, nttManagerMessage);
    try {
      const tx =
        await this.nttManager.populateTransaction.completeInboundQueuedTransfer(
          digest,
        );
      return await this.signAndSendTransaction(tx, TransferWallet.RECEIVING);
    } catch (e) {
      this.throwParsedError(e);
    }
  }

  async isMessageExecuted(
    emitterChain: ChainName | ChainId,
    nttManagerMessage: NttManagerMessage<NativeTokenTransfer>,
  ): Promise<boolean> {
    const digest = getNttManagerMessageDigest(emitterChain, nttManagerMessage);
    return this.nttManager.isMessageExecuted(digest);
  }

  async isPaused(): Promise<boolean> {
    return this.nttManager.isPaused();
  }

  async fetchRedeemTx(
    emitterChain: ChainName | ChainId,
    nttManagerMessage: NttManagerMessage<NativeTokenTransfer>,
  ): Promise<string | undefined> {
    const digest = getNttManagerMessageDigest(emitterChain, nttManagerMessage);
    // @ts-ignore
    // TODO: why does the abi expect null for the digest?
    const eventFilter = this.nttManager.filters.TransferRedeemed(digest);
    const provider = wh.mustGetProvider(this.chain);
    const currentBlock = await provider.getBlockNumber();
    const chainName = wh.toChainName(nttManagerMessage.payload.recipientChain);
    const chainConfig = CHAINS[chainName]!;
    const events = await this.nttManager.queryFilter(
      eventFilter,
      currentBlock - chainConfig.maxBlockSearch,
    );
    console.log(`fetchRedeemTx: ${events[0].transactionHash}`);
    return events ? events[0].transactionHash : undefined;
  }

  throwParsedError(e: any): never {
    const message = tryParseErrorMessage(this.nttManager.interface, e);
    if (message === 'InboundQueuedTransferNotFound') {
      throw new InboundQueuedTransferNotFoundError();
    }
    if (message === 'InboundQueuedTransferStillQueued') {
      throw new InboundQueuedTransferStillQueuedError();
    }
    if (message === 'RequireContractIsNotPaused') {
      throw new ContractIsPausedError();
    }
    if (message === 'NotEnoughCapacity') {
      throw new NotEnoughCapacityError();
    }
    throw e;
  }
}
