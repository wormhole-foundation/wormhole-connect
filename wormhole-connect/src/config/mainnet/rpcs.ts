import { populateRpcField } from 'config/utils';
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
  REACT_APP_SEI_REST,
} = process.env;

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
  ...populateRpcField('arbitrum', process.env.REACT_APP_ARBITRUM_RPC),
  ...populateRpcField('optimism', process.env.REACT_APP_OPTIMISM_RPC),
};

export const MAINNET_REST_MAPPING = {
  ...populateRpcField('sei', REACT_APP_SEI_REST),
};
