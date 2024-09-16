import WormholeIcon from '../icons/Routes/Wormhole';
import XLabsIcon from '../icons/Routes/XLabs';
// import HashflowIcon from '../icons/Routes/Hashflow';
import CCTPIcon from '../icons/Routes/CCTP';

export type RouteData = {
  name: string; // Should match meta.name in RouteConstructor
  displayName: string; // Human-readable name
  providedBy?: string;
  link: string;
  // TODO remove this once we've removed the old v1 views; v2 doesn't use it
  icon: () => JSX.Element;
  // TODO remove this once we've removed the old v1 views; v2 doesn't use it
  pendingMessage: string;
};

// TODO SDKV2 REMOVE THIS, WE SHOULDNT HAVE THIS KIND OF INFORMATION IN CONNECT
export const RoutesConfig: Record<string, RouteData> = {
  ManualTokenBridge: {
    name: 'ManualTokenBridge',
    displayName: 'Manual Bridge',
    link: 'https://wormhole.com/',
    icon: WormholeIcon,
    pendingMessage: 'Waiting for Wormhole network consensus . . .',
  },
  AutomaticTokenBridge: {
    name: 'AutomaticTokenBridge',
    displayName: 'Automatic Bridge',
    link: 'https://xlabs.xyz',
    icon: XLabsIcon,
    pendingMessage: 'Waiting for Wormhole network consensus . . .',
  },
  ManualCCTP: {
    name: 'ManualCCTP',
    displayName: 'Circle CCTP',
    providedBy: 'Circle',
    link: 'https://www.circle.com/en/cross-chain-transfer-protocol',
    icon: CCTPIcon,
    pendingMessage: 'Waiting for Circle attestation . . .',
  },
  AutomaticCCTP: {
    name: 'AutomaticCCTP',
    displayName: 'Circle CCTP',
    providedBy: 'Circle',
    link: 'https://www.circle.com/en/cross-chain-transfer-protocol',
    icon: CCTPIcon,
    pendingMessage: 'Waiting for Circle attestation . . .',
  },
  /*
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
    link: 'https://xlabs.xyz',
    icon: WormholeIcon,
    pendingMessage: 'Waiting for Wormhole network consensus . . .',
  },
  [Route.wstETHBridge]: {
    route: Route.wstETHBridge,
    name: 'wstETH Bridge',
    providedBy: 'xLabs',
    link: 'https://xlabs.xyz',
    icon: WormholeIcon,
    pendingMessage: 'Waiting for Wormhole network consensus . . .',
  },
  */
  ManualNtt: {
    name: 'ManualNtt',
    displayName: 'Native Token Transfer',
    link: 'https://wormhole.com/',
    icon: WormholeIcon,
    pendingMessage: 'Waiting for Wormhole network consensus . . .',
  },
  AutomaticNtt: {
    name: 'AutomaticNtt',
    displayName: 'Native Token Transfer',
    link: 'https://xlabs.xyz',
    icon: XLabsIcon,
    pendingMessage: 'Waiting for Wormhole network consensus . . .',
  },
  MayanSwap: {
    name: 'MayanSwap',
    displayName: 'Mayan Swap',
    providedBy: 'Mayan',
    link: 'https://mayan.finance/',
    icon: XLabsIcon,
    pendingMessage: 'Waiting for Wormhole network consensus . . .',
  },
  MayanSwapWH: {
    name: 'MayanSwapWH',
    displayName: 'Mayan Swap',
    providedBy: 'Mayan',
    link: 'https://mayan.finance/',
    icon: XLabsIcon,
    pendingMessage: 'Waiting for Wormhole network consensus . . .',
  },
  MayanSwapMCTP: {
    name: 'MayanSwapMCTP',
    displayName: 'Mayan Swap MCTP',
    providedBy: 'Mayan MCTP',
    link: 'https://mayan.finance/',
    icon: XLabsIcon,
    pendingMessage: 'Waiting for Wormhole network consensus . . .',
  },
  MayanSwapSWIFT: {
    name: 'MayanSwapSWIFT',
    displayName: 'Mayan Swap Swift',
    providedBy: 'Mayan Swift',
    link: 'https://mayan.finance/',
    icon: XLabsIcon,
    pendingMessage: 'Waiting for Wormhole network consensus . . .',
  },
};
