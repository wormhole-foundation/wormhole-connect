import { populateRpcField } from '../utils';

export const TESTNET_RPC_MAPPING = {
  ...populateRpcField('goerli', process.env.REACT_APP_GOERLI_RPC),
  ...populateRpcField('mumbai', process.env.REACT_APP_MUMBAI_RPC),
  ...populateRpcField('bsc', process.env.REACT_APP_BSC_TESTNET_RPC),
  ...populateRpcField('fuji', process.env.REACT_APP_FUJI_RPC),
  ...populateRpcField('fantom', process.env.REACT_APP_FANTOM_TESTNET_RPC),
  ...populateRpcField('alfajores', process.env.REACT_APP_ALFAJORES_RPC),
  ...populateRpcField('solana', process.env.REACT_APP_SOLANA_DEVNET_RPC),
  ...populateRpcField('moonbasealpha', process.env.REACT_APP_MOONBASE_RPC),
  ...populateRpcField('sui', process.env.REACT_APP_SUI_TESTNET_RPC),
  ...populateRpcField('aptos', process.env.REACT_APP_APTOS_TESTNET_RPC),
  ...populateRpcField('sei', process.env.REACT_APP_SEI_TESTNET_RPC),
  ...populateRpcField('basegoerli', process.env.REACT_APP_BASE_GOERLI_RPC),
  ...populateRpcField('osmosis', process.env.REACT_APP_OSMOSIS_TESTNET_RPC),
  ...populateRpcField('wormchain', process.env.REACT_APP_WORMCHAIN_TESTNET_RPC),
  ...populateRpcField(
    'arbitrumgoerli',
    process.env.REACT_APP_ARBITRUM_GOERLI_RPC,
  ),
  ...populateRpcField(
    'optimismgoerli',
    process.env.REACT_APP_OPTIMISM_GOERLI_RPC,
  ),
  ...populateRpcField('cosmoshub', process.env.REACT_APP_COSMOSHUB_TESTNET_RPC),
  ...populateRpcField('evmos', process.env.REACT_APP_EVMOS_TESTNET_RPC),
  ...populateRpcField('kujira', process.env.REACT_APP_KUJIRA_TESTNET_RPC),
};

export const TESTNET_REST_MAPPING = {
  ...populateRpcField('sei', process.env.REACT_APP_SEI_REST),
  ...populateRpcField('evmos', process.env.REACT_APP_EVMOS_REST),
};

export const TESTNET_GRAPHQL_MAPPING = {
  ...populateRpcField('aptos', process.env.REACT_APP_APTOS_TESTNET_GRAPHQL),
};
