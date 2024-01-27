import {
  ChainId,
  ChainName,
  EthContext,
  TokenId,
  WormholeContext,
  WormholeEndpointAndManager__factory,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { hexlify, keccak256 } from 'ethers/lib/utils';
import { UnsignedNTTMessage } from 'routes/types';
import { getNativeVersionOfToken } from 'store/transferInput';
import { getTokenById, getTokenDecimals, tryParseErrorMessage } from 'utils';
import { wh } from 'utils/sdk';
import { getWormholeLogEvm } from 'utils/vaa';
import {
  parseEndpointMessage,
  parseManagerMessage,
  parseNativeTokenTransfer,
} from '../utils';
import { TransferWallet, signAndSendTransaction } from 'utils/wallet';
import { BigNumber, PopulatedTransaction, ethers } from 'ethers';
import { TOKENS } from 'config';
import { InboundQueuedTransfer } from '../types';
import { Implementation__factory } from '@certusone/wormhole-sdk/lib/esm/ethers-contracts';
import {
  DeliveryInstruction,
  RelayerPayloadId,
  parseWormholeLog,
} from '@certusone/wormhole-sdk/lib/esm/relayer';
import {
  InboundQueuedTransferNotFoundError,
  InboundQueuedTransferStillQueuedError,
  NotEnoughCapacityError,
} from '../errors';

export class NTTEvm {
  constructor(
    readonly chain: ChainName | ChainId,
    readonly managerAddress: string,
  ) {}

  getManager(address?: string) {
    const provider = wh.mustGetProvider(this.chain);
    return WormholeEndpointAndManager__factory.connect(
      address || this.managerAddress,
      provider,
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

  async isWormholeRelayingEnabled(
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    return this.getManager().isWormholeRelayingEnabled(wh.toChainId(destChain));
  }

  async quoteDeliveryPrice(destChain: ChainName | ChainId): Promise<string> {
    const deliveryPrice = (
      await this.getManager().quoteDeliveryPrice(wh.toChainId(destChain))
    ).reduce((a, b) => a.add(b), BigNumber.from(0));
    return deliveryPrice.toString();
  }

  async send(
    token: TokenId,
    recipient: string,
    amount: bigint,
    toChain: ChainName | ChainId,
    useRelay: boolean,
  ): Promise<string> {
    const manager = this.getManager();
    const deliveryPrice = useRelay
      ? BigNumber.from(await this.quoteDeliveryPrice(toChain))
      : undefined;
    const tx = await manager.populateTransaction.transfer(
      amount,
      wh.toChainId(toChain),
      wh.formatAddress(recipient, toChain),
      false, // revert instead of getting outbound queued
      { value: deliveryPrice },
    );
    const context = wh.getContext(this.chain) as EthContext<WormholeContext>;
    await context.approve(
      this.chain,
      this.managerAddress,
      token.address,
      amount,
    );
    try {
      return await this.signAndSendTransaction(tx, TransferWallet.SENDING);
    } catch (e: any) {
      const message = tryParseErrorMessage(manager.interface, e);
      if (message === NotEnoughCapacityError.MESSAGE) {
        throw new NotEnoughCapacityError();
      }
      throw e;
    }
  }

  async receiveMessage(vaa: string): Promise<string> {
    const tx = await this.getManager().populateTransaction.receiveMessage(vaa);
    return this.signAndSendTransaction(tx, TransferWallet.RECEIVING);
  }

  async getMessage(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<UnsignedNTTMessage> {
    const provider = wh.mustGetProvider(chain);
    const receipt = await provider.getTransactionReceipt(tx);
    if (!receipt) {
      throw new Error(`No receipt for tx ${tx} on ${chain}`);
    }
    const manager = this.getManager(receipt.to);
    const tokenAddress = await manager.token();
    const fromChain = wh.toChainName(chain);
    const tokenId = {
      chain: fromChain,
      address: tokenAddress,
    };
    const token = getTokenById(tokenId);
    if (!token) {
      throw new Error(`Token ${tokenId} not found`);
    }
    const wormholeLog = await getWormholeLogEvm(fromChain, receipt);
    const parsedWormholeLog =
      Implementation__factory.createInterface().parseLog(wormholeLog);
    let endpointMessage;
    let managerMessage;
    let relayerFee = '';
    if (parsedWormholeLog.args.sender === manager.address) {
      endpointMessage = parseEndpointMessage(
        Buffer.from(parsedWormholeLog.args.payload.slice(2), 'hex'),
      );
      managerMessage = parseManagerMessage(endpointMessage.managerPayload);
    } else {
      const { type, parsed } = parseWormholeLog(wormholeLog);
      if (type !== RelayerPayloadId.Delivery) {
        throw new Error(`Unexpected payload type ${type}`);
      }
      endpointMessage = parseEndpointMessage(
        (parsed as DeliveryInstruction).payload,
      );
      managerMessage = parseManagerMessage(endpointMessage.managerPayload);
      // Find the SendEvent log to get the relayer fee
      const RELAYER_SEND_EVENT_TOPIC =
        '0xda8540426b64ece7b164a9dce95448765f0a7263ef3ff85091c9c7361e485364';
      const sendEvent = receipt.logs.find(
        (log) =>
          log.address === parsedWormholeLog.args.sender &&
          log.topics[0] === RELAYER_SEND_EVENT_TOPIC,
      );
      if (sendEvent) {
        const sendEventIface = new ethers.utils.Interface([
          'event SendEvent(uint64 indexed sequence, uint256 deliveryQuote, uint256 paymentForExtraReceiverValue)',
        ]);
        const parsed = sendEventIface.parseLog(sendEvent);
        relayerFee = parsed.args.deliveryQuote.toString();
      }
    }
    const transferMessage = parseNativeTokenTransfer(managerMessage.payload);
    const toChain = wh.toChainName(transferMessage.toChain);
    const receivedTokenKey = getNativeVersionOfToken(token.symbol, toChain);
    const destToken = TOKENS[receivedTokenKey];
    if (!destToken) {
      throw new Error(`Token ${receivedTokenKey} not found`);
    }
    const destManager = await manager.getSibling(transferMessage.toChain);
    const fromChainBuffer = Buffer.alloc(2);
    fromChainBuffer.writeUInt16BE(wh.toChainId(fromChain));
    return {
      sendTx: receipt.transactionHash,
      sender: receipt.from,
      amount: transferMessage.amount.toString(),
      payloadID: 1,
      recipient: wh.parseAddress(transferMessage.to, toChain),
      toChain,
      fromChain,
      tokenAddress,
      tokenChain: fromChain,
      tokenId,
      tokenKey: token.key,
      tokenDecimals: getTokenDecimals(
        wh.toChainId(transferMessage.toChain),
        tokenId,
      ),
      receivedTokenKey: destToken.key,
      emitterAddress: hexlify(
        wh.formatAddress(parsedWormholeLog.args.sender, fromChain),
      ),
      sequence: parsedWormholeLog.args.sequence.toString(),
      block: receipt.blockNumber,
      gasFee: receipt.gasUsed.mul(receipt.effectiveGasPrice).toString(),
      sourceManagerAddress: manager.address,
      destManagerAddress: wh.parseAddress(destManager, toChain),
      messageDigest: keccak256(
        Buffer.concat([fromChainBuffer, endpointMessage.managerPayload]),
      ),
      relayerFee,
    };
  }

  async getCurrentOutboundCapacity(): Promise<string> {
    return (await this.getManager().getCurrentOutboundCapacity()).toString();
  }

  async getCurrentInboundCapacity(
    fromChain: ChainName | ChainId,
  ): Promise<string> {
    return (
      await this.getManager().getCurrentInboundCapacity(wh.toChainId(fromChain))
    ).toString();
  }

  async getInboundQueuedTransfer(
    messageDigest: string,
  ): Promise<InboundQueuedTransfer | undefined> {
    const manager = this.getManager();
    const queuedTransfer = await manager.getInboundQueuedTransfer(
      messageDigest,
    );
    if (queuedTransfer.txTimestamp.gt(0)) {
      const duration = await manager.rateLimitDuration();
      const { recipient, amount, txTimestamp } = queuedTransfer;
      return {
        recipient: wh.parseAddress(recipient, this.chain),
        amount: amount.toString(),
        txTimestamp: txTimestamp.toNumber(),
        rateLimitExpiryTimestamp: txTimestamp.add(duration).toNumber(),
      };
    }
    return undefined;
  }

  async completeInboundQueuedTransfer(messageDigest: string): Promise<string> {
    const manager = this.getManager();
    try {
      const tx =
        await manager.populateTransaction.completeInboundQueuedTransfer(
          messageDigest,
        );
      return await this.signAndSendTransaction(tx, TransferWallet.RECEIVING);
    } catch (e) {
      const message = tryParseErrorMessage(manager.interface, e);
      if (message === InboundQueuedTransferNotFoundError.MESSAGE) {
        throw new InboundQueuedTransferNotFoundError();
      }
      if (message === InboundQueuedTransferStillQueuedError.MESSAGE) {
        throw new InboundQueuedTransferStillQueuedError();
      }
      throw e;
    }
  }

  async isMessageExecuted(messageDigest: string): Promise<boolean> {
    return this.getManager().isMessageExecuted(messageDigest);
  }

  async isPaused(): Promise<boolean> {
    return this.getManager().isPaused();
  }
}
