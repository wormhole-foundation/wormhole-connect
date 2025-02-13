import { populateRpcField } from '../utils';
const { REACT_APP_ETHEREUM_DEVNET_RPC } = import.meta.env;

export const DEVNET_RPC_MAPPING = {
  ...populateRpcField('Ethereum', REACT_APP_ETHEREUM_DEVNET_RPC),
};
