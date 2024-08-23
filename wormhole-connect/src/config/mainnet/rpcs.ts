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
  REACT_APP_INJECTIVE_RPC,
  REACT_APP_WORMCHAIN_RPC,
  REACT_APP_EVMOS_RPC,
  REACT_APP_KUJIRA_RPC,
  REACT_APP_KLAYTN_RPC,
  REACT_APP_SEI_REST,
  REACT_APP_EVMOS_REST,
  REACT_APP_ARBITRUM_RPC,
  REACT_APP_OPTIMISM_RPC,
  REACT_APP_APTOS_GRAPHQL,
  REACT_APP_SCROLL_RPC,
  REACT_APP_BLAST_RPC,
  REACT_APP_XLAYER_RPC,
} = import.meta.env;

export const MAINNET_RPC_MAPPING = {
  ...populateRpcField('Ethereum', REACT_APP_ETHEREUM_RPC),
  ...populateRpcField('Solana', REACT_APP_SOLANA_RPC),
  ...populateRpcField('Polygon', REACT_APP_POLYGON_RPC),
  ...populateRpcField('Bsc', REACT_APP_BSC_RPC),
  ...populateRpcField('Avalanche', REACT_APP_AVALANCHE_RPC),
  ...populateRpcField('Fantom', REACT_APP_FANTOM_RPC),
  ...populateRpcField('Celo', REACT_APP_CELO_RPC),
  ...populateRpcField('Moonbeam', REACT_APP_MOONBEAM_RPC),
  ...populateRpcField('Sui', REACT_APP_SUI_RPC),
  ...populateRpcField('Aptos', REACT_APP_APTOS_RPC),
  ...populateRpcField('Sei', REACT_APP_SEI_RPC),
  ...populateRpcField('Base', REACT_APP_BASE_RPC),
  ...populateRpcField('Osmosis', REACT_APP_OSMOSIS_RPC),
  ...populateRpcField('Wormchain', REACT_APP_WORMCHAIN_RPC),
  ...populateRpcField('Arbitrum', REACT_APP_ARBITRUM_RPC),
  ...populateRpcField('Optimism', REACT_APP_OPTIMISM_RPC),
  ...populateRpcField('Evmos', REACT_APP_EVMOS_RPC),
  ...populateRpcField('Kujira', REACT_APP_KUJIRA_RPC),
  ...populateRpcField('Injective', REACT_APP_INJECTIVE_RPC),
  ...populateRpcField('Klaytn', REACT_APP_KLAYTN_RPC),
  ...populateRpcField('Scroll', REACT_APP_SCROLL_RPC),
  ...populateRpcField('Blast', REACT_APP_BLAST_RPC),
  ...populateRpcField('Xlayer', REACT_APP_XLAYER_RPC),
};

export const MAINNET_REST_MAPPING = {
  ...populateRpcField('Sei', REACT_APP_SEI_REST),
  ...populateRpcField('Evmos', REACT_APP_EVMOS_REST),
};

export const MAINNET_GRAPHQL_MAPPING = {
  ...populateRpcField('Aptos', REACT_APP_APTOS_GRAPHQL),
};
