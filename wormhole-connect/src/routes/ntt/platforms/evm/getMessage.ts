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
import { UnsignedNTTMessage } from 'routes/types';
import { getNativeVersionOfToken } from 'store/transferInput';
import { getTokenById, getTokenDecimals } from 'utils';
import { wh } from 'utils/sdk';
import { getWormholeLogEvm } from 'utils/vaa';
import {
  WormholeEndpointMessage,
  ManagerMessage,
  NativeTokenTransfer,
} from '../solana/sdk';
import { Manager__factory } from './abis';

export const getMessageEvm = async (
  tx: string,
  chain: ChainName | ChainId,
): Promise<UnsignedNTTMessage> => {
  const provider = wh.mustGetProvider(chain);
  const receipt = await provider.getTransactionReceipt(tx);
  if (!receipt) {
    throw new Error(`No receipt for tx ${tx} on ${chain}`);
  }
  const manager = Manager__factory.connect(receipt.to, provider);
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
  let payload: Buffer;
  let relayerFee = '';
  if (parsedWormholeLog.args.sender === token.ntt?.wormholeEndpointAddress) {
    payload = Buffer.from(parsedWormholeLog.args.payload.slice(2), 'hex');
  } else {
    const { type, parsed } = parseWormholeLog(wormholeLog);
    if (type !== RelayerPayloadId.Delivery) {
      throw new Error(`Unexpected payload type ${type}`);
    }
    payload = (parsed as DeliveryInstruction).payload;
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
  const managerMessage = WormholeEndpointMessage.deserialize(payload, (a) =>
    ManagerMessage.deserialize(a, NativeTokenTransfer.deserialize),
  ).managerPayload;
  const toChain = wh.toChainName(managerMessage.payload.recipientChain);
  const receivedTokenKey = getNativeVersionOfToken(token.symbol, toChain);
  const destToken = TOKENS[receivedTokenKey];
  if (!destToken) {
    throw new Error(`Token ${receivedTokenKey} not found`);
  }
  // TODO: use recipient token to get sibling?
  const toManager = await manager.getSibling(
    managerMessage.payload.recipientChain,
  );
  return {
    sendTx: receipt.transactionHash,
    sender: receipt.from,
    amount: managerMessage.payload.normalizedAmount.amount.toString(),
    payloadID: 1,
    recipient: wh.parseAddress(
      managerMessage.payload.recipientAddress,
      toChain,
    ),
    toChain,
    fromChain,
    tokenAddress,
    tokenChain: fromChain,
    tokenId,
    tokenKey: token.key,
    tokenDecimals: getTokenDecimals(
      wh.toChainId(managerMessage.payload.recipientChain),
      tokenId,
    ),
    receivedTokenKey,
    emitterAddress: hexlify(
      wh.formatAddress(parsedWormholeLog.args.sender, fromChain),
    ),
    sequence: parsedWormholeLog.args.sequence.toString(),
    block: receipt.blockNumber,
    gasFee: receipt.gasUsed.mul(receipt.effectiveGasPrice).toString(),
    sourceManagerAddress: manager.address,
    toManagerAddress: wh.parseAddress(toManager, toChain),
    endpointMessage: hexlify(payload),
    relayerFee,
  };
};
