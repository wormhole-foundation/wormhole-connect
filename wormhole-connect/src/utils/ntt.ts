import { NttRoute } from '@wormhole-foundation/sdk-route-ntt';
import config from 'config';
import { NttManagerConfig, TokenConfig } from 'config/types';
import { ChainName } from 'sdklegacy';
import { isEqualCaseInsensitive } from 'utils';

export const isNttToken = (token: TokenConfig): boolean => {
  if (!token) return false;
  return Object.values(config.nttGroups).some((group) =>
    group.nttManagers.some(
      (manager) =>
        manager.tokenKey === token.key &&
        manager.chainName === token.nativeChain,
    ),
  );
};

export const isNttTokenPair = (
  token1: TokenConfig,
  token2: TokenConfig,
): boolean => {
  if (!token1 || !token2) return false;
  // Find the groups that token1 belongs to
  const token1Groups = Object.values(config.nttGroups).filter((group) =>
    group.nttManagers.some(
      (manager) =>
        manager.tokenKey === token1.key &&
        manager.chainName === token1.nativeChain,
    ),
  );
  // then check if token2 belongs to any of those groups
  return token1Groups.some((group) =>
    group.nttManagers.some(
      (manager) =>
        manager.tokenKey === token2.key &&
        manager.chainName === token2.nativeChain,
    ),
  );
};

export const getNttManagerConfig = (
  token: TokenConfig,
  groupKey: string,
): NttManagerConfig | undefined => {
  if (!token) return;
  const group = config.nttGroups[groupKey];
  if (!group) return;
  return group.nttManagers.find(
    (manager) =>
      manager.tokenKey === token.key && manager.chainName === token.nativeChain,
  );
};

export const getNttManagerAddress = (
  token: TokenConfig,
  groupKey: string,
): string | undefined => {
  return getNttManagerConfig(token, groupKey)?.address;
};

export const getNttGroupKey = (
  token1: TokenConfig,
  token2: TokenConfig,
): string | undefined => {
  if (!token1 || !token2) return;
  const [key] =
    Object.entries(config.nttGroups).find(
      ([, group]) =>
        group.nttManagers.some(
          (manager) =>
            manager.tokenKey === token1.key &&
            manager.chainName === token1.nativeChain,
        ) &&
        group.nttManagers.some(
          (manager) =>
            manager.tokenKey === token2.key &&
            manager.chainName === token2.nativeChain,
        ),
    ) || [];
  return key;
};

export const getNttGroupKeyByAddress = (
  managerAddress: string,
  chainName: ChainName,
): string | undefined => {
  return Object.entries(config.nttGroups).find(([, group]) =>
    group.nttManagers.some(
      (manager) =>
        isEqualCaseInsensitive(manager.address, managerAddress) &&
        manager.chainName === chainName,
    ),
  )?.[0];
};

export const getNttManagerConfigByAddress = (
  managerAddress: string,
  chainName: ChainName,
): NttManagerConfig | undefined => {
  return Object.values(config.nttGroups).flatMap((group) =>
    group.nttManagers.filter(
      (manager) =>
        isEqualCaseInsensitive(manager.address, managerAddress) &&
        manager.chainName === chainName,
    ),
  )?.[0];
};

export const getNttManagerConfigByGroupKey = (
  groupKey: string,
  chainName: ChainName,
): NttManagerConfig | undefined => {
  return config.nttGroups[groupKey]?.nttManagers.find(
    (manager) => manager.chainName === chainName,
  );
};

export const getNttTokenByGroupKey = (
  groupKey: string,
  chainName: ChainName,
): TokenConfig | undefined => {
  const manager = getNttManagerConfigByGroupKey(groupKey, chainName);
  if (!manager) return;
  return config.tokens[manager.tokenKey];
};

// Get the NTT config for the SDK routes
export function getNttConfig(): NttRoute.Config {
  const result: NttRoute.Config = { tokens: {} };

  Object.entries(config.nttGroups).forEach(([name, group]) => {
    const tokens: NttRoute.TokenConfig[] = group.nttManagers
      .map((manager) => {
        const tokenAddress = config.tokens[manager.tokenKey]?.tokenId?.address;
        return tokenAddress
          ? {
              chain: config.sdkConverter.toChainV2(manager.chainName),
              token: tokenAddress,
              manager: manager.address,
              transceiver: manager.transceivers,
              quoter: manager.solanaQuoter,
            }
          : null;
      })
      .filter((token) => token !== null);

    if (tokens.length > 0) {
      result.tokens[name] = tokens;
    }
  });

  return result;
}
