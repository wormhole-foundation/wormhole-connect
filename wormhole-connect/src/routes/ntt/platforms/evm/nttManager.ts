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
  RequireContractIsNotPausedError,
} from '../../errors';
import { RATE_LIMIT_DURATION } from 'routes/ntt/consts';
import {
  encodeEndpointInstructions,
  encodeWormholeEndpointInstruction,
  getNttManagerMessageDigest,
} from 'routes/ntt/utils';
import { NttManager__factory } from './abis/NttManager__factory';
import { NttManager as NttManagerAbi } from './abis/NttManager';
import { NttManagerMessage } from '../../payloads/common';
import { NativeTokenTransfer } from '../../payloads/transfers';

export class NttManagerEvm {
  readonly manager: NttManagerAbi;

  constructor(readonly chain: ChainName | ChainId, managerAddress: string) {
    this.manager = NttManager__factory.connect(
      managerAddress,
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

  async quoteDeliveryPrice(
    destChain: ChainName | ChainId,
    wormholeEndpoint: string,
  ): Promise<string> {
    const endpointIxs = [
      {
        index: 0,
        payload: encodeWormholeEndpointInstruction({
          shouldSkipRelayerSend: false,
        }),
      },
    ];
    const [, deliveryPrice] = await this.manager.quoteDeliveryPrice(
      wh.toChainId(destChain),
      endpointIxs,
      [wormholeEndpoint],
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
    if (!tokenConfig?.ntt?.wormholeEndpointAddress)
      throw new Error('invalid token');
    const deliveryPrice = !shouldSkipRelayerSend
      ? BigNumber.from(
          await this.quoteDeliveryPrice(
            toChain,
            tokenConfig.ntt.wormholeEndpointAddress,
          ),
        )
      : undefined;
    const endpointIxs = encodeEndpointInstructions([
      {
        index: 0,
        payload: encodeWormholeEndpointInstruction({ shouldSkipRelayerSend }),
      },
    ]);
    const tx = await this.manager.populateTransaction[
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
      this.manager.address,
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
    return (await this.manager.getCurrentOutboundCapacity()).toString();
  }

  async getCurrentInboundCapacity(
    fromChain: ChainName | ChainId,
  ): Promise<string> {
    return (
      await this.manager.getCurrentInboundCapacity(wh.toChainId(fromChain))
    ).toString();
  }

  async getInboundQueuedTransfer(
    emitterChain: ChainName | ChainId,
    managerMessage: NttManagerMessage<NativeTokenTransfer>,
  ): Promise<InboundQueuedTransfer | undefined> {
    const digest = getNttManagerMessageDigest(emitterChain, managerMessage);
    const queuedTransfer = await this.manager.getInboundQueuedTransfer(digest);
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
    managerMessage: NttManagerMessage<NativeTokenTransfer>,
  ): Promise<string> {
    const digest = getNttManagerMessageDigest(emitterChain, managerMessage);
    try {
      const tx =
        await this.manager.populateTransaction.completeInboundQueuedTransfer(
          digest,
        );
      return await this.signAndSendTransaction(tx, TransferWallet.RECEIVING);
    } catch (e) {
      this.throwParsedError(e);
    }
  }

  async isMessageExecuted(
    emitterChain: ChainName | ChainId,
    managerMessage: NttManagerMessage<NativeTokenTransfer>,
  ): Promise<boolean> {
    const digest = getNttManagerMessageDigest(emitterChain, managerMessage);
    return this.manager.isMessageExecuted(digest);
  }

  async isPaused(): Promise<boolean> {
    return this.manager.isPaused();
  }

  throwParsedError(e: any): never {
    const message = tryParseErrorMessage(this.manager.interface, e);
    if (message === InboundQueuedTransferNotFoundError.MESSAGE) {
      throw new InboundQueuedTransferNotFoundError();
    }
    if (message === InboundQueuedTransferStillQueuedError.MESSAGE) {
      throw new InboundQueuedTransferStillQueuedError();
    }
    if (message === RequireContractIsNotPausedError.MESSAGE) {
      throw new RequireContractIsNotPausedError();
    }
    if (message === NotEnoughCapacityError.MESSAGE) {
      throw new NotEnoughCapacityError();
    }
    throw e;
  }
}
