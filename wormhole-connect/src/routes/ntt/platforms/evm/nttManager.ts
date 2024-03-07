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
import {
  encodeTransceiverInstructions,
  encodeWormholeTransceiverInstruction,
} from 'routes/ntt/utils';
import { NttManager__factory } from './abis/NttManager__factory';
import { NttManager as NttManagerAbi } from './abis/NttManager';
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
    if (!tokenConfig?.ntt?.wormholeTransceiver) {
      throw new Error('no wormhole transceiver');
    }
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

  async getRateLimitDuration(): Promise<number> {
    return (await this.nttManager.rateLimitDuration()).toNumber();
  }

  async getInboundQueuedTransfer(
    messageDigest: string,
  ): Promise<InboundQueuedTransfer | undefined> {
    const queuedTransfer = await this.nttManager.getInboundQueuedTransfer(
      messageDigest,
    );
    if (queuedTransfer.txTimestamp.gt(0)) {
      const { recipient, amount, txTimestamp } = queuedTransfer;
      const duration = await this.getRateLimitDuration();
      return {
        recipient: wh.parseAddress(recipient, this.chain),
        amount: amount.toString(),
        rateLimitExpiryTimestamp: txTimestamp.add(duration).toNumber(),
      };
    }
    return undefined;
  }

  async completeInboundQueuedTransfer(
    messageDigest: string,
    recipient: string,
    payer: string,
  ): Promise<string> {
    try {
      const tx =
        await this.nttManager.populateTransaction.completeInboundQueuedTransfer(
          messageDigest,
        );
      return await this.signAndSendTransaction(tx, TransferWallet.RECEIVING);
    } catch (e) {
      this.throwParsedError(e);
    }
  }

  async isMessageExecuted(messageDigest: string): Promise<boolean> {
    return this.nttManager.isMessageExecuted(messageDigest);
  }

  async isPaused(): Promise<boolean> {
    return this.nttManager.isPaused();
  }

  async fetchRedeemTx(messageDigest: string): Promise<string | undefined> {
    const eventFilter = this.nttManager.filters.TransferRedeemed(messageDigest);
    const provider = wh.mustGetProvider(this.chain);
    const currentBlock = await provider.getBlockNumber();
    const chainName = wh.toChainName(this.chain);
    const chainConfig = CHAINS[chainName]!;
    const events = await this.nttManager.queryFilter(
      eventFilter,
      currentBlock - chainConfig.maxBlockSearch,
    );
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
