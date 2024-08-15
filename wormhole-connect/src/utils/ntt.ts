import { NttRoute } from '@wormhole-foundation/sdk-route-ntt';
import { Chain } from '@wormhole-foundation/sdk';
import config from 'config';
import { TokenConfig } from 'config/types';

export const getNttConfigKey = (
  token1: TokenConfig,
  token2: TokenConfig,
): string | undefined => {
  if (!token1 || !token2) return;
  const [key] =
    Object.entries(config.nttConfig.tokens).find(
      ([, cfg]) =>
        cfg.some(
          ({ token, chain }) =>
            token === token1.tokenId?.address && chain === token1.nativeChain,
        ) &&
        cfg.some(
          ({ token, chain }) =>
            token === token2.tokenId?.address && chain === token2.nativeChain,
        ),
    ) || [];
  return key;
};

export const getNttConfig = (
  key: string,
  chain: Chain,
): NttRoute.TokenConfig | undefined => {
  return config.nttConfig.tokens[key]?.find((cfg) => cfg.chain === chain);
};

export const getNttToken = (
  key: string,
  chain: Chain,
): TokenConfig | undefined => {
  const cfg = getNttConfig(key, chain);
  if (!cfg) return;
  return Object.values(config.tokens).find(
    (tk) => tk.nativeChain === chain && tk.tokenId?.address === cfg.token,
  );
};
