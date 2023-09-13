import WormholeIcon from '../icons/Routes/Wormhole';
import XLabsIcon from '../icons/Routes/XLabs';
import HashflowIcon from '../icons/Routes/Hashflow';
import CCTPIcon from '../icons/Routes/CCTP';
import { Route } from './types';

export type RouteData = {
  route: Route;
  name: string;
  providedBy: string;
  link: string;
  icon: () => JSX.Element;
  pendingMessage: string;
};

export const RoutesConfig: {
  [route in Route]: RouteData;
} = {
  [Route.Bridge]: {
    route: Route.Bridge,
    name: 'Bridge',
    providedBy: 'Wormhole',
    link: 'https://wormhole.com/',
    icon: WormholeIcon,
    pendingMessage: 'Waiting for Wormhole network consensus . . .',
  },
  [Route.Relay]: {
    route: Route.Relay,
    name: 'Automatic Deposit',
    providedBy: 'xLabs',
    link: 'https://xlabs.xyz',
    icon: XLabsIcon,
    pendingMessage: 'Waiting for Wormhole network consensus . . .',
  },
  [Route.Hashflow]: {
    route: Route.Hashflow,
    name: 'Hashflow',
    providedBy: 'Hashflow',
    link: 'https://www.hashflow.com/',
    icon: HashflowIcon,
    pendingMessage: 'Waiting for Wormhole network consensus . . .',
  },
  [Route.CCTPManual]: {
    route: Route.CCTPManual,
    name: 'Circle CCTP',
    providedBy: 'Circle',
    link: 'https://www.circle.com/en/cross-chain-transfer-protocol',
    icon: CCTPIcon,
    pendingMessage: 'Waiting for Circle attestation . . .',
  },
  [Route.CCTPRelay]: {
    route: Route.CCTPRelay,
    name: 'Circle CCTP',
    providedBy: 'Circle',
    link: 'https://www.circle.com/en/cross-chain-transfer-protocol',
    icon: CCTPIcon,
    pendingMessage: 'Waiting for Circle attestation . . .',
  },
  [Route.CosmosGateway]: {
    route: Route.CosmosGateway,
    name: 'Cosmos Gateway',
    providedBy: 'Wormhole',
    link: 'https://wormhole.com/',
    icon: WormholeIcon,
    pendingMessage: 'Waiting for Wormhole network consensus . . .',
  },
};
