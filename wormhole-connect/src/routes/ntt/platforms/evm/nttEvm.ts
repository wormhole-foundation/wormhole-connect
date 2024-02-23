import {
  ChainId,
  ChainName,
  EthContext,
  TokenId,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { tryParseErrorMessage } from 'utils';
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
import { ManagerMessage, NativeTokenTransfer } from '../solana/sdk';
import { RATE_LIMIT_DURATION } from 'routes/ntt/consts';
import {
  encodeEndpointInstructions,
  encodeWormholeEndpointInstruction,
  getNTTManagerMessageDigest,
} from 'routes/ntt/utils';
import { Manager__factory } from './abis/Manager__factory';
import { Manager } from './abis/Manager';

export class NTTEvm {
  readonly manager: Manager;

  constructor(readonly chain: ChainName | ChainId, managerAddress: string) {
    this.manager = Manager__factory.connect(
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

  async quoteDeliveryPrice(destChain: ChainName | ChainId): Promise<string> {
    return '0'; // TODO: implement
    //const deliveryPrice = (
    //  await this.getManager().quoteDeliveryPrice(wh.toChainId(destChain))
    //).reduce((a, b) => a.add(b), BigNumber.from(0));
    //return deliveryPrice.toString();
  }

  async send(
    token: TokenId,
    sender: string,
    recipient: string,
    amount: bigint,
    toChain: ChainName | ChainId,
    shouldSkipRelayerSend: boolean,
  ): Promise<string> {
    const deliveryPrice = shouldSkipRelayerSend
      ? undefined
      : BigNumber.from(await this.quoteDeliveryPrice(toChain));
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
    managerMessage: ManagerMessage<NativeTokenTransfer>,
  ): Promise<InboundQueuedTransfer | undefined> {
    const digest = getNTTManagerMessageDigest(emitterChain, managerMessage);
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
    managerMessage: ManagerMessage<NativeTokenTransfer>,
  ): Promise<string> {
    const digest = getNTTManagerMessageDigest(emitterChain, managerMessage);
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
    managerMessage: ManagerMessage<NativeTokenTransfer>,
  ): Promise<boolean> {
    const digest = getNTTManagerMessageDigest(emitterChain, managerMessage);
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
