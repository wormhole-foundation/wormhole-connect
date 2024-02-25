import { solanaContext } from 'utils/sdk';
import { PostedMessageData } from '@certusone/wormhole-sdk/lib/esm/solana/wormhole';
import { hexlify } from 'ethers/lib/utils';
import { UnsignedNTTMessage } from 'routes/types';
import { getNativeVersionOfToken } from 'store/transferInput';
import { getTokenById, getTokenDecimals } from 'utils';
import { wh } from 'utils/sdk';
import {
  WormholeEndpointMessage,
  ManagerMessage,
  NativeTokenTransfer,
} from './sdk';
import { TokenId } from '@wormhole-foundation/wormhole-connect-sdk';

export const getMessageSolana = async (
  tx: string,
): Promise<UnsignedNTTMessage> => {
  const context = solanaContext();
  const connection = context.connection;
  if (!connection) throw new Error('Connection not found');
  const response = await connection.getParsedTransaction(tx);
  if (!response) throw new Error('Transaction not found');
  const managerAddress = response.transaction.message.instructions[0].programId;
  // TODO: this is scary indexing into this, can we rely on this index?
  const wormholeMessage = response.transaction.message.accountKeys[6].pubkey;
  const wormholeMessageAccount = await connection.getAccountInfo(
    wormholeMessage,
  );
  if (wormholeMessageAccount === null) {
    throw new Error('wormhole message account not found');
  }
  const messageData = PostedMessageData.deserialize(
    wormholeMessageAccount.data,
  );
  const managerMessage = WormholeEndpointMessage.deserialize(
    messageData.message.payload,
    (a) => ManagerMessage.deserialize(a, NativeTokenTransfer.deserialize),
  ).managerPayload;
  const fromChain = wh.toChainName('solana');
  const toChain = wh.toChainName(managerMessage.payload.recipientChain);
  const tokenAddress = wh.parseAddress(
    hexlify(managerMessage.payload.sourceToken),
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
  console.log(messageData.message.emitterAddress.toString('hex'));
  return {
    sendTx: tx,
    sender: wh.parseAddress(hexlify(managerMessage.sender), fromChain),
    amount: managerMessage.payload.normalizedAmount.amount.toString(),
    payloadID: 1,
    recipient: wh.parseAddress(
      hexlify(managerMessage.payload.recipientAddress),
      toChain,
    ),
    toChain,
    fromChain,
    tokenAddress: wh.parseAddress(
      hexlify(managerMessage.payload.sourceToken),
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
    gasFee: '0',
    sourceManagerAddress: managerAddress.toString(),
    toManagerAddress: '', // TODO: will be on payload
    endpointMessage: hexlify(messageData.message.payload),
    relayerFee: '',
  };
};
