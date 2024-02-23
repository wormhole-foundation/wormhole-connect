import { solanaContext } from 'utils/sdk';
import { PostedMessageData } from '@certusone/wormhole-sdk/lib/esm/solana/wormhole';
import { PublicKey } from '@solana/web3.js';
import { hexlify } from 'ethers/lib/utils';
import { UnsignedNTTMessage } from 'routes/types';
import { getNativeVersionOfToken } from 'store/transferInput';
import { getTokenById, getTokenDecimals } from 'utils';
import { wh } from 'utils/sdk';
import {
  WormholeEndpointMessage,
  ManagerMessage,
  NativeTokenTransfer,
  NTT,
} from './sdk';
import { Program } from '@coral-xyz/anchor';
import { IDL } from './abis';
import { TokenId } from '@wormhole-foundation/wormhole-connect-sdk';

export const getMessageSolana = async (
  tx: string,
): Promise<UnsignedNTTMessage> => {
  const connection = solanaContext().connection;
  if (!connection) throw new Error('Connection not found');
  const response = await connection.getParsedTransaction(tx);
  if (!response) throw new Error('Transaction not found');
  // TODO: how to get this? should be an account passed in?
  const outboxItem = new PublicKey('');
  const managerAddress = response.transaction.message.instructions[0].programId; // TODO: is this right?
  const program = new Program(IDL as any, managerAddress, {
    connection,
  });
  const core = wh.mustGetContracts('solana').core;
  if (!core) throw new Error('Core not found');
  const ntt = new NTT({ program, wormholeId: core });
  const wormholeMessage = ntt.wormholeMessageAccountAddress(outboxItem);
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
  const tokenAddress = wh.formatAddress(
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
  return {
    sendTx: tx,
    sender: wh.formatAddress(hexlify(managerMessage.sender), fromChain),
    amount: managerMessage.payload.normalizedAmount.amount.toString(),
    payloadID: 1,
    recipient: wh.parseAddress(
      hexlify(managerMessage.payload.recipientAddress),
      toChain,
    ),
    toChain,
    fromChain,
    tokenAddress: wh.formatAddress(
      hexlify(managerMessage.payload.sourceToken),
      fromChain,
    ),
    tokenChain: token.nativeChain,
    tokenId,
    tokenKey: token.key,
    tokenDecimals: getTokenDecimals(wh.toChainId(fromChain), tokenId),
    receivedTokenKey: getNativeVersionOfToken(token.symbol, toChain),
    emitterAddress: wh.formatAddress(
      hexlify(messageData.message.emitterAddress),
      fromChain,
    ),
    sequence: messageData.message.sequence.toString(),
    block: response.slot,
    gasFee: '0',
    sourceManagerAddress: managerAddress.toString(),
    toManagerAddress: '',
    endpointMessage: hexlify(messageData.message.payload),
    relayerFee: '',
  };
};
