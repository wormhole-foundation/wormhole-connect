import { populateRpcField } from '../utils';
const {
  REACT_APP_ETHEREUM_RPC,
  REACT_APP_SOLANA_RPC,
  REACT_APP_POLYGON_RPC,
  REACT_APP_BSC_RPC,
  REACT_APP_AVALANCHE_RPC,
  REACT_APP_FANTOM_RPC,
  REACT_APP_CELO_RPC,
  REACT_APP_MOONBEAM_RPC,
  REACT_APP_SUI_RPC,
  REACT_APP_APTOS_RPC,
  REACT_APP_SEI_RPC,
  REACT_APP_BASE_RPC,
  REACT_APP_OSMOSIS_RPC,
  REACT_APP_WORMCHAIN_RPC,
  REACT_APP_EVMOS_RPC,
  REACT_APP_KUJIRA_RPC,
  REACT_APP_KLAYTN_RPC,
  REACT_APP_SEI_REST,
  REACT_APP_EVMOS_REST,
  REACT_APP_ARBITRUM_RPC,
  REACT_APP_OPTIMISM_RPC,
  REACT_APP_APTOS_GRAPHQL,
} = import.meta.env;

export const MAINNET_RPC_MAPPING = {
  ...populateRpcField('ethereum', REACT_APP_ETHEREUM_RPC),
  ...populateRpcField('solana', REACT_APP_SOLANA_RPC),
  ...populateRpcField('polygon', REACT_APP_POLYGON_RPC),
  ...populateRpcField('bsc', REACT_APP_BSC_RPC),
  ...populateRpcField('avalanche', REACT_APP_AVALANCHE_RPC),
  ...populateRpcField('fantom', REACT_APP_FANTOM_RPC),
  ...populateRpcField('celo', REACT_APP_CELO_RPC),
  ...populateRpcField('moonbeam', REACT_APP_MOONBEAM_RPC),
  ...populateRpcField('sui', REACT_APP_SUI_RPC),
  ...populateRpcField('aptos', REACT_APP_APTOS_RPC),
  ...populateRpcField('sei', REACT_APP_SEI_RPC),
  ...populateRpcField('base', REACT_APP_BASE_RPC),
  ...populateRpcField('osmosis', REACT_APP_OSMOSIS_RPC),
  ...populateRpcField('wormchain', REACT_APP_WORMCHAIN_RPC),
  ...populateRpcField('arbitrum', REACT_APP_ARBITRUM_RPC),
  ...populateRpcField('optimism', REACT_APP_OPTIMISM_RPC),
  ...populateRpcField('evmos', REACT_APP_EVMOS_RPC),
  ...populateRpcField('kujira', REACT_APP_KUJIRA_RPC),
  ...populateRpcField('klaytn', REACT_APP_KLAYTN_RPC),
};

export const MAINNET_REST_MAPPING = {
  ...populateRpcField('sei', REACT_APP_SEI_REST),
  ...populateRpcField('evmos', REACT_APP_EVMOS_REST),
};

export const MAINNET_GRAPHQL_MAPPING = {
  ...populateRpcField('aptos', REACT_APP_APTOS_GRAPHQL),
};
