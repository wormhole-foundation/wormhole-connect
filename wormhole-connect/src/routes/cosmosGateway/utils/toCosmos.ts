import { CHAIN_ID_WORMCHAIN } from '@certusone/wormhole-sdk';
import { ChainId, TokenId } from '@wormhole-foundation/wormhole-connect-sdk';
import { wh } from 'utils/sdk';
import { TransferWallet, signAndSendTransaction } from '../../../utils/wallet';
import { GatewayTransferMsg } from '../types';
import { getTranslatorAddress } from './contracts';

export function buildToCosmosPayload(
  recipientChainId: ChainId,
  recipientAddress: string,
): Buffer {
  const nonce = Math.round(Math.random() * 10000);
  const recipient = Buffer.from(recipientAddress).toString('base64');

  const payloadObject: GatewayTransferMsg = {
    gateway_transfer: {
      chain: recipientChainId,
      nonce,
      recipient,
      fee: '0',
    },
  };

  return Buffer.from(JSON.stringify(payloadObject));
}

export async function toCosmos(
  token: TokenId | 'native',
  amount: string,
  sendingChainId: ChainId,
  senderAddress: string,
  recipientChainId: ChainId,
  recipientAddress: string,
  routeOptions: any,
): Promise<any> {
  const payload = buildToCosmosPayload(recipientChainId, recipientAddress);

  const tx = await wh.send(
    token,
    amount,
    sendingChainId,
    senderAddress,
    CHAIN_ID_WORMCHAIN,
    getTranslatorAddress(),
    undefined,
    payload,
  );

  return signAndSendTransaction(
    wh.toChainName(sendingChainId),
    tx,
    TransferWallet.SENDING,
  );
}
