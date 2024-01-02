import { populateRpcField } from '../utils';

export const MAINNET_RPC_MAPPING = {
  ...populateRpcField('ethereum', process.env.REACT_APP_ETHEREUM_RPC),
  ...populateRpcField('solana', process.env.REACT_APP_SOLANA_RPC),
  ...populateRpcField('polygon', process.env.REACT_APP_POLYGON_RPC),
  ...populateRpcField('bsc', process.env.REACT_APP_BSC_RPC),
  ...populateRpcField('avalanche', process.env.REACT_APP_AVALANCHE_RPC),
  ...populateRpcField('fantom', process.env.REACT_APP_FANTOM_RPC),
  ...populateRpcField('celo', process.env.REACT_APP_CELO_RPC),
  ...populateRpcField('moonbeam', process.env.REACT_APP_MOONBEAM_RPC),
  ...populateRpcField('sui', process.env.REACT_APP_SUI_RPC),
  ...populateRpcField('aptos', process.env.REACT_APP_APTOS_RPC),
  ...populateRpcField('sei', process.env.REACT_APP_SEI_RPC),
  ...populateRpcField('base', process.env.REACT_APP_BASE_RPC),
  ...populateRpcField('osmosis', process.env.REACT_APP_OSMOSIS_RPC),
  ...populateRpcField('wormchain', process.env.REACT_APP_WORMCHAIN_RPC),
  ...populateRpcField('arbitrum', process.env.REACT_APP_ARBITRUM_RPC),
  ...populateRpcField('optimism', process.env.REACT_APP_OPTIMISM_RPC),
  ...populateRpcField('evmos', process.env.REACT_APP_EVMOS_RPC),
  ...populateRpcField('kujira', process.env.REACT_APP_KUJIRA_RPC),
};

export const MAINNET_REST_MAPPING = {
  ...populateRpcField('sei', process.env.REACT_APP_SEI_REST),
  ...populateRpcField('evmos', process.env.REACT_APP_EVMOS_REST),
};

export const MAINNET_GRAPHQL_MAPPING = {
  ...populateRpcField('aptos', process.env.REACT_APP_APTOS_GRAPHQL),
};
