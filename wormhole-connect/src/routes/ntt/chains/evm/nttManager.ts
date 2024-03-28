import {
  ChainId,
  ChainName,
  EthContext,
  TokenId,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { getTokenById, tryParseErrorMessage } from 'utils';
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
import config from 'config';
import { toChainId, toChainName } from 'utils/sdk';
import { getNttManagerConfigByAddress } from 'utils/ntt';

export class NttManagerEvm {
  readonly nttManager: NttManagerAbi;

  constructor(readonly chain: ChainName | ChainId, address: string) {
    this.nttManager = NttManager__factory.connect(
      address,
      config.wh.mustGetProvider(chain),
    );
  }

  async signAndSendTransaction(
    tx: PopulatedTransaction,
    walletType: TransferWallet,
  ): Promise<string> {
    const signer = await config.wh.mustGetSigner(this.chain);
    const response = await signer.sendTransaction(tx);
    const receipt = await response.wait();
    const txId = await signAndSendTransaction(
      toChainName(this.chain),
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
    // TODO: when this change is deployed, change to encodeTransceiverInstructions
    // https://github.com/wormhole-foundation/example-native-token-transfers/pull/286
    // const transceiverIxs = encodeTransceiverInstructions([
    //   {
    //     index: 0,
    //     payload: encodeWormholeTransceiverInstruction({
    //       shouldSkipRelayerSend,
    //     }),
    //   },
    // ]);
    const transceiverIxs = [
      {
        index: 0,
        payload: encodeWormholeTransceiverInstruction({
          shouldSkipRelayerSend: false,
        }),
      },
    ];
    const [, deliveryPrice] = await this.nttManager.quoteDeliveryPrice(
      toChainId(destChain),
      transceiverIxs,
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
    if (!tokenConfig) throw new Error('token not found');
    const nttConfig = getNttManagerConfigByAddress(
      this.nttManager.address,
      toChainName(this.chain),
    );
    if (!nttConfig || nttConfig.transceivers[0].type !== 'wormhole')
      throw new Error('no wormhole transceiver');
    const wormholeTransceiver = nttConfig.transceivers[0].address;
    const deliveryPrice = shouldSkipRelayerSend
      ? undefined
      : BigNumber.from(
          await this.quoteDeliveryPrice(toChain, wormholeTransceiver),
        );
    const transceiverIxs = encodeTransceiverInstructions([
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
      toChainId(toChain),
      config.wh.formatAddress(recipient, toChain),
      false, // revert instead of getting outbound queued
      transceiverIxs,
      { value: deliveryPrice },
    );
    const context = config.wh.getContext(
      this.chain,
    ) as EthContext<WormholeContext>;
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
      await this.nttManager.getCurrentInboundCapacity(toChainId(fromChain))
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
        recipient: config.wh.parseAddress(recipient, this.chain),
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

  // The transfer is "complete" when the message is executed and not inbound queued
  async isTransferCompleted(messageDigest: string): Promise<boolean> {
    const isMessageExecuted = await this.nttManager.isMessageExecuted(
      messageDigest,
    );
    if (isMessageExecuted) {
      const queuedTransfer = await this.getInboundQueuedTransfer(messageDigest);
      return !queuedTransfer;
    }
    return false;
  }

  async isPaused(): Promise<boolean> {
    return await this.nttManager.isPaused();
  }

  async fetchRedeemTx(messageDigest: string): Promise<string | undefined> {
    const eventFilter = this.nttManager.filters.TransferRedeemed(messageDigest);
    const provider = config.wh.mustGetProvider(this.chain);
    const currentBlock = await provider.getBlockNumber();
    const chainName = toChainName(this.chain);
    const chainConfig = config.chains[chainName]!;
    const events = await this.nttManager.queryFilter(
      eventFilter,
      currentBlock - chainConfig.maxBlockSearch,
    );
    return events?.[0]?.transactionHash || undefined;
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
