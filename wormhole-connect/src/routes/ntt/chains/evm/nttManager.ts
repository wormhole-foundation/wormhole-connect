import {
  ChainId,
  ChainName,
  EthContext,
  TokenId,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { getTokenById, tryParseErrorMessage } from 'utils';
import { TransferWallet, signAndSendTransaction } from 'utils/wallet';
import { BaseContract, BigNumber, ethers, PopulatedTransaction } from 'ethers';
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
import { NttManager__factory as NttManager__factory_testnet } from './abis/testnet/NttManager__factory';
import { NttManager as NttManager_testnet } from './abis/testnet/NttManager';
import { NttManager__factory as NttManager__factory_0_1_0 } from './abis/0.1.0/NttManager__factory';
import { NttManager as NttManager_0_1_0 } from './abis/0.1.0/NttManager';
import config from 'config';
import { toChainId, toChainName } from 'utils/sdk';
import { getNttManagerConfigByAddress } from 'utils/ntt';

const ABI_VERSION_0_1_0 = '0.1.0';

function isAbiVersion_0_1_0(
  version: string,
  abi: BaseContract,
): abi is NttManager_0_1_0 {
  return version === ABI_VERSION_0_1_0;
}

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

  // Quotes the delivery price using the wormhole transceiver
  async quoteDeliveryPrice(
    destChain: ChainName | ChainId,
    wormholeTransceiver: string,
  ): Promise<string> {
    const { abi, version } = await this.getManagerAbi();
    if (isAbiVersion_0_1_0(version, abi)) {
      const transceiverIxs = encodeTransceiverInstructions([
        {
          index: 0,
          payload: encodeWormholeTransceiverInstruction({
            shouldSkipRelayerSend: false,
          }),
        },
      ]);
      const [, deliveryPrice] = await abi.quoteDeliveryPrice(
        toChainId(destChain),
        transceiverIxs,
      );
      return deliveryPrice.toString();
    } else {
      const transceiverIxs = [
        {
          index: 0,
          payload: encodeWormholeTransceiverInstruction({
            shouldSkipRelayerSend: false,
          }),
        },
      ];
      const [, deliveryPrice] = await (
        abi as NttManager_testnet
      ).quoteDeliveryPrice(toChainId(destChain), transceiverIxs, [
        wormholeTransceiver,
      ]);
      return deliveryPrice.toString();
    }
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
    const { abi } = await this.getManagerAbi();
    const nttConfig = getNttManagerConfigByAddress(
      this.address,
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
    const tx = await abi.populateTransaction[
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
    await context.approve(this.chain, this.address, token.address, amount);
    try {
      return await this.signAndSendTransaction(tx, TransferWallet.SENDING);
    } catch (e: any) {
      this.throwParsedError(abi.interface, e);
    }
  }

  async getCurrentOutboundCapacity(): Promise<string> {
    const { abi } = await this.getManagerAbi();
    return (await abi.getCurrentOutboundCapacity()).toString();
  }

  async getCurrentInboundCapacity(
    fromChain: ChainName | ChainId,
  ): Promise<string> {
    const { abi } = await this.getManagerAbi();
    return (
      await abi.getCurrentInboundCapacity(toChainId(fromChain))
    ).toString();
  }

  async getRateLimitDuration(): Promise<number> {
    const { abi } = await this.getManagerAbi();
    return (await abi.rateLimitDuration()).toNumber();
  }

  async getInboundQueuedTransfer(
    messageDigest: string,
  ): Promise<InboundQueuedTransfer | undefined> {
    const { abi } = await this.getManagerAbi();
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
    const { abi } = await this.getManagerAbi();
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
    const { abi } = await this.getManagerAbi();
    const isMessageExecuted = await abi.isMessageExecuted(messageDigest);
    if (isMessageExecuted) {
      const queuedTransfer = await this.getInboundQueuedTransfer(messageDigest);
      return !queuedTransfer;
    }
    return false;
  }

  async isPaused(): Promise<boolean> {
    const { abi } = await this.getManagerAbi();
    return await abi.isPaused();
  }

  async fetchRedeemTx(messageDigest: string): Promise<string | undefined> {
    const { abi } = await this.getManagerAbi();
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

  async getManagerAbi(): Promise<{
    abi: NttManager_0_1_0 | NttManager_testnet;
    version: string;
  }> {
    const provider = config.wh.mustGetProvider(this.chain);
    // Note: Special case for testnet
    if (!config.isMainnet) {
      return {
        abi: NttManager__factory_testnet.connect(this.address, provider),
        version: 'testnet',
      };
    }
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
    console.error(
      `Unsupported NttManager version ${abiVersion} for chain ${toChainName(
        this.chain,
      )}`,
    );
    throw new UnsupportedContractAbiVersion();
  }
}
