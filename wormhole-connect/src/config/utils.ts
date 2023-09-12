import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { TOKENS } from '.';
import { BridgeDefaults } from './types';
import { config, NETWORK_DATA, CHAINS, ROUTES } from '.';

const error = (msg: string) => {
  console.error(`Wormhole Connect:\n${msg}`);
};

export const populateRpcField = (
  chainName: string,
  rpc: string | undefined,
) => {
  if (!rpc) return {};
  return { [chainName]: rpc };
};

export const validateResourceMap = (field: 'rpcs' | 'rest') => {
  if (!config || !config[field]) {
    error(
      `WARNING! No custom ${field} provided. It is strongly recommended that you provide your own ${field} for the best performance and functionality`,
    );
    return;
  }
  const defaultResourceMap = NETWORK_DATA[field];
  const resourceMap = config[field]!;
  const chains = Object.keys(CHAINS) as ChainName[];
  for (let chain of chains) {
    if (resourceMap[chain] === defaultResourceMap[chain]) {
      error(
        `WARNING! No custom ${field} provided for ${chain}. It is strongly recommended that you provide your own ${field} for the best performance and functionality`,
      );
    }
  }
};

export const validateChainResources = () => {
  validateResourceMap('rpcs');
  validateResourceMap('rest');
};

export const validateDefaults = (defaults: BridgeDefaults | undefined) => {
  if (!defaults) return;
  const {
    fromNetwork: fromChain,
    toNetwork: toChain,
    token,
    requiredNetwork,
  } = defaults;
  if (fromChain) {
    const chain = CHAINS[fromChain];
    if (!chain) {
      error(
        `Invalid chain name "${fromChain}" specified for bridgeDefaults.fromNetwork`,
      );
    }
  }
  if (toChain) {
    const chain = CHAINS[toChain];
    if (!chain) {
      error(
        `Invalid chain name "${toChain}" specified for bridgeDefaults.toNetwork`,
      );
    }
  }
  if (toChain && fromChain) {
    if (toChain === fromChain) {
      error(
        `Source and destination chain cannot be the same, check the bridgeDefaults configuration`,
      );
    }
  }
  if (toChain && fromChain && requiredNetwork) {
    const requiredConfig = CHAINS[requiredNetwork];
    if (!requiredConfig) {
      error(
        `Invalid network value "${requiredNetwork}" specified for bridgeDefaults.requiredNetwork`,
      );
    }
    if (toChain !== requiredNetwork && fromChain !== requiredNetwork) {
      error(
        `Source chain or destination chain must equal the required network`,
      );
    }
  }
  if (token) {
    const tokenConfig = TOKENS[token];
    if (!tokenConfig) {
      error(`Invalid token "${token}" specified for bridgeDefaults.token`);
    }
  }
  if (fromChain && token) {
    const chain = CHAINS[fromChain]!;
    const { tokenId, nativeChain } = TOKENS[token]!;
    if (!tokenId && nativeChain !== chain.key) {
      error(
        `Invalid token "${token}" specified for bridgeDefaults.token. It does not exist on "${fromChain}"`,
      );
    }
  }
  return defaults;
};

export const validateRoutes = () => {
  if (ROUTES.length === 0) {
    error('You must enable at least 1 transfer route');
  }
};

export const validateConfigs = () => {
  validateRoutes();
  validateChainResources();
};
