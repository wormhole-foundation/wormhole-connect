import {
  CHAIN_ID_SEI,
  SignedVaa,
  parseTokenTransferPayload,
  parseVaa,
} from '@certusone/wormhole-sdk';
import { Route } from 'config/types';
import { PayloadType } from 'utils/sdk';

export const getRouteForVaa = (vaa: SignedVaa): Route => {
  const message = parseVaa(vaa);

  // if (parsed.emitterAddress === HASHFLOW_CONTRACT_ADDRESS) {
  //    return Route.Hashflow;
  // }

  const transfer = parseTokenTransferPayload(message.payload);
  if (transfer.toChain === CHAIN_ID_SEI) {
    return Route.Relay;
  }

  return message.payload && message.payload[0] === PayloadType.Automatic
    ? Route.Relay
    : Route.Bridge;
};
