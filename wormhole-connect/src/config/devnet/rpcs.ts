import { populateRpcField } from '../utils';

export const DEVNET_RPC_MAPPING = {
  ...populateRpcField('ethereum', process.env.REACT_APP_ETHEREUM_DEVNET_RPC),
  ...populateRpcField('osmosis', process.env.REACT_APP_OSMOSIS_DEVNET_RPC),
  ...populateRpcField('wormchain', process.env.REACT_APP_WORMCHAIN_DEVNET_RPC),
  ...populateRpcField('terra2', process.env.REACT_APP_TERRA2_DEVNET_RPC),
};

export const DEVNET_REST_MAPPING = {
  ...populateRpcField('sei', process.env.REACT_APP_SEI_REST),
};

export const DEVNET_GRAPHQL_MAPPING = {
  ...populateRpcField('aptos', process.env.REACT_APP_APTOS_DEVNET_REST),
};
