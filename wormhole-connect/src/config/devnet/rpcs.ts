import { populateRpcField } from '../utils';
const {
  REACT_APP_ETHEREUM_DEVNET_RPC,
  REACT_APP_OSMOSIS_DEVNET_RPC,
  REACT_APP_WORMCHAIN_DEVNET_RPC,
  REACT_APP_TERRA2_DEVNET_RPC,
  REACT_APP_SEI_REST,
  REACT_APP_APTOS_DEVNET_REST,
} = import.meta.env;

export const DEVNET_RPC_MAPPING = {
  ...populateRpcField('Ethereum', REACT_APP_ETHEREUM_DEVNET_RPC),
  ...populateRpcField('Osmosis', REACT_APP_OSMOSIS_DEVNET_RPC),
  ...populateRpcField('Wormchain', REACT_APP_WORMCHAIN_DEVNET_RPC),
  ...populateRpcField('Terra2', REACT_APP_TERRA2_DEVNET_RPC),
};

export const DEVNET_REST_MAPPING = {
  ...populateRpcField('Sei', REACT_APP_SEI_REST),
};

export const DEVNET_GRAPHQL_MAPPING = {
  ...populateRpcField('Aptos', REACT_APP_APTOS_DEVNET_REST),
};
