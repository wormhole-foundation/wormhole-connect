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
import { getTokenById, getTokenDecimals } from 'utils';
import { getWormholeLogEvm } from 'utils/vaa';
import config from 'config';
import { toChainName } from 'utils/sdk';
import { deserializePayload, Ntt } from '@wormhole-foundation/sdk-definitions';
import { toChain, toChainId } from '@wormhole-foundation/sdk-base';
import {
  getNttGroupKeyByAddress,
  getNttManagerConfigByGroupKey,
  isNttToken,
} from 'utils/ntt';

const RELAYING_INFO_EVENT_TOPIC =
  '0xc3192e083c87c556db539f071d8a298869f487e951327b5616a6f85ae3da958e';
const RELAYING_INFO_IFACE = new ethers.utils.Interface([
  'event RelayingInfo(uint8 relayingType, bytes32 refundAddress, uint256 deliveryPayment)',
]);

export const getMessageEvm = async (
  tx: string,
  chain: ChainName | ChainId,
  receipt?: ethers.providers.TransactionReceipt,
): Promise<UnsignedNttMessage> => {
  const provider = config.wh.mustGetProvider(chain);
  if (!receipt) {
    receipt = await provider.getTransactionReceipt(tx);
    if (!receipt) throw new Error(`No receipt for tx ${tx} on ${chain}`);
  }
  const contract = new ethers.Contract(
    receipt.to,
    ['function token() public view returns (address)'],
    provider,
  );
  const tokenAddress = await contract.token();
  if (!tokenAddress) throw new Error('No token address');
  const fromChain = toChainName(chain);
  const tokenId = {
    chain: fromChain,
    address: tokenAddress,
  };
  const token = getTokenById(tokenId);
  if (!token || !isNttToken(token))
    throw new Error(`Token ${tokenId} is not an NTT token`);
  const wormholeLog = await getWormholeLogEvm(fromChain, receipt);
  const parsedWormholeLog =
    Implementation__factory.createInterface().parseLog(wormholeLog);
  const relayingInfoEvent = receipt.logs.find(
    (log) => log.topics[0] === RELAYING_INFO_EVENT_TOPIC,
  );
  if (!relayingInfoEvent) throw new Error('RelayingInfo event not found');
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
  const groupKey = getNttGroupKeyByAddress(receipt.to, fromChain);
  if (!groupKey) throw new Error(`No NTT group key for ${receipt.to}`);
  const recipientNttManagerConfig = getNttManagerConfigByGroupKey(
    groupKey,
    recipientChain,
  );
  if (!recipientNttManagerConfig)
    throw new Error('Recipient NTT manager not found');
  const receivedTokenKey = recipientNttManagerConfig.tokenKey;
  if (!receivedTokenKey)
    throw new Error(`Received token key not found for ${tokenId}`);
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
