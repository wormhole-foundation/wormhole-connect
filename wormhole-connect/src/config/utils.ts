import config from '.';
import { BridgeDefaults, TokensConfig } from './types';

const error = (msg: string) => {
  console.error(`Wormhole Connect: ${msg}`);
};

export const populateRpcField = (
  chainName: string,
  rpc: string | undefined,
) => {
  if (!rpc) return {};
  return { [chainName]: rpc };
};

/*
const info = (msg: string) => {
  console.info(`Wormhole Connect: ${msg}`);
};

export const validateResourceMap = (map: ChainResourceMap) => {
  if (!config || !config[field]) {
    info(
      `No custom ${field} endpoints provided. We recommended that you configure your own ${field} endpoints for the best performance.`,
    );
    return;
  }
  const defaultResourceMap = config.networkData[field];
  const resourceMap = config[field]!;
  const chains = Object.keys(config.chains) as ChainName[];
  for (const chain of chains) {
    if (resourceMap[chain] === defaultResourceMap[chain]) {
      info(
        `No custom ${field} endpoint provided for ${chain}. We recommended that you provide your own ${field} endpoint for the best performance.`,
      );
    }
  }
};
*/

/*
export const validateChainResources = () => {
  validateResourceMap('rpcs');
  validateResourceMap('rest');
};
*/

export const mergeCustomTokensConfig = (
  builtin: TokensConfig,
  custom?: TokensConfig,
): TokensConfig => {
  if (!custom) return builtin;

  const builtinTokens = Object.values(builtin);
  const builtinSymbols = builtinTokens.map((tk) => tk.symbol);
  const builtinKeys = builtinTokens.map((tk) => tk.key);

  for (const key in custom) {
    // Verify that custom token config does not conflict with any built-in tokens
    const customToken = custom[key];
    if (key in builtin) {
      console.warn(
        `Skipping custom token config for "${key}" because it conflicts with a built-in`,
      );
      continue;
    }
    if (builtinSymbols.includes(customToken.symbol)) {
      console.warn(
        `Skipping custom token config for "${key}" because its symbol "${customToken.symbol}" conflicts with a built-in`,
      );
      continue;
    }
    if (builtinKeys.includes(customToken.key)) {
      console.warn(
        `Skipping custom token config for "${key}" because its key "${customToken.key}" conflicts with a built-in`,
      );
      continue;
    }

    // Accept custom token config
    console.info(`Accepted custom token config for "${key}"`);
    builtin[key] = customToken;
  }

  return builtin;
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
    const chain = config.chains[fromChain];
    if (!chain) {
      error(
        `Invalid chain name "${fromChain}" specified for bridgeDefaults.fromNetwork`,
      );
    }
  }
  if (toChain) {
    const chain = config.chains[toChain];
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
    const requiredConfig = config.chains[requiredNetwork];
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
    const tokenConfig = config.tokens[token];
    if (!tokenConfig) {
      error(`Invalid token "${token}" specified for bridgeDefaults.token`);
    }
  }
  if (fromChain && token) {
    const chain = config.chains[fromChain]!;
    const { tokenId, nativeChain } = config.tokens[token]!;
    if (!tokenId && nativeChain !== chain.key) {
      error(
        `Invalid token "${token}" specified for bridgeDefaults.token. It does not exist on "${fromChain}"`,
      );
    }
  }
  return defaults;
};

/*
export const validateRoutes = () => {
  if (config.routes.length === 0) {
    error('You must enable at least 1 transfer route');
  }
};

export const validateConfigs = () => {
  validateRoutes();
  validateChainResources();
};
*/
