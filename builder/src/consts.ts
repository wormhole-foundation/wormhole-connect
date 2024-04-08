import { MAINNET, TESTNET } from "@wormhole-foundation/wormhole-connect";

export type MainnetChainName = keyof typeof MAINNET.chains;
export type TestnetChainName = keyof typeof TESTNET.chains;

export type Network = {
  name: string;
  testnet: TestnetChainName;
  mainnet: MainnetChainName;
};

export type RouteInfo = {
  key: string;
  title: string;
  description: string;
  link?: string;
};

export const ROUTE_INFOS: RouteInfo[] = [
  {
    key: "bridge",
    title: "Token Bridge",
    description:
      "Lock-and-Mint bridging between all Wormhole supported chains.",
  },
  {
    key: "relay",
    title: "Token Bridge Automatic Redeems",
    description:
      "Automatic redeems and native gas drop-off for the Token Bridge powered by xLabs.",
  },
  {
    key: "cctpManual",
    title: "Circle CCTP",
    description:
      "Permissionlessly transfer native USDC cross-chain with CCTP + Wormhole.",
    link: "https://www.circle.com/en/cross-chain-transfer-protocol",
  },
  {
    key: "cctpRelay",
    title: "CCTP Automatic Redeems",
    description:
      "Automatic redeems and native gas drop-off for CCTP powered by xLabs.",
  },
  {
    key: "cosmosGateway",
    title: "Gateway",
    description:
      "Gateway connects liquidity and users from Ethereum and beyond to Cosmos chains and apps, all with an IBC-based liquidity router.",
    link: "https://wormhole.com/gateway/",
  },
  {
    key: "tbtc",
    title: "Threshold BTC",
    description:
      "Permissionlessly transfer tBTC cross-chain with Threshold + Wormhole.",
    link: "https://threshold.network/earn/btc",
  },
  {
    key: "ethBridge",
    title: "ETH Bridge",
    description: "Permissionlessly transfer ETH cross-chain with Wormhole.",
  },
  {
    key: "wstETHBridge",
    title: "wstETH Bridge",
    description: "Permissionlessly transfer wstETH cross-chain with Wormhole.",
  },
  {
    key: "nttManual",
    title: "Native Token Transfer",
    description:
      "Permissionlessly transfer native tokens cross-chain with Wormhole.",
    link: "https://github.com/wormhole-foundation/example-native-token-transfers/blob/main/README.md",
  },
  {
    key: "nttRelay",
    title: "Native Token Transfer Automatic Redeems",
    description:
      "Automatic redeems for Native Token Transfers powered by xLabs.",
    link: "https://github.com/wormhole-foundation/example-native-token-transfers/blob/main/README.md",
  },
];
export const ROUTES = ROUTE_INFOS.map((r) => r.key);
