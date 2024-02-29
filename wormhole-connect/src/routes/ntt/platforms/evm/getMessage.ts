import { ChainName, ChainId } from '@wormhole-foundation/wormhole-connect-sdk';
import { Implementation__factory } from '@certusone/wormhole-sdk/lib/esm/ethers-contracts';
import {
  parseWormholeLog,
  RelayerPayloadId,
  DeliveryInstruction,
} from '@certusone/wormhole-sdk/lib/esm/relayer';
import { TOKENS } from 'config';
import { ethers } from 'ethers';
import { hexlify } from 'ethers/lib/utils';
import { NttRelayingType, UnsignedNTTMessage } from 'routes/types';
import { getNativeVersionOfToken } from 'store/transferInput';
import { getTokenById, getTokenDecimals } from 'utils';
import { wh } from 'utils/sdk';
import { getWormholeLogEvm } from 'utils/vaa';
import { NttManager__factory } from './abis';
import {
  getNttManagerMessageDigest,
  parseWormholeTransceiverMessage,
} from 'routes/ntt/utils';

export const getMessageEvm = async (
  tx: string,
  chain: ChainName | ChainId,
): Promise<UnsignedNTTMessage> => {
  const provider = wh.mustGetProvider(chain);
  const receipt = await provider.getTransactionReceipt(tx);
  if (!receipt) {
    throw new Error(`No receipt for tx ${tx} on ${chain}`);
  }
  const nttManager = NttManager__factory.connect(receipt.to, provider);
  const tokenAddress = await nttManager.token();
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

  const relayingInfoEvent = receipt.logs.find(
    (log) =>
      log.topics[0] ===
      '0x375a56c053c4d19a2e3445e97b7a28bf4e908617ce6d766e1e03a9d3f5276271',
  );
  if (!relayingInfoEvent) {
    throw new Error('RelayingInfo event not found');
  }
  const relayingInfoIface = new ethers.utils.Interface([
    'event RelayingInfo(uint8 relayingType, uint256 deliveryPayment)',
  ]);
  const parsedRelayingInfo = relayingInfoIface.parseLog(relayingInfoEvent);
  const { relayingType, deliveryPayment } = parsedRelayingInfo.args;
  let payload: Buffer;
  let relayerFee = '';
  if (relayingType === NttRelayingType.Standard) {
    const { type, parsed } = parseWormholeLog(wormholeLog);
    if (type !== RelayerPayloadId.Delivery) {
      throw new Error(`Unexpected payload type ${type}`);
    }
    payload = (parsed as DeliveryInstruction).payload;
    relayerFee = deliveryPayment.toString();
  } else if (
    relayingType === NttRelayingType.Manual ||
    relayingType === NttRelayingType.Special
  ) {
    payload = Buffer.from(parsedWormholeLog.args.payload.slice(2), 'hex');
  } else {
    throw new Error(`Unexpected relaying type ${relayingType}`);
  }
  const transceiverMessage = parseWormholeTransceiverMessage(payload);
  const nttManagerMessage = transceiverMessage.nttManagerPayload;
  const toChain = wh.toChainName(nttManagerMessage.payload.recipientChain);
  const receivedTokenKey = getNativeVersionOfToken(token.symbol, toChain);
  const destToken = TOKENS[receivedTokenKey];
  if (!destToken) {
    throw new Error(`Token ${receivedTokenKey} not found`);
  }
  return {
    sendTx: receipt.transactionHash,
    sender: receipt.from,
    amount: nttManagerMessage.payload.trimmedAmount.amount.toString(),
    payloadID: 1,
    recipient: wh.parseAddress(
      nttManagerMessage.payload.recipientAddress,
      toChain,
    ),
    toChain,
    fromChain,
    tokenAddress,
    tokenChain: fromChain,
    tokenId,
    tokenKey: token.key,
    tokenDecimals: getTokenDecimals(
      wh.toChainId(nttManagerMessage.payload.recipientChain),
      tokenId,
    ),
    receivedTokenKey,
    emitterAddress: hexlify(
      wh.formatAddress(parsedWormholeLog.args.sender, fromChain),
    ),
    sequence: parsedWormholeLog.args.sequence.toString(),
    block: receipt.blockNumber,
    gasFee: receipt.gasUsed.mul(receipt.effectiveGasPrice).toString(),
    recipientNttManager: wh.parseAddress(
      transceiverMessage.recipientNttManager,
      toChain,
    ),
    messageDigest: getNttManagerMessageDigest(fromChain, nttManagerMessage),
    relayerFee,
    relayingType,
  };
};
