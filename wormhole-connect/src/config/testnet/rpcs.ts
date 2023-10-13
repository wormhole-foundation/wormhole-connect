import { populateRpcField } from '../utils';
const {
  REACT_APP_GOERLI_RPC,
  REACT_APP_MUMBAI_RPC,
  REACT_APP_BSC_TESTNET_RPC,
  REACT_APP_FUJI_RPC,
  REACT_APP_FANTOM_TESTNET_RPC,
  REACT_APP_ALFAJORES_RPC,
  REACT_APP_SOLANA_DEVNET_RPC,
  REACT_APP_MOONBASE_RPC,
  REACT_APP_SUI_TESTNET_RPC,
  REACT_APP_APTOS_TESTNET_RPC,
  REACT_APP_SEI_TESTNET_RPC,
  REACT_APP_BASE_GOERLI_RPC,
  REACT_APP_OSMOSIS_TESTNET_RPC,
  REACT_APP_WORMCHAIN_TESTNET_RPC,
  REACT_APP_EVMOS_TESTNET_RPC,
  REACT_APP_COSMOSHUB_TESTNET_RPC,
  REACT_APP_SEI_REST,
} = process.env;

export const TESTNET_RPC_MAPPING = {
  ...populateRpcField('goerli', REACT_APP_GOERLI_RPC),
  ...populateRpcField('mumbai', REACT_APP_MUMBAI_RPC),
  ...populateRpcField('bsc', REACT_APP_BSC_TESTNET_RPC),
  ...populateRpcField('fuji', REACT_APP_FUJI_RPC),
  ...populateRpcField('fantom', REACT_APP_FANTOM_TESTNET_RPC),
  ...populateRpcField('alfajores', REACT_APP_ALFAJORES_RPC),
  ...populateRpcField('solana', REACT_APP_SOLANA_DEVNET_RPC),
  ...populateRpcField('moonbasealpha', REACT_APP_MOONBASE_RPC),
  ...populateRpcField('sui', REACT_APP_SUI_TESTNET_RPC),
  ...populateRpcField('aptos', REACT_APP_APTOS_TESTNET_RPC),
  ...populateRpcField('sei', REACT_APP_SEI_TESTNET_RPC),
  ...populateRpcField('basegoerli', REACT_APP_BASE_GOERLI_RPC),
  ...populateRpcField('osmosis', REACT_APP_OSMOSIS_TESTNET_RPC),
  ...populateRpcField('wormchain', REACT_APP_WORMCHAIN_TESTNET_RPC),
  ...populateRpcField(
    'arbitrumgoerli',
    process.env.REACT_APP_ARBITRUM_GOERLI_RPC,
  ),
  ...populateRpcField(
    'optimismgoerli',
    process.env.REACT_APP_OPTIMISM_GOERLI_RPC,
  ),
  ...populateRpcField('cosmoshub', REACT_APP_COSMOSHUB_TESTNET_RPC),
  ...populateRpcField('evmos', REACT_APP_EVMOS_TESTNET_RPC),
};

export const TESTNET_REST_MAPPING = {
  ...populateRpcField('sei', REACT_APP_SEI_REST),
};

export const TESTNET_GRAPHQL_MAPPING = {
  ...populateRpcField('aptos', process.env.REACT_APP_APTOS_TESTNET_GRAPHQL),
};
