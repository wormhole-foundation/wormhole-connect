import { ChainId } from '@wormhole-foundation/wormhole-connect-sdk';

export interface GatewayTransferMsg {
  gateway_transfer: {
    chain: ChainId;
    recipient: string;
    fee: string;
    nonce: number;
  };
}

export interface FromCosmosPayload {
  gateway_ibc_token_bridge_payload: GatewayTransferMsg;
}
