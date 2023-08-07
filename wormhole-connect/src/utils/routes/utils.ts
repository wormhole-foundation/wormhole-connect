import {
  CHAIN_ID_SEI,
  SignedVaa,
  parseTokenTransferPayload,
  parseVaa,
} from '@certusone/wormhole-sdk';
import { Route } from '../../store/transferInput';
import { PayloadType } from '../sdk';
import RouteAbstract from './routeAbstract';
import { BridgeRoute } from './bridge';
import { RelayRoute } from './relay';
import { HashflowRoute } from './hashflow';
import { CosmosGatewayRoute } from './cosmosGateway';

export const ROUTES: { [r in Route]: RouteAbstract } = {
  [Route.BRIDGE]: new BridgeRoute(),
  [Route.RELAY]: new RelayRoute(),
  [Route.HASHFLOW]: new HashflowRoute(),
  [Route.COSMOS_GATEWAY]: new CosmosGatewayRoute(),
};

export const getRouteForVaa = (vaa: SignedVaa): Route => {
  const message = parseVaa(vaa);

  // if (parsed.emitterAddress === HASHFLOW_CONTRACT_ADDRESS) {
  //    return Route.HASHFLOW;
  // }

  const transfer = parseTokenTransferPayload(message.payload);
  if (transfer.toChain === CHAIN_ID_SEI) {
    return Route.RELAY;
  }

  return message.payload && message.payload[0] === PayloadType.AUTOMATIC
    ? Route.RELAY
    : Route.BRIDGE;
};
