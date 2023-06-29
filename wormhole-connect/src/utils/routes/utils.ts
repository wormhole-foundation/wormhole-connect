import {
  CHAIN_ID_SEI,
  ParsedVaa,
  parseTokenTransferPayload,
} from '@certusone/wormhole-sdk';
import { Route } from '../../store/transferInput';
import { PayloadType } from '../sdk';
import RouteAbstract from './routeAbstract';
import { BridgeRoute } from './bridge';
import { RelayRoute } from './relay';
import { HashflowRoute } from './hashflow';

export const ROUTES: { [r in Route]: RouteAbstract } = {
  [Route.BRIDGE]: new BridgeRoute(),
  [Route.RELAY]: new RelayRoute(),
  [Route.HASHFLOW]: new HashflowRoute(),
};

export const getRouteForVaa = (vaa: ParsedVaa): Route => {
  // if (parsed.emitterAddress === HASHFLOW_CONTRACT_ADDRESS) {
  //    return Route.HASHFLOW;
  // }

  const transfer = parseTokenTransferPayload(vaa.payload);
  if (transfer.toChain === CHAIN_ID_SEI) {
    return Route.RELAY;
  }

  return vaa.payload && vaa.payload[0] === PayloadType.AUTOMATIC
    ? Route.RELAY
    : Route.BRIDGE;
};
