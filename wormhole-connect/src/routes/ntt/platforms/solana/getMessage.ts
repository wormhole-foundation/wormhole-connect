import { solanaContext } from 'utils/sdk';
import { PostedMessageData } from '@certusone/wormhole-sdk/lib/esm/solana/wormhole';
import { hexlify } from 'ethers/lib/utils';
import { UnsignedNTTMessage } from 'routes/types';
import { getNativeVersionOfToken } from 'store/transferInput';
import { getTokenById, getTokenDecimals } from 'utils';
import { wh } from 'utils/sdk';
import { TokenId } from '@wormhole-foundation/wormhole-connect-sdk';
import {
  getNttManagerMessageDigest,
  parseWormholeTransceiverMessage,
} from 'routes/ntt/utils';

export const getMessageSolana = async (
  tx: string,
): Promise<UnsignedNTTMessage> => {
  const context = solanaContext();
  const connection = context.connection;
  if (!connection) throw new Error('Connection not found');
  const response = await connection.getTransaction(tx, {
    maxSupportedTransactionVersion: 0,
  });
  if (!response) throw new Error('Transaction not found');
  const core = wh.mustGetContracts('solana').core;
  const accounts = response?.transaction.message.getAccountKeys();
  const wormholeIx = response?.meta?.innerInstructions
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
  const fromChain = wh.toChainName('solana');
  const toChain = wh.toChainName(nttManagerMessage.payload.recipientChain);
  const tokenAddress = wh.parseAddress(
    hexlify(nttManagerMessage.payload.sourceToken),
    fromChain,
  );
  const tokenId: TokenId = {
    chain: fromChain,
    address: tokenAddress,
  };
  const token = getTokenById(tokenId);
  if (!token) {
    throw new Error(`Token ${tokenId} not found`);
  }
  return {
    sendTx: tx,
    sender: wh.parseAddress(hexlify(nttManagerMessage.sender), fromChain),
    amount: nttManagerMessage.payload.trimmedAmount.amount.toString(),
    payloadID: 1,
    recipient: wh.parseAddress(
      hexlify(nttManagerMessage.payload.recipientAddress),
      toChain,
    ),
    toChain,
    fromChain,
    tokenAddress: wh.parseAddress(
      hexlify(nttManagerMessage.payload.sourceToken),
      fromChain,
    ),
    tokenChain: token.nativeChain,
    tokenId,
    tokenKey: token.key,
    tokenDecimals: getTokenDecimals(wh.toChainId(fromChain), tokenId),
    receivedTokenKey: getNativeVersionOfToken(token.symbol, toChain),
    emitterAddress: hexlify(
      context.formatAddress(messageData.message.emitterAddress),
    ),
    sequence: messageData.message.sequence.toString(),
    block: response.slot,
    gasFee: response.meta?.fee.toString(),
    recipientNttManager: wh.parseAddress(
      hexlify(transceiverMessage.recipientNttManager),
      toChain,
    ),
    messageDigest: getNttManagerMessageDigest(fromChain, nttManagerMessage),
    relayerFee: '',
  };
};
