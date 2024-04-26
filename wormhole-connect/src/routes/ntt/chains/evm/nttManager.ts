import {
  ChainId,
  ChainName,
  EthContext,
  TokenId,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { getTokenById, tryParseErrorMessage } from 'utils';
import { TransferWallet, signAndSendTransaction } from 'utils/wallet';
import { BigNumber, ethers, PopulatedTransaction } from 'ethers';
import { InboundQueuedTransfer } from '../../types';
import {
  InboundQueuedTransferNotFoundError,
  InboundQueuedTransferStillQueuedError,
  NotEnoughCapacityError,
  ContractIsPausedError,
  UnsupportedContractAbiVersion,
} from '../../errors';
import {
  encodeTransceiverInstructions,
  encodeWormholeTransceiverInstruction,
} from 'routes/ntt/utils';
import { NttManager__factory as NttManager__factory_0_1_0 } from './abis/0.1.0/NttManager__factory';
import { NttManager as NttManager_0_1_0 } from './abis/0.1.0/NttManager';
import { NttManager__factory as NttManager__factory_1_0_0 } from './abis/1.0.0/NttManager__factory';
import { NttManager as NttManager_1_0_0 } from './abis/1.0.0/NttManager';
import config from 'config';
import { toChainId, toChainName } from 'utils/sdk';

export class NttManagerEvm {
  readonly abi: NttManager_0_1_0 | NttManager_1_0_0;

  constructor(
    readonly chain: ChainName | ChainId,
    readonly address: string,
    version: string,
  ) {
    const provider = config.wh.mustGetProvider(chain);
    if (version === '0.1.0') {
      this.abi = NttManager__factory_0_1_0.connect(address, provider);
    } else if (version === '1.0.0') {
      this.abi = NttManager__factory_1_0_0.connect(address, provider);
    } else {
      throw new UnsupportedContractAbiVersion();
    }
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

  async quoteDeliveryPrice(
    destChain: ChainName | ChainId,
    shouldSkipRelayerSend: boolean,
  ): Promise<BigNumber> {
    const transceiverIxs = encodeTransceiverInstructions([
      {
        index: 0,
        payload: encodeWormholeTransceiverInstruction({
          shouldSkipRelayerSend,
        }),
      },
    ]);
    const [, deliveryPrice] = await this.abi.quoteDeliveryPrice(
      toChainId(destChain),
      transceiverIxs,
    );
    return deliveryPrice;
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
    const deliveryPrice = await this.quoteDeliveryPrice(
      toChain,
      shouldSkipRelayerSend,
    );
    const transceiverIxs = encodeTransceiverInstructions([
      {
        index: 0,
        payload: encodeWormholeTransceiverInstruction({
          shouldSkipRelayerSend,
        }),
      },
    ]);
    const formattedRecipient = config.wh.formatAddress(recipient, toChain);
    const tx = await this.abi.populateTransaction[
      'transfer(uint256,uint16,bytes32,bytes32,bool,bytes)'
    ](
      amount,
      toChainId(toChain),
      formattedRecipient,
      formattedRecipient, // SR gas refund goes to recipient
      false, // revert instead of getting outbound queued
      transceiverIxs,
      { value: deliveryPrice },
    );
    const context = config.wh.getContext(
      this.chain,
    ) as EthContext<WormholeContext>;
    await context.approve(this.chain, this.address, token.address, amount);
    try {
      return await this.signAndSendTransaction(tx, TransferWallet.SENDING);
    } catch (e: any) {
      this.throwParsedError(this.abi.interface, e);
    }
  }

  async getCurrentOutboundCapacity(): Promise<string> {
    return (await this.abi.getCurrentOutboundCapacity()).toString();
  }

  async getCurrentInboundCapacity(
    fromChain: ChainName | ChainId,
  ): Promise<string> {
    return (
      await this.abi.getCurrentInboundCapacity(toChainId(fromChain))
    ).toString();
  }

  async getRateLimitDuration(): Promise<number> {
    return (await this.abi.rateLimitDuration()).toNumber();
  }

  async getInboundQueuedTransfer(
    messageDigest: string,
  ): Promise<InboundQueuedTransfer | undefined> {
    const queuedTransfer = await this.abi.getInboundQueuedTransfer(
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
        await this.abi.populateTransaction.completeInboundQueuedTransfer(
          messageDigest,
        );
      return await this.signAndSendTransaction(tx, TransferWallet.RECEIVING);
    } catch (e) {
      this.throwParsedError(this.abi.interface, e);
    }
  }

  // The transfer is "complete" when the message is executed and not inbound queued
  async isTransferCompleted(messageDigest: string): Promise<boolean> {
    const isMessageExecuted = await this.abi.isMessageExecuted(messageDigest);
    if (isMessageExecuted) {
      const queuedTransfer = await this.getInboundQueuedTransfer(messageDigest);
      return !queuedTransfer;
    }
    return false;
  }

  async isPaused(): Promise<boolean> {
    return await this.abi.isPaused();
  }

  async fetchRedeemTx(messageDigest: string): Promise<string | undefined> {
    const eventFilter = this.abi.filters.TransferRedeemed(messageDigest);
    const provider = config.wh.mustGetProvider(this.chain);
    const currentBlock = await provider.getBlockNumber();
    const chainName = toChainName(this.chain);
    const chainConfig = config.chains[chainName]!;
    const events = await this.abi.queryFilter(
      eventFilter,
      currentBlock - chainConfig.maxBlockSearch,
    );
    return events?.[0]?.transactionHash || undefined;
  }

  throwParsedError(iface: ethers.utils.Interface, e: any): never {
    const message = tryParseErrorMessage(iface, e);
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
