import { ChainName, ChainId } from '@wormhole-foundation/wormhole-connect-sdk';
import { Implementation__factory } from '@certusone/wormhole-sdk/lib/esm/ethers-contracts';
import {
  parseWormholeLog,
  RelayerPayloadId,
  DeliveryInstruction,
} from '@certusone/wormhole-sdk/lib/esm/relayer';
import { ethers } from 'ethers';
import { hexlify } from 'ethers/lib/utils';
import { NttRelayingType, UnsignedNttMessage } from 'routes/types';
import { getNttToken } from 'store/transferInput';
import { getTokenById, getTokenDecimals } from 'utils';
import { getWormholeLogEvm } from 'utils/vaa';
import { NttManager__factory } from './abis';
import config from 'config';
import { toChainName } from 'utils/sdk';
import { deserializePayload, Ntt } from '@wormhole-foundation/sdk-definitions';
import { toChain, toChainId } from '@wormhole-foundation/sdk-base';

const RELAYING_INFO_EVENT_TOPIC =
  '0x375a56c053c4d19a2e3445e97b7a28bf4e908617ce6d766e1e03a9d3f5276271';
const RELAYING_INFO_IFACE = new ethers.utils.Interface([
  'event RelayingInfo(uint8 relayingType, uint256 deliveryPayment)',
]);

export const getMessageEvm = async (
  tx: string,
  chain: ChainName | ChainId,
  receipt?: ethers.providers.TransactionReceipt,
): Promise<UnsignedNttMessage> => {
  const provider = config.wh.mustGetProvider(chain);
  if (!receipt) {
    receipt = await provider.getTransactionReceipt(tx);
    if (!receipt) {
      throw new Error(`No receipt for tx ${tx} on ${chain}`);
    }
  }
  const nttManager = NttManager__factory.connect(receipt.to, provider);
  const tokenAddress = await nttManager.token();
  const fromChain = toChainName(chain);
  const tokenId = {
    chain: fromChain,
    address: tokenAddress,
  };
  const token = getTokenById(tokenId);
  if (!token?.ntt) {
    throw new Error(`Token ${tokenId} not found`);
  }
  const wormholeLog = await getWormholeLogEvm(fromChain, receipt);
  const parsedWormholeLog =
    Implementation__factory.createInterface().parseLog(wormholeLog);
  const relayingInfoEvent = receipt.logs.find(
    (log) => log.topics[0] === RELAYING_INFO_EVENT_TOPIC,
  );
  if (!relayingInfoEvent) {
    throw new Error('RelayingInfo event not found');
  }
  const parsedRelayingInfo = RELAYING_INFO_IFACE.parseLog(relayingInfoEvent);
  const { relayingType, deliveryPayment } = parsedRelayingInfo.args;
  let payload: Buffer;
  if (relayingType === NttRelayingType.Standard) {
    const { type, parsed } = parseWormholeLog(wormholeLog);
    if (type !== RelayerPayloadId.Delivery) {
      throw new Error(`Unexpected standard relayer payload type ${type}`);
    }
    payload = (parsed as DeliveryInstruction).payload;
  } else if (
    relayingType === NttRelayingType.Manual ||
    relayingType === NttRelayingType.Special
  ) {
    payload = Buffer.from(parsedWormholeLog.args.payload.slice(2), 'hex');
  } else {
    throw new Error(`Unexpected relaying type ${relayingType}`);
  }
  const transceiverMessage = deserializePayload(
    'Ntt:WormholeTransfer',
    payload,
  );
  const nttManagerMessage = transceiverMessage.nttManagerPayload;
  const recipientChain = toChainName(
    toChainId(nttManagerMessage.payload.recipientChain) as ChainId,
  );
  const receivedTokenKey = getNttToken(token.ntt.groupId, recipientChain);
  if (!receivedTokenKey) {
    throw new Error(`Received token key not found for ${tokenId}`);
  }
  return {
    sendTx: receipt.transactionHash,
    sender: receipt.from,
    amount: nttManagerMessage.payload.trimmedAmount.amount.toString(),
    payloadID: 0,
    recipient: config.wh.parseAddress(
      nttManagerMessage.payload.recipientAddress.toString(),
      recipientChain,
    ),
    toChain: recipientChain,
    fromChain,
    tokenAddress,
    tokenChain: token.nativeChain,
    tokenId,
    tokenKey: token.key,
    tokenDecimals: getTokenDecimals(config.wh.toChainId(fromChain), tokenId),
    receivedTokenKey,
    emitterAddress: hexlify(
      config.wh.formatAddress(parsedWormholeLog.args.sender, fromChain),
    ),
    sequence: parsedWormholeLog.args.sequence.toString(),
    block: receipt.blockNumber,
    gasFee: receipt.gasUsed.mul(receipt.effectiveGasPrice).toString(),
    recipientNttManager: config.wh.parseAddress(
      hexlify(transceiverMessage.recipientNttManager.toString()),
      recipientChain,
    ),
    messageDigest: hexlify(
      Ntt.messageDigest(
        toChain(config.wh.toChainId(fromChain) as number),
        nttManagerMessage,
      ),
    ),
    relayerFee: deliveryPayment.toString(),
    relayingType,
  };
};
