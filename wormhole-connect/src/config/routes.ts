import { Route } from '../store/transferInput';
import WormholeIcon from '../icons/Routes/Wormhole';
import XLabsIcon from '../icons/Routes/XLabs';
import HashflowIcon from '../icons/Routes/Hashflow';
import CCTPIcon from '../icons/Routes/CCTP';

export type RouteData = {
  route: Route;
  name: string;
  providedBy: string;
  link: string;
  icon: () => JSX.Element;
};

export const ROUTES: {
  [route in Route]: RouteData;
} = {
  [Route.BRIDGE]: {
    route: Route.BRIDGE,
    name: 'Bridge',
    providedBy: 'Wormhole',
    link: 'https://wormhole.com/',
    icon: WormholeIcon,
  },
  [Route.RELAY]: {
    route: Route.RELAY,
    name: 'Automatic Deposit',
    providedBy: 'xLabs',
    link: 'https://xlabs.xyz',
    icon: XLabsIcon,
  },
  [Route.HASHFLOW]: {
    route: Route.HASHFLOW,
    name: 'Hashflow',
    providedBy: 'Hashflow',
    link: 'https://www.hashflow.com/',
    icon: HashflowIcon,
  },
  [Route.CCTPManual]: {
    route: Route.CCTPManual,
    name: 'Circle CCTP',
    providedBy: 'Circle',
    link: 'https://www.circle.com/en/cross-chain-transfer-protocol',
    icon: CCTPIcon,
  },
  [Route.CCTPRelay]: {
    route: Route.CCTPRelay,
    name: 'Circle CCTP',
    providedBy: 'Circle',
    link: 'https://www.circle.com/en/cross-chain-transfer-protocol',
    icon: CCTPIcon,
  },
  [Route.COSMOS_GATEWAY]: {
    route: Route.COSMOS_GATEWAY,
    name: 'Cosmos Gateway',
    providedBy: 'Wormhole',
    link: 'https://wormhole.com/',
    icon: WormholeIcon,
  },
};
