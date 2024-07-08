import { populateRpcField } from '../utils';
const {
  REACT_APP_SEPOLIA_RPC,
  REACT_APP_BSC_TESTNET_RPC,
  REACT_APP_FUJI_RPC,
  REACT_APP_FANTOM_TESTNET_RPC,
  REACT_APP_ALFAJORES_RPC,
  REACT_APP_SOLANA_DEVNET_RPC,
  REACT_APP_MOONBASE_RPC,
  REACT_APP_SUI_TESTNET_RPC,
  REACT_APP_APTOS_TESTNET_RPC,
  REACT_APP_SEI_TESTNET_RPC,
  REACT_APP_BASE_SEPOLIA_RPC,
  REACT_APP_OSMOSIS_TESTNET_RPC,
  REACT_APP_INJECTIVE_TESTNET_RPC,
  REACT_APP_WORMCHAIN_TESTNET_RPC,
  REACT_APP_EVMOS_TESTNET_RPC,
  REACT_APP_COSMOSHUB_TESTNET_RPC,
  REACT_APP_KUJIRA_TESTNET_RPC,
  REACT_APP_KLAYTN_TESTNET_RPC,
  REACT_APP_SEI_REST,
  REACT_APP_EVMOS_REST,
  REACT_APP_ARBITRUM_SEPOLIA_RPC,
  REACT_APP_OPTIMISM_SEPOLIA_RPC,
  REACT_APP_APTOS_TESTNET_GRAPHQL,
  REACT_APP_SCROLL_TESTNET_RPC,
  REACT_APP_BLAST_TESTNET_RPC,
  REACT_APP_XLAYER_TESTNET_RPC,
} = import.meta.env;

export const TESTNET_RPC_MAPPING = {
  ...populateRpcField('sepolia', REACT_APP_SEPOLIA_RPC),
  ...populateRpcField('bsc', REACT_APP_BSC_TESTNET_RPC),
  ...populateRpcField('fuji', REACT_APP_FUJI_RPC),
  ...populateRpcField('fantom', REACT_APP_FANTOM_TESTNET_RPC),
  ...populateRpcField('alfajores', REACT_APP_ALFAJORES_RPC),
  ...populateRpcField('solana', REACT_APP_SOLANA_DEVNET_RPC),
  ...populateRpcField('moonbasealpha', REACT_APP_MOONBASE_RPC),
  ...populateRpcField('sui', REACT_APP_SUI_TESTNET_RPC),
  ...populateRpcField('aptos', REACT_APP_APTOS_TESTNET_RPC),
  ...populateRpcField('sei', REACT_APP_SEI_TESTNET_RPC),
  ...populateRpcField('base_sepolia', REACT_APP_BASE_SEPOLIA_RPC),
  ...populateRpcField('osmosis', REACT_APP_OSMOSIS_TESTNET_RPC),
  ...populateRpcField('wormchain', REACT_APP_WORMCHAIN_TESTNET_RPC),
  ...populateRpcField('arbitrum_sepolia', REACT_APP_ARBITRUM_SEPOLIA_RPC),
  ...populateRpcField('optimism_sepolia', REACT_APP_OPTIMISM_SEPOLIA_RPC),
  ...populateRpcField('cosmoshub', REACT_APP_COSMOSHUB_TESTNET_RPC),
  ...populateRpcField('evmos', REACT_APP_EVMOS_TESTNET_RPC),
  ...populateRpcField('kujira', REACT_APP_KUJIRA_TESTNET_RPC),
  ...populateRpcField('injective', REACT_APP_INJECTIVE_TESTNET_RPC),
  ...populateRpcField('klaytn', REACT_APP_KLAYTN_TESTNET_RPC),
  ...populateRpcField('scroll', REACT_APP_SCROLL_TESTNET_RPC),
  ...populateRpcField('blast', REACT_APP_BLAST_TESTNET_RPC),
  ...populateRpcField('xlayer', REACT_APP_XLAYER_TESTNET_RPC),
};

export const TESTNET_REST_MAPPING = {
  ...populateRpcField('sei', REACT_APP_SEI_REST),
  ...populateRpcField('evmos', REACT_APP_EVMOS_REST),
};

export const TESTNET_GRAPHQL_MAPPING = {
  ...populateRpcField('aptos', REACT_APP_APTOS_TESTNET_GRAPHQL),
};
