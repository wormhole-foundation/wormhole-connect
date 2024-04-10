import { PostedMessageData } from '@certusone/wormhole-sdk/lib/esm/solana/wormhole';
import { PublicKey } from '@solana/web3.js';
import { deserializePayload, toChainId } from '@wormhole-foundation/sdk';
import { Ntt } from '@wormhole-foundation/sdk-definitions-ntt';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import config from 'config';
import { hexlify } from 'ethers/lib/utils';
import { NttRelayingType, UnsignedNttMessage } from 'routes/types';
import { getTokenById, getTokenDecimals } from 'utils';
import {
  getNttGroupKeyByAddress,
  getNttManagerConfigByGroupKey,
  isNttToken,
} from 'utils/ntt';
import { solanaContext } from 'utils/sdk';

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
  const fromChain: ChainName = 'solana';
  const core = config.wh.mustGetContracts(fromChain).core;
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
  if (wormholeMessageAccount === null)
    throw new Error('wormhole message account not found');
  const messageData = PostedMessageData.deserialize(
    wormholeMessageAccount.data,
  );
  const transceiverMessage = deserializePayload(
    'Ntt:WormholeTransfer',
    messageData.message.payload,
  );
  const nttManagerMessage = transceiverMessage.nttManagerPayload;
  const recipientChain = config.wh.toChainName(
    toChainId(nttManagerMessage.payload.recipientChain),
  );
  const tokenAddress = config.wh.parseAddress(
    hexlify(nttManagerMessage.payload.sourceToken.toString()),
    fromChain,
  );
  const tokenId = {
    chain: fromChain,
    address: tokenAddress,
  };
  const token = getTokenById(tokenId);
  if (!token || !isNttToken(token))
    throw new Error(`Token ${tokenId} is not an NTT token`);
  const groupKey = getNttGroupKeyByAddress(
    new PublicKey(
      transceiverMessage.sourceNttManager.toUint8Array(),
    ).toString(),
    fromChain,
  );
  if (!groupKey) throw new Error('Group key not found');
  const recipientNttManagerConfig = getNttManagerConfigByGroupKey(
    groupKey,
    recipientChain,
  );
  if (!recipientNttManagerConfig)
    throw new Error('Recipient NTT manager not found');
  const receivedTokenKey = recipientNttManagerConfig.tokenKey;
  if (!receivedTokenKey)
    throw new Error(`Received token key not found for ${tokenId}`);
  const logMsgs = response.meta?.logMessages || [];
  const regex = /total fee in lamports: (\d+)/;
  const relayerFeeMsg = logMsgs.find((msg) => regex.test(msg));
  const relayerFee = relayerFeeMsg ? regex.exec(relayerFeeMsg)?.[1] : '';
  return {
    sendTx: tx,
    sender: config.wh.parseAddress(
      hexlify(nttManagerMessage.sender.toUint8Array()),
      fromChain,
    ),
    amount: nttManagerMessage.payload.trimmedAmount.amount.toString(),
    payloadID: 0,
    recipient: config.wh.parseAddress(
      hexlify(nttManagerMessage.payload.recipientAddress.toString()),
      recipientChain,
    ),
    toChain: recipientChain,
    fromChain,
    tokenAddress: config.wh.parseAddress(
      hexlify(nttManagerMessage.payload.sourceToken.toString()),
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
      hexlify(transceiverMessage.recipientNttManager.toString()),
      recipientChain,
    ),
    messageDigest: hexlify(Ntt.messageDigest('Solana', nttManagerMessage)),
    relayerFee: relayerFee || '',
    relayingType: relayerFee ? NttRelayingType.Special : NttRelayingType.Manual,
  };
};
