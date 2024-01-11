import WormholeIcon from '../icons/Routes/Wormhole';
import XLabsIcon from '../icons/Routes/XLabs';
// import HashflowIcon from '../icons/Routes/Hashflow';
import CCTPIcon from '../icons/Routes/CCTP';
import { Route } from './types';

export type RouteData = {
  route: Route;
  name: string;
  providedBy: string;
  routePath?: string;
  link: string;
  icon: () => JSX.Element;
  pendingMessage: string;
};

export const RoutesConfig: {
  [route in Route]: RouteData;
} = {
  [Route.Bridge]: {
    route: Route.Bridge,
    name: 'Manual Bridge',
    providedBy: 'Wormhole',
    link: 'https://wormhole.com/',
    icon: WormholeIcon,
    pendingMessage: 'Waiting for Wormhole network consensus . . .',
  },
  [Route.Relay]: {
    route: Route.Relay,
    name: 'Automatic Bridge',
    providedBy: 'xLabs',
    link: 'https://xlabs.xyz',
    icon: XLabsIcon,
    pendingMessage: 'Waiting for Wormhole network consensus . . .',
  },
  // [Route.Hashflow]: {
  //   route: Route.Hashflow,
  //   name: 'Hashflow',
  //   providedBy: 'Hashflow',
  //   link: 'https://www.hashflow.com/',
  //   icon: HashflowIcon,
  //   pendingMessage: 'Waiting for Wormhole network consensus . . .',
  // },
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
  [Route.TBTC]: {
    route: Route.TBTC,
    name: 'tBTC',
    providedBy: 'Threshold',
    link: 'https://threshold.network/earn/btc',
    icon: WormholeIcon,
    pendingMessage: 'Waiting for Wormhole network consensus . . .',
  },
  [Route.CosmosGateway]: {
    route: Route.CosmosGateway,
    name: 'Cosmos Gateway',
    providedBy: 'Wormhole',
    link: 'https://wormhole.com/',
    icon: WormholeIcon,
    pendingMessage: 'Waiting for Wormhole network consensus . . .',
  },
  [Route.ETHBridge]: {
    route: Route.ETHBridge,
    name: 'ETH Bridge',
    providedBy: 'xLabs',
    routePath: 'Wormhole',
    link: 'https://xlabs.xyz',
    icon: WormholeIcon,
    pendingMessage: 'Waiting for Wormhole network consensus . . .',
  },
  [Route.wstETHBridge]: {
    route: Route.wstETHBridge,
    name: 'wstETH Bridge',
    providedBy: 'xLabs',
    routePath: 'Wormhole',
    link: 'https://xlabs.xyz',
    icon: WormholeIcon,
    pendingMessage: 'Waiting for Wormhole network consensus . . .',
  },
};
