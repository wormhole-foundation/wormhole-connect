import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { TOKENS } from '.';
import { BridgeDefaults } from './types';
import { config, NETWORK_DATA, CHAINS, ROUTES } from '.';

const error = (msg: string) => {
  console.error(`Wormhole Connect:\n${msg}`);
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
  const networks = Object.keys(CHAINS) as ChainName[];
  for (let network of networks) {
    if (resourceMap[network] === defaultResourceMap[network]) {
      error(
        `WARNING! No custom ${field} provided for ${network}. It is strongly recommended that you provide your own ${field} for the best performance and functionality`,
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
  const { fromNetwork, toNetwork, token, requiredNetwork } = defaults;
  if (fromNetwork) {
    const network = CHAINS[fromNetwork];
    if (!network) {
      error(
        `Invalid chain name "${fromNetwork}" specified for bridgeDefaults.fromNetwork`,
      );
    }
  }
  if (toNetwork) {
    const network = CHAINS[toNetwork];
    if (!network) {
      error(
        `Invalid chain name "${toNetwork}" specified for bridgeDefaults.toNetwork`,
      );
    }
  }
  if (toNetwork && fromNetwork) {
    if (toNetwork === fromNetwork) {
      error(
        `Source and destination chain cannot be the same, check the bridgeDefaults configuration`,
      );
    }
  }
  if (toNetwork && fromNetwork && requiredNetwork) {
    const requiredConfig = CHAINS[requiredNetwork];
    if (!requiredConfig) {
      error(
        `Invalid network value "${requiredNetwork}" specified for bridgeDefaults.requiredNetwork`,
      );
    }
    if (toNetwork !== requiredNetwork && fromNetwork !== requiredNetwork) {
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
  if (fromNetwork && token) {
    const network = CHAINS[fromNetwork]!;
    const { tokenId, nativeNetwork } = TOKENS[token]!;
    if (!tokenId && nativeNetwork !== network.key) {
      error(
        `Invalid token "${token}" specified for bridgeDefaults.token. It does not exist on "${fromNetwork}"`,
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
