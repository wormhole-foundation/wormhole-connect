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

export const ROUTES = [
  "bridge",
  "relay",
  "cosmosGateway",
  "cctpManual",
  "cctpRelay",
  "tbtc",
].sort();

export const DEFAULT_MAINNET_RPCS = {
  ethereum: "https://rpc.ankr.com/eth",
  solana: "https://api.mainnet-beta.solana.com",
  polygon: "https://rpc.ankr.com/polygon",
  bsc: "https://bscrpc.com",
  avalanche: "https://rpc.ankr.com/avalanche",
  fantom: "https://rpc.ankr.com/fantom",
  celo: "https://rpc.ankr.com/celo",
  moonbeam: "https://rpc.ankr.com/moonbeam",
  sui: "https://rpc.mainnet.sui.io",
  aptos: "https://fullnode.mainnet.aptoslabs.com/v1",
  arbitrum: "https://arb1.arbitrum.io/rpc",
  optimism: "https://mainnet.optimism.io",
  base: "https://mainnet.base.org",
  sei: "", // TODO: fill in
  wormchain: "",
  osmosis: "https://osmosis-rpc.polkachu.com",
};

export const DEFAULT_TESTNET_RPCS = {
  goerli: "https://rpc.ankr.com/eth_goerli",
  mumbai: "https://polygon-mumbai.blockpi.network/v1/rpc/public",
  bsc: "https://data-seed-prebsc-1-s3.binance.org:8545",
  fuji: "https://api.avax-test.network/ext/bc/C/rpc",
  fantom: "https://rpc.ankr.com/fantom_testnet",
  alfajores: "https://alfajores-forno.celo-testnet.org",
  solana: "https://api.devnet.solana.com",
  moonbasealpha: "https://rpc.api.moonbase.moonbeam.network",
  sui: "https://fullnode.testnet.sui.io",
  aptos: "https://fullnode.testnet.aptoslabs.com/v1",
  arbitrumgoerli: "https://arbitrum-goerli.publicnode.com",
  optimismgoerli: "https://optimism-goerli.publicnode.com",
  basegoerli: "https://goerli.base.org",
  sei: "https://rpc.atlantic-2.seinetwork.io",
  wormchain: "",
  osmosis: "https://rpc.osmotest5.osmosis.zone",
};
