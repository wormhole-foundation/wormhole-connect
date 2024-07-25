import { useEffect, useRef } from 'react';
import { isHexString } from 'ethers';
import { isValidTransactionDigest, SUI_TYPE_ARG } from '@mysten/sui.js';
import { TokenId, ChainName, ChainId, Context } from 'sdklegacy';

import config from 'config';
import { ChainConfig, TokenConfig } from 'config/types';
import { isEvmChain } from 'utils/sdk';
import { isGatewayChain } from './cosmos';
import { TokenPrices } from 'store/tokenPrices';

export const MAX_DECIMALS = 6;
export const NORMALIZED_DECIMALS = 8;

export function convertAddress(address: string): string {
  if (address.length === 22) return address;
  return `0x${address.slice(address.length - 40, address.length)}`;
}

function isNative(address: string) {
  return address === SUI_TYPE_ARG || address === '0x1::aptos_coin::AptosCoin';
}

export function trimAddress(address: string, max = 6): string {
  if (isNative(address)) return address;
  return (
    address.slice(0, max) +
    '...' +
    address.slice(address.length - 4, address.length)
  );
}

export function displayAddress(chain: ChainName, address: string): string {
  if (isEvmChain(chain)) {
    return trimAddress(convertAddress(address));
  } else if (chain === 'solana') {
    return trimAddress(address, 4);
  }

  return trimAddress(address);
}

export function displayWalletAddress(
  walletType: Context | undefined,
  address: string,
): string {
  if (!walletType) return '';
  if (walletType === Context.ETH) {
    return trimAddress(convertAddress(address));
  } else if (walletType === Context.SOLANA) {
    return trimAddress(address, 4);
  }
  return trimAddress(address);
}

export function getChainByChainId(
  chainId: number | string,
): ChainConfig | undefined {
  return config.chainsArr.filter((c) => chainId === c.chainId)[0];
}

export function getChainConfig(chain: ChainName | ChainId): ChainConfig {
  const chainConfig = config.chains[config.wh.toChainName(chain)];
  if (!chainConfig) throw new Error(`chain config for ${chain} not found`);
  return chainConfig;
}

export function getWrappedToken(token: TokenConfig): TokenConfig {
  if (!token) throw new Error('token must be defined');

  // if token is not native, return token
  if (token.tokenId) return token;

  // otherwise get wrapped token
  if (!token.tokenId && !token.wrappedAsset)
    throw new Error(`token details misconfigured for ${token.key}`);
  if (!token.tokenId && token.wrappedAsset) {
    const wrapped = config.tokens[token.wrappedAsset];
    if (!wrapped) throw new Error('wrapped token not found');
    return wrapped;
  }
  return token;
}

export function getWrappedTokenId(token: TokenConfig): TokenId {
  const wrapped = getWrappedToken(token);
  return wrapped.tokenId!;
}

export function getTokenById(tokenId: TokenId): TokenConfig | undefined {
  return config.tokensArr.find(
    (t) =>
      t.tokenId &&
      tokenId.chain === t.tokenId.chain &&
      tokenId.address.toLowerCase() === t.tokenId!.address.toLowerCase(),
  );
}

export function getDisplayName(token: TokenConfig) {
  return token.displayName || token.symbol;
}

export function getGasToken(chain: ChainName | ChainId): TokenConfig {
  const gasToken = config.tokens[getChainConfig(chain).gasToken];
  if (!gasToken) throw new Error(`gas token not found for ${chain}`);
  return gasToken;
}

export function getTokenDecimals(
  chain: ChainId,
  tokenId: TokenId | 'native' = 'native',
): number {
  const chainName = config.wh.toChainName(chain);
  const chainConfig = config.chains[chainName];
  if (!chainConfig) throw new Error(`chain config for ${chainName} not found`);

  if (tokenId === 'native') {
    return chainConfig.nativeTokenDecimals;
  }

  console.log(tokenId);
  const tokenConfig = getTokenById(tokenId);
  if (!tokenConfig) {
    throw new Error('token config not found');
  }

  const decimals = tokenConfig.decimals;
  return decimals[chainConfig.context] || decimals.default;
}

function fallbackCopyTextToClipboard(text: string) {
  const textArea = document.createElement('textarea');
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.position = 'fixed';

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand('copy');
    return true;
  } catch (err) {
    return false;
  } finally {
    document.body.removeChild(textArea);
  }
}

export function copyTextToClipboard(text: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(
      function () {
        return true;
      },
      function () {
        return fallbackCopyTextToClipboard(text);
      },
    );
  }
  return fallbackCopyTextToClipboard(text);
}

export function hexPrefix(hex: string) {
  return hex.startsWith('0x') ? hex : `0x${hex}`;
}

export function isValidTxId(chain: string, tx: string) {
  if (chain === 'sui') {
    return isValidTransactionDigest(tx);
  } else if (isGatewayChain(chain as any) || chain === 'sei') {
    return isHexString(hexPrefix(tx), 32);
  } else {
    if (tx.startsWith('0x') && tx.length === 66) return true;
    return tx.length > 70 && tx.length < 100;
  }
}

export function usePrevious(value: any) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export async function sleep(timeout: number) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

export function hydrateHrefTemplate(
  href: string,
  fromChain?: string,
  toChain?: string,
) {
  const queryParam = href.split('?')[1];
  const templateParts = queryParam?.split('&');
  const sourceTemplate = templateParts?.find((p) =>
    p.includes('{:sourceChain}'),
  );
  const targetTemplate = templateParts?.find((p) =>
    p.includes('{:targetChain}'),
  );
  const hydratedParts: string[] = [];
  if (fromChain && sourceTemplate) {
    const source = sourceTemplate.replace('{:sourceChain}', fromChain);
    hydratedParts.push(source);
  }
  if (toChain && targetTemplate) {
    const target = targetTemplate.replace('{:targetChain}', toChain);
    hydratedParts.push(target);
  }
  if (queryParam) {
    return `${href.replace(queryParam, '')}${hydratedParts.join('&')}`;
  }
  return href;
}

export function isEqualCaseInsensitive(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase();
}

export const sortTokens = (
  tokens: TokenConfig[],
  chain: ChainName | ChainId,
) => {
  const gasToken = getGasToken(chain);
  const wrappedGasToken = getWrappedToken(gasToken);
  return [...tokens].sort((a, b) => {
    // native tokens first
    if (a.key === gasToken.key) return -1; // Sort gasToken first
    if (b.key === gasToken.key) return 1; // Sort gasToken first
    if (a.key === wrappedGasToken.key) return -1; // Sort wrappedGasToken second
    if (b.key === wrappedGasToken.key) return 1; // Sort wrappedGasToken second
    if (a.nativeChain === chain && b.nativeChain !== chain) return -1; // Sort nativeChain tokens third
    if (b.nativeChain === chain && a.nativeChain !== chain) return 1; // Sort nativeChain tokens third
    return 0; // Sort the rest
  });
};

export const getTokenPrice = (
  tokenPrices: TokenPrices,
  token: TokenConfig,
): number | undefined => {
  if (tokenPrices && token) {
    const price = tokenPrices[token.coinGeckoId]?.usd;
    return price;
  }
  return undefined;
};

export const getUSDFormat = (
  price: number | undefined,
  noParanthesis?: boolean | undefined,
): string => {
  if (typeof price !== 'undefined') {
    return `${noParanthesis ? '' : '('}${
      price > 0 ? '~' : ''
    }${Intl.NumberFormat('en-EN', {
      style: 'currency',
      currency: 'USD',
    }).format(price)}${noParanthesis ? '' : ')'}`;
  }
  return '';
};

export const calculateUSDPrice = (
  amount?: number | string,
  tokenPrices?: TokenPrices,
  token?: TokenConfig,
  noParanthesis?: boolean | undefined,
): string => {
  if (
    typeof amount === 'undefined' ||
    amount === '' ||
    !tokenPrices ||
    !token
  ) {
    return '';
  }

  const usdPrice = getTokenPrice(tokenPrices || {}, token) || 0;
  if (usdPrice > 0) {
    const price = Number.parseFloat(`${amount}`) * usdPrice;
    return getUSDFormat(price, noParanthesis);
  }
  return '';
};

/**
 * Checks whether an object is empty.
 *
 * isEmptyObject(null)
 * // => true
 *
 * isEmptyObject(undefined)
 * // => true
 *
 * isEmptyObject({})
 * // => true
 *
 * isEmptyObject({ 'a': 1 })
 * // => false
 */
export const isEmptyObject = (value: object | null | undefined) => {
  if (value === null || value === undefined) {
    return true;
  }

  // Check all property keys for any own prop
  for (const key in value) {
    if (value.hasOwnProperty.call(value, key)) {
      return false;
    }
  }

  return true;
};
