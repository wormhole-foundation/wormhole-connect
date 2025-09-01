import type { ChainsConfig, WrappedTokenAddresses } from './types';
import type { TokenCache } from './tokens';
import type { Chain } from '@wormhole-foundation/sdk';
import type { NttRoute } from '@wormhole-foundation/sdk-route-ntt';
import type { DefaultInputs } from './ui';

const error = (msg: string) => {
  console.error(`Wormhole Connect: ${msg}`);
};

export const populateRpcField = (chain: Chain, rpc: string | undefined) => {
  if (!rpc) return {};
  return { [chain]: rpc };
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

export const mergeCustomWrappedTokens = (
  builtin: WrappedTokenAddresses,
  custom?: WrappedTokenAddresses,
): WrappedTokenAddresses => {
  if (!custom) return builtin;

  for (const chain in custom) {
    for (const addr in custom[chain]) {
      // Prevent error when chain is not defined in built-in config
      if (!builtin[chain]) builtin[chain] = {};
      builtin[chain][addr] = {
        ...custom[chain][addr],
        // Prevent overwriting built-in wrapped token addresses
        ...builtin[chain][addr],
      };
    }
  }

  return builtin;
};

export const mergeNttConfig = (
  tokens: TokenCache,
  builtin: NttRoute.Config,
  custom?: NttRoute.Config,
) => {
  if (!custom) return builtin;

  for (const key in custom.tokens) {
    if (key in builtin.tokens) {
      console.warn(
        `Skipping custom NTT config for "${key}" because it conflicts with a built-in`,
      );
      continue;
    }

    const tokenConfig = custom.tokens[key];
    // if any of the managers in the custom config exist in the built-in config, skip
    if (
      tokenConfig.some(({ chain, manager }) =>
        Object.values(builtin.tokens).some((builtinConfig) =>
          builtinConfig.some(
            (cfg) => chain === cfg.chain && manager === cfg.manager,
          ),
        ),
      )
    ) {
      console.warn(
        `Skipping custom NTT config for "${key}" because it conflicts with a built-in`,
      );
      continue;
    }

    // if any of the tokens in the custom config don't exist in the tokens config, skip
    if (
      !tokenConfig.every(({ chain, token }) =>
        Object.values(tokens).some(
          (tk) => tk.chain === chain && tk.tokenId?.address === token,
        ),
      )
    ) {
      console.warn(
        `Skipping custom NTT config for "${key}" because it references a token that does not exist`,
      );
      continue;
    }

    // if any of the chains in the custom config are duplicated, skip
    if (
      new Set(tokenConfig.map((cfg) => cfg.chain)).size !== tokenConfig.length
    ) {
      console.warn(
        `Skipping custom NTT config for "${key}" because it contains duplicate chains`,
      );
      continue;
    }

    console.info(`Accepted custom NTT config for "${key}"`);
    builtin.tokens[key] = tokenConfig;
  }

  return builtin;
};

export const validateDefaults = (
  defaults: DefaultInputs,
  chains: ChainsConfig,
  tokens: TokenCache,
) => {
  if (!defaults) return;
  if (defaults.from?.chain) {
    const chain = chains[defaults.from.chain];
    if (!chain) {
      error(
        `Invalid chain name "${defaults.from.chain}" specified for defaultInputs.fromChain`,
      );
      delete defaults.from;
    }
  }
  if (defaults.to?.chain) {
    const chain = chains[defaults.to.chain];
    if (!chain) {
      error(
        `Invalid chain name "${defaults.to.chain}" specified for defaultInputs.toChain`,
      );
      delete defaults.to;
    }
  }
  if (defaults.from?.chain && defaults.to?.chain) {
    if (defaults.from.chain === defaults.to.chain) {
      error(
        `Source and destination chain cannot be the same, check the defaultInputs configuration`,
      );
    }
  }

  if (defaults.from?.chain && defaults.to?.chain && defaults.requiredChain) {
    const requiredConfig = chains[defaults.requiredChain];
    if (!requiredConfig) {
      error(
        `Invalid network value "${defaults.requiredChain}" specified for defaultInputs.requiredChain`,
      );
    }
    if (
      defaults.to.chain !== defaults.requiredChain &&
      defaults.from.chain !== defaults.requiredChain
    ) {
      error(
        `Source chain or destination chain must equal the required network`,
      );
    }
  }

  if (defaults.from?.chain && defaults.from?.token) {
    const token = tokens.findByAddressOrSymbol(
      defaults.from.chain,
      defaults.from.token,
    );
    if (!token) {
      error(
        `Invalid token "${defaults.from?.token}" specified for defaultInputs.fromToken`,
      );
      delete defaults.from.token;
    }
  }

  if (defaults.to?.chain && defaults.to?.token) {
    const token = tokens.findByAddressOrSymbol(
      defaults.to.chain,
      defaults.to.token,
    );
    if (!token) {
      error(
        `Invalid token "${defaults.to?.token}" specified for defaultInputs.toToken`,
      );
      delete defaults.to.token;
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

export const capitalize = (str: string): string => {
  return str[0].toUpperCase() + str.slice(1);
};
