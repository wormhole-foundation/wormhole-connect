import { Chain, TokenId } from '@wormhole-foundation/sdk';
import config from 'config';
import { Token, addressString } from 'config/tokens';

export const nttRoutes = [
  'ManualNtt',
  'AutomaticNtt',
  'M0AutomaticRoute',
  'NttExecutorRoute',
] as const;

interface NttTokenOption {
  chain: Chain;
  token: string;
}

type NttTokensConfig = Record<string, NttTokenOption[]>;

export const getNttTokens = (
  routeName: string,
): NttTokensConfig | undefined => {
  const route = config.routes.get(routeName);
  if (!route) return undefined;

  const routeConfig = (route.rc as any).config;
  if (!routeConfig) return undefined;

  // NttExecutorRoute has a different structure
  if (routeName === 'NttExecutorRoute') {
    return routeConfig.ntt?.tokens;
  }

  return routeConfig.tokens;
};

export const isNttToken = (tokenId: TokenId): boolean => {
  const tokenAddress = addressString(tokenId);

  for (const routeName of nttRoutes) {
    const nttTokens = getNttTokens(routeName);
    if (!nttTokens) continue;

    for (const tokenKey in nttTokens) {
      const options = nttTokens[tokenKey];
      if (!options) continue;

      const hasToken = options.some(
        (opt) => opt.chain === tokenId.chain && opt.token === tokenAddress,
      );

      if (hasToken) return true;
    }
  }

  return false;
};

export const getNttTokenGroup = (tokenId: TokenId): Token[] => {
  const alternativeTokens: Token[] = [];
  const tokenAddress = addressString(tokenId);

  for (const routeName of nttRoutes) {
    const nttTokens = getNttTokens(routeName);
    if (!nttTokens) continue;

    for (const tokenKey in nttTokens) {
      const options = nttTokens[tokenKey];
      if (!options) continue;

      const isInGroup = options.some(
        (opt) => opt.chain === tokenId.chain && opt.token === tokenAddress,
      );

      if (isInGroup) {
        // Add all tokens from this group (except the original)
        for (const opt of options) {
          if (opt.chain !== tokenId.chain || opt.token !== tokenAddress) {
            const token = config.tokens.get(opt.chain, opt.token);
            if (token) {
              alternativeTokens.push(token);
            }
          }
        }
        // We found the group, no need to check other routes
        return alternativeTokens;
      }
    }
  }

  return alternativeTokens;
};
