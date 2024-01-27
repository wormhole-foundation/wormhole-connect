import { solanaContext } from 'utils/sdk';
import { PostedMessageData } from '@certusone/wormhole-sdk/lib/esm/solana/wormhole';
import { hexlify } from 'ethers/lib/utils';
import { NttRelayingType, UnsignedNttMessage } from 'routes/types';
import { getNttToken } from 'store/transferInput';
import { getTokenById, getTokenDecimals } from 'utils';
import {
  getNttManagerMessageDigest,
  parseWormholeTransceiverMessage,
} from 'routes/ntt/utils';
import config from 'config';

export const getMessageSolana = async (
  tx: string,
): Promise<UnsignedNttMessage> => {
  const context = solanaContext();
  const connection = context.connection;
  if (!connection) throw new Error('Connection not found');
  const response = await connection.getTransaction(tx, {
    maxSupportedTransactionVersion: 0,
  });
  if (!response) throw new Error('Transaction not found');
  const core = config.wh.mustGetContracts('solana').core;
  const accounts = response.transaction.message.getAccountKeys();
  const wormholeIx = response.meta?.innerInstructions
    ?.flatMap((ix) => ix.instructions)
    .find((ix) => accounts?.get(ix.programIdIndex)?.toString() === core);
  if (!wormholeIx) throw new Error('Wormhole instruction not found');
  const wormholeMessageAccountKey = accounts?.get(wormholeIx.accounts[1]);
  if (!wormholeMessageAccountKey) throw new Error('Message account not found');
  const wormholeMessageAccount = await connection.getAccountInfo(
    wormholeMessageAccountKey,
  );
  if (wormholeMessageAccount === null) {
    throw new Error('wormhole message account not found');
  }
  const messageData = PostedMessageData.deserialize(
    wormholeMessageAccount.data,
  );
  const transceiverMessage = parseWormholeTransceiverMessage(
    messageData.message.payload,
  );
  const nttManagerMessage = transceiverMessage.nttManagerPayload;
  const fromChain = config.wh.toChainName('solana');
  const toChain = config.wh.toChainName(
    nttManagerMessage.payload.recipientChain,
  );
  const tokenAddress = config.wh.parseAddress(
    hexlify(nttManagerMessage.payload.sourceToken),
    fromChain,
  );
  const tokenId = {
    chain: fromChain,
    address: tokenAddress,
  };
  const token = getTokenById(tokenId);
  if (!token?.ntt) {
    throw new Error(`Token ${tokenId} not found`);
  }
  const receivedTokenKey = getNttToken(token.ntt.groupId, toChain);
  if (!receivedTokenKey) {
    throw new Error(`Received token key not found for ${tokenId}`);
  }
  const logMsgs = response.meta?.logMessages || [];
  const regex = /total fee in lamports: (\d+)/;
  const relayerFeeMsg = logMsgs.find((msg) => regex.test(msg));
  const relayerFee = relayerFeeMsg ? regex.exec(relayerFeeMsg)?.[1] : '';
  return {
    sendTx: tx,
    sender: config.wh.parseAddress(
      hexlify(nttManagerMessage.sender),
      fromChain,
    ),
    amount: nttManagerMessage.payload.trimmedAmount.amount.toString(),
    payloadID: 0,
    recipient: config.wh.parseAddress(
      hexlify(nttManagerMessage.payload.recipientAddress),
      toChain,
    ),
    toChain,
    fromChain,
    tokenAddress: config.wh.parseAddress(
      hexlify(nttManagerMessage.payload.sourceToken),
      fromChain,
    ),
    tokenChain: token.nativeChain,
    tokenId,
    tokenKey: token.key,
    tokenDecimals: getTokenDecimals(config.wh.toChainId(fromChain), tokenId),
    receivedTokenKey,
    emitterAddress: hexlify(
      context.formatAddress(messageData.message.emitterAddress),
    ),
    sequence: messageData.message.sequence.toString(),
    block: response.slot,
    gasFee: response.meta?.fee.toString(),
    recipientNttManager: config.wh.parseAddress(
      hexlify(transceiverMessage.recipientNttManager),
      toChain,
    ),
    messageDigest: getNttManagerMessageDigest(fromChain, nttManagerMessage),
    relayerFee: relayerFee || '',
    relayingType: relayerFee ? NttRelayingType.Special : NttRelayingType.Manual,
  };
};
