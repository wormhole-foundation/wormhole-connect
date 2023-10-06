import { CHAIN_ID_SOLANA } from '@certusone/wormhole-sdk';
import { calculateFee, Coin, MsgTransferEncodeObject } from '@cosmjs/stargate';
import { MsgTransfer } from 'cosmjs-types/ibc/applications/transfer/v1/tx';
import {
  ChainId,
  CosmosTransaction,
  TokenId,
  SolanaContext,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { wh } from 'utils/sdk';
import { TransferWallet, signAndSendTransaction } from 'utils/wallet';
import { FromCosmosPayload } from '../types';
import { IBC_PORT } from '../utils/consts';
import { IBC_MSG_TYPE, IBC_TIMEOUT_MILLIS, millisToNano } from './consts';
import { getIbcDestinationChannel, getTranslatorAddress } from './contracts';

export function buildFromCosmosPayloadMemo(
  recipientChainId: ChainId,
  recipientAddress: string,
): string {
  const nonce = Math.round(Math.random() * 10000);

  const destContext = wh.getContext(recipientChainId);
  const recipient = Buffer.from(
    destContext.formatAddress(recipientAddress),
  ).toString('base64');

  const payloadObject: FromCosmosPayload = {
    gateway_ibc_token_bridge_payload: {
      gateway_transfer: {
        chain: recipientChainId,
        nonce,
        recipient,
        fee: '0',
      },
    },
  };

  return JSON.stringify(payloadObject);
}

export async function fromCosmos(
  token: TokenId | 'native',
  amount: string,
  sendingChainId: ChainId,
  senderAddress: string,
  recipientChainId: ChainId,
  recipientAddress: string,
  routeOptions: any,
): Promise<any> {
  if (token === 'native') throw new Error('Native token not supported');

  let recipient = recipientAddress;
  // get token account for solana
  if (recipientChainId === CHAIN_ID_SOLANA) {
    const account = await (
      wh.getContext(CHAIN_ID_SOLANA) as SolanaContext<WormholeContext>
    ).getAssociatedTokenAddress(token, recipientAddress);
    recipient = account.toString();
  }

  const memo = buildFromCosmosPayloadMemo(recipientChainId, recipient);

  const denom = await wh.getForeignAsset(token, sendingChainId);
  if (!denom) throw new Error('Could not derive IBC asset denom');
  const coin: Coin = {
    denom,
    amount,
  };
  const channel = await getIbcDestinationChannel(sendingChainId);
  const ibcMessage: MsgTransferEncodeObject = {
    typeUrl: IBC_MSG_TYPE,
    value: MsgTransfer.fromPartial({
      sourcePort: IBC_PORT,
      sourceChannel: channel,
      sender: senderAddress,
      receiver: getTranslatorAddress(),
      token: coin,
      timeoutTimestamp: millisToNano(Date.now() + IBC_TIMEOUT_MILLIS),
      memo,
    }),
  };

  const tx: CosmosTransaction = {
    fee: calculateFee(1000000, '1.0uosmo'),
    msgs: [ibcMessage],
    memo: '',
  };

  return signAndSendTransaction(
    wh.toChainName(sendingChainId),
    tx,
    TransferWallet.SENDING,
  );
}
