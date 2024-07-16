import { ChainName, ChainId } from 'sdklegacy';
import config from 'config';
import { Route, TokenConfig } from 'config/types';

export const isIlliquidDestToken = (
  { symbol, nativeChain }: TokenConfig,
  destChain: ChainName | ChainId,
): boolean => {
  // we want to prevent users from receiving non-native or non-Ethereum origin WETH or wstETH
  // which may lack liquid markets and cause confusion for users
  if (['WETH', 'wstETH'].includes(symbol)) {
    if (
      nativeChain !== config.wh.toChainName(destChain) &&
      nativeChain !== 'ethereum'
    ) {
      return true;
    }
  }
  // Users should send USDC to Fantom via NTT instead of the token bridge
  if (
    symbol === 'USDC' &&
    nativeChain === 'ethereum' &&
    destChain === 'fantom'
  ) {
    return true;
  }
  if (
    symbol === 'USDC' &&
    nativeChain === 'fuji' &&
    destChain === 'alfajores'
  ) {
    return true;
  }
  if (
    symbol === 'USDC.e' &&
    (nativeChain === 'fantom' || nativeChain === 'alfajores')
  ) {
    return true;
  }
  if (
    ['ETH', 'WETH'].includes(symbol) &&
    nativeChain === 'ethereum' &&
    // These are L2 chains that have a native bridge
    (destChain === 'scroll' || destChain === 'blast')
  ) {
    return true;
  }
  return false;
};

export const isNttRoute = (route?: Route) => {
  return route === Route.NttManual || route === Route.NttRelay;
};
