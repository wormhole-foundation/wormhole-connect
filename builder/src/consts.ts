import {
  MainnetChainName,
  TestnetChainName,
} from "@wormhole-foundation/wormhole-connect";

export type Network = {
  name: string;
  testnet: TestnetChainName;
  mainnet: MainnetChainName;
};

export const NETWORKS: Network[] = [
  {
    name: "Solana",
    testnet: "solana",
    mainnet: "solana",
  },
  {
    name: "Ethereum",

    testnet: "goerli",
    mainnet: "ethereum",
  },
  {
    name: "BSC",
    testnet: "bsc",
    mainnet: "bsc",
  },
  {
    name: "Polygon",
    testnet: "mumbai",
    mainnet: "polygon",
  },
  {
    name: "Avalanche",
    testnet: "fuji",
    mainnet: "avalanche",
  },
  {
    name: "Fantom",
    testnet: "fantom",
    mainnet: "fantom",
  },
  {
    name: "Celo",
    testnet: "alfajores",
    mainnet: "celo",
  },
  {
    name: "Moonbeam",
    testnet: "moonbasealpha",
    mainnet: "moonbeam",
  },
  {
    name: "Sui",
    testnet: "sui",
    mainnet: "sui",
  },
  {
    name: "Aptos",
    testnet: "aptos",
    mainnet: "aptos",
  },
  {
    name: "Base",
    testnet: "basegoerli",
    mainnet: "base",
  },
  {
    name: "Osmosis",
    testnet: "osmosis",
    mainnet: "osmosis",
  },
];

// TODO: move the connect config to a shared sdk
export const TESTNET_TOKEN_KEYS: string[] = [
  "ETH",
  "WETH",
  "USDCeth",
  "WBTC",
  "USDT",
  "DAI",
  "MATIC",
  "WMATIC",
  "USDCpolygon",
  "BNB",
  "WBNB",
  "AVAX",
  "WAVAX",
  "USDCavax",
  "FTM",
  "WFTM",
  "CELO",
  "GLMR",
  "WGLMR",
  "SOL",
  "WSOL",
  "USDCsol",
  "SUI",
  "APT",
  "ETHarbitrum",
  "WETHarbitrum",
  "USDCarbitrum",
  "ETHoptimism",
  "WETHoptimism",
  "USDCoptimism",
  "SEI",
  "ETHbase",
  "WETHbase",
  "OSMO",
  "tBTC",
  "wstETH",
].sort();

export const MAINNET_TOKEN_KEYS: string[] = [
  "ETH",
  "WETH",
  "USDCeth",
  "WBTC",
  "USDT",
  "DAI",
  "BUSD",
  "MATIC",
  "WMATIC",
  "USDCpolygon",
  "BNB",
  "WBNB",
  "USDCbnb",
  "AVAX",
  "WAVAX",
  "USDCavax",
  "FTM",
  "WFTM",
  "CELO",
  "GLMR",
  "WGLMR",
  "SOL",
  "WSOL",
  "USDCsol",
  "SUI",
  "APT",
  "ETHarbitrum",
  "WETHarbitrum",
  "USDCarbitrum",
  "ETHoptimism",
  "WETHoptimism",
  "USDCoptimism",
  "ETHbase",
  "WETHbase",
  "OSMO",
  "tBTC",
  "wstETH",
  "BONK",
].sort();
