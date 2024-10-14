import { useEffect, useRef } from 'react';
import { isHexString } from 'ethers';
import { isValidTransactionDigest, SUI_TYPE_ARG } from '@mysten/sui.js';
import { TokenId, Context } from 'sdklegacy';

import config from 'config';
import { ChainConfig, TokenConfig } from 'config/types';
import { isGatewayChain } from './cosmos';
import { TokenPrices } from 'store/tokenPrices';
import { Chain, chainToPlatform } from '@wormhole-foundation/sdk';
import { getNativeVersionOfToken } from 'store/transferInput';

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

export function trimTxHash(txHash: string): string {
  const start = txHash.slice(0, 6);
  const end = txHash.slice(txHash.length - 4, txHash.length);
  return `${start}...${end}`;
}

export function displayAddress(chain: Chain, address: string): string {
  if (chainToPlatform.get(chain) === 'Evm') {
    return trimAddress(convertAddress(address));
  } else if (chain === 'Solana') {
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

export function getChainConfig(chain: Chain): ChainConfig {
  const chainConfig = config.chains[chain];
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

export function getDisplayName(token: TokenConfig, chain: Chain): string {
  const isWrapped = isWrappedToken(token, chain);
  const baseName = token.displayName ?? token.symbol;

  if (!isWrapped) {
    return baseName;
  }

  const isEthereum = token.nativeChain === 'Ethereum';

  // TODO: remove this once CCTP is launched on Sui
  if (isStableCoin(token) && !isEthereum && chain === 'Sui') {
    return `Wormhole-wrapped ${token.nativeChain} ${baseName}`;
  }

  const prefix = `Wormhole-wrapped ${
    isFrankensteinToken(token, chain)
      ? isEthereum
        ? ''
        : `${token.nativeChain} `
      : ''
  }`;

  return `${prefix}${baseName}`;
}

export function getGasToken(chain: Chain): TokenConfig {
  const gasToken = config.tokens[getChainConfig(chain).gasToken];
  if (!gasToken) throw new Error(`gas token not found for ${chain}`);
  return gasToken;
}

export function getTokenDecimals(
  chain: Chain,
  tokenId: TokenId | 'native' = 'native',
): number {
  const chainConfig = config.chains[chain];
  if (!chainConfig) throw new Error(`chain config for ${chain} not found`);

  if (tokenId === 'native') {
    const { decimals } = getGasToken(chain);
    return decimals;
  }

  const tokenConfig = getTokenById(tokenId);
  if (!tokenConfig) {
    throw new Error('token config not found');
  }

  const { nativeChain, decimals } = tokenConfig;

  const platform = chainToPlatform(chain);
  const tokenPlatform = chainToPlatform(nativeChain);

  // If the token is native to the chain, return the token's decimals
  if (platform === tokenPlatform) return decimals;

  // Otherwise, return the minimum of the token's decimals and the platform's max decimals (token bridge)
  // See: https://github.com/wormhole-foundation/wormhole/blob/main/whitepapers/0003_token_bridge.md#handling-of-token-amounts-and-decimals
  const maxWrappedDecimals = platform === 'Evm' ? 18 : 8;

  return Math.min(decimals, maxWrappedDecimals);
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

export function isValidTxId(chain: Chain, tx: string) {
  if (chain === 'Sui') {
    return isValidTransactionDigest(tx);
  } else if (isGatewayChain(chain as any) || chain === 'Sei') {
    return isHexString(hexPrefix(tx), 32);
  } else {
    if (tx.startsWith('0x') && tx.length === 66) return true;
    return tx.length > 70 && tx.length < 100;
  }
}

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
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

export const sortTokens = (tokens: TokenConfig[], chain: Chain) => {
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

export const getUSDFormat = (price: number | undefined): string => {
  if (typeof price === 'undefined') {
    return '';
  }

  if (price === 0) {
    return '$0';
  }

  return (
    '~' +
    Intl.NumberFormat('en-EN', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  );
};

export const calculateUSDPriceRaw = (
  amount?: number | string,
  tokenPrices?: TokenPrices | null,
  token?: TokenConfig,
): number | undefined => {
  if (
    typeof amount === 'undefined' ||
    amount === '' ||
    !tokenPrices ||
    !token
  ) {
    return undefined;
  }

  const usdPrice = getTokenPrice(tokenPrices || {}, token) || 0;
  if (usdPrice > 0) {
    return Number.parseFloat(`${amount}`) * usdPrice;
  }
};

export const calculateUSDPrice = (
  amount?: number | string,
  tokenPrices?: TokenPrices | null,
  token?: TokenConfig,
): string => {
  return getUSDFormat(calculateUSDPriceRaw(amount, tokenPrices, token));
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

export const getExplorerUrl = (chain: Chain, address: string) => {
  const chainConfig = config.chains[chain]!;
  let explorerUrl = '';

  if (chain === 'Sui') {
    explorerUrl = `${chainConfig.explorerUrl}coin/${address}`;
  } else {
    explorerUrl = `${chainConfig.explorerUrl}address/${address}`;
  }

  return explorerUrl;
};

// Frankenstein tokens are wormhole-wrapped tokens that are not native to the chain
// and likely have no liquidity.
// An example of a Frankenstein token is wormhole-wrapped Arbitrum WETH on Solana.
// However wormhole-wrapped Ethereum WETH on Solana is not a Frankenstein token.
export const isFrankensteinToken = (token: TokenConfig, chain: Chain) => {
  const { nativeChain, symbol } = token;

  if (symbol === 'USDC' && nativeChain === 'Ethereum' && chain === 'Fantom') {
    return true;
  }

  if (!isWrappedToken(token, chain)) {
    return false;
  }

  // If there is a native version of the token on the chain, then it's a Frankenstein token
  if (getNativeVersionOfToken(token.symbol, chain)) {
    return true;
  }

  if (token.symbol === 'tBTC') {
    return true;
  }

  // TODO: Remove this once CCTP is launched on Sui
  // Allow all USDC flavors to be transferred on Sui
  if (token.symbol === 'USDC' && chain === 'Sui') {
    return false;
  }

  return (
    !(['Ethereum', 'Sepolia'] as Chain[]).includes(nativeChain) &&
    ['ETH', 'WETH', 'wstETH', 'USDT', 'USDC', 'USDC.e'].includes(symbol)
  );
};

export const isWrappedToken = (token: TokenConfig, chain: Chain) => {
  return token.nativeChain !== chain;
};

// Canonical tokens may be Wormhole-wrapped tokens that are canonical on the chain
// e.g., Wormhole-wrapped Ethereum USDC is canonical on Sui
export const isCanonicalToken = (token: TokenConfig, chain: Chain) => {
  return token.key === 'USDCeth' && chain === 'Sui';
};

export const isStableCoin = (token: TokenConfig) => {
  return ['USDC', 'USDT', 'DAI'].includes(token.symbol);
};

export const millisToHumanString = (ts: number): string => {
  if (ts > 60000) {
    const minutes = Math.ceil(ts / 60000);
    return `~${minutes} min`;
  } else {
    const seconds = Math.ceil(ts / 1000);
    return `~${seconds} sec`;
  }
};

// Generates relative time string for days, hours and minutes
export const millisToRelativeTime = (ts: number): string => {
  const minsMultiplier = 1000 * 60;
  const hoursMultiplier = minsMultiplier * 60;
  const daysMultiplier = hoursMultiplier * 24;

  if (ts > daysMultiplier) {
    // It's been more than a day, show "# days ago"
    const days = Math.floor(ts / daysMultiplier);
    return `~${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else if (ts > hoursMultiplier) {
    // It's been more than an hour, show "# hours ago"
    const hours = Math.floor(ts / hoursMultiplier);
    return `~${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (ts > minsMultiplier) {
    // It's been more than a minute ago, show "# minutes ago"
    const minutes = Math.floor(ts / minsMultiplier);
    return `~${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else {
    // It's been less than a minute ago, but we approx up to one minute
    return '~1 minute ago';
  }
};

export const formatDuration = (seconds: number) => {
  if (seconds < 60) {
    return seconds === 1 ? `${seconds} second` : `${seconds} seconds`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return minutes === 1 ? `${minutes} minute` : `${minutes} minutes`;
  } else {
    const hours = Math.floor(seconds / 3600);
    return hours === 1 ? `${hours} hour` : `${hours} hours`;
  }
};
