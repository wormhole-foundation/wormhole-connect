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

const ABI_VERSION_0_1_0 = '0.1.0';
const ABI_VERSION_1_0_0 = '1.0.0';

export class NttManagerEvm {
  static readonly abiVersionCache = new Map<string, string>();

  constructor(readonly chain: ChainName | ChainId, readonly address: string) {}

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
    const { abi } = await this.getAbi();
    const transceiverIxs = encodeTransceiverInstructions([
      {
        index: 0,
        payload: encodeWormholeTransceiverInstruction({
          shouldSkipRelayerSend,
        }),
      },
    ]);
    const [, deliveryPrice] = await abi.quoteDeliveryPrice(
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
    const { abi } = await this.getAbi();
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
    const tx = await abi.populateTransaction[
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
      this.throwParsedError(abi.interface, e);
    }
  }

  async getCurrentOutboundCapacity(): Promise<string> {
    const { abi } = await this.getAbi();
    return (await abi.getCurrentOutboundCapacity()).toString();
  }

  async getCurrentInboundCapacity(
    fromChain: ChainName | ChainId,
  ): Promise<string> {
    const { abi } = await this.getAbi();
    return (
      await abi.getCurrentInboundCapacity(toChainId(fromChain))
    ).toString();
  }

  async getRateLimitDuration(): Promise<number> {
    const { abi } = await this.getAbi();
    return (await abi.rateLimitDuration()).toNumber();
  }

  async getInboundQueuedTransfer(
    messageDigest: string,
  ): Promise<InboundQueuedTransfer | undefined> {
    const { abi } = await this.getAbi();
    const queuedTransfer = await abi.getInboundQueuedTransfer(messageDigest);
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
    const { abi } = await this.getAbi();
    try {
      const tx = await abi.populateTransaction.completeInboundQueuedTransfer(
        messageDigest,
      );
      return await this.signAndSendTransaction(tx, TransferWallet.RECEIVING);
    } catch (e) {
      this.throwParsedError(abi.interface, e);
    }
  }

  // The transfer is "complete" when the message is executed and not inbound queued
  async isTransferCompleted(messageDigest: string): Promise<boolean> {
    const { abi } = await this.getAbi();
    const isMessageExecuted = await abi.isMessageExecuted(messageDigest);
    if (isMessageExecuted) {
      const queuedTransfer = await this.getInboundQueuedTransfer(messageDigest);
      return !queuedTransfer;
    }
    return false;
  }

  async isPaused(): Promise<boolean> {
    const { abi } = await this.getAbi();
    return await abi.isPaused();
  }

  async fetchRedeemTx(messageDigest: string): Promise<string | undefined> {
    const { abi } = await this.getAbi();
    const eventFilter = abi.filters.TransferRedeemed(messageDigest);
    const provider = config.wh.mustGetProvider(this.chain);
    const currentBlock = await provider.getBlockNumber();
    const chainName = toChainName(this.chain);
    const chainConfig = config.chains[chainName]!;
    const events = await abi.queryFilter(
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

  async getAbi(): Promise<{
    abi: NttManager_0_1_0 | NttManager_1_0_0;
    version: string;
  }> {
    const provider = config.wh.mustGetProvider(this.chain);
    const abiVersionKey = `${this.address}-${toChainName(this.chain)}`;
    let abiVersion = NttManagerEvm.abiVersionCache.get(abiVersionKey);
    if (!abiVersion) {
      const contract = new ethers.Contract(
        this.address,
        ['function NTT_MANAGER_VERSION() public view returns (string)'],
        provider,
      );
      try {
        abiVersion = await contract.NTT_MANAGER_VERSION();
      } catch (e) {
        console.error(
          `Failed to get NTT_MANAGER_VERSION from contract ${
            this.address
          } on chain ${toChainName(this.chain)}`,
        );
        throw e;
      }
      if (!abiVersion) {
        throw new Error('NTT_MANAGER_VERSION not found');
      }
      NttManagerEvm.abiVersionCache.set(abiVersionKey, abiVersion);
    }
    if (abiVersion === ABI_VERSION_0_1_0) {
      return {
        abi: NttManager__factory_0_1_0.connect(this.address, provider),
        version: abiVersion,
      };
    }
    if (abiVersion === ABI_VERSION_1_0_0) {
      return {
        abi: NttManager__factory_1_0_0.connect(this.address, provider),
        version: abiVersion,
      };
    }
    console.error(
      `Unsupported NttManager version ${abiVersion} for chain ${toChainName(
        this.chain,
      )}`,
    );
    throw new UnsupportedContractAbiVersion();
  }
}
