import { useEffect, useRef } from 'react';
import { isHexString } from 'ethers';
import { isValidTransactionDigest } from '@mysten/sui.js';
import { Context } from 'sdklegacy';

import config from 'config';
import { ChainConfig } from 'config/types';
import { Token } from 'config/tokens';
import { isGatewayChain } from './cosmos';
import {
  Chain,
  TokenId,
  chainToPlatform,
  isNative,
  amount as sdkAmount,
} from '@wormhole-foundation/sdk';

export const MAX_DECIMALS = 6;
export const NORMALIZED_DECIMALS = 8;

export function convertAddress(address: string): string {
  if (address.length === 22) return address;
  return `0x${address.slice(address.length - 40, address.length)}`;
}

export function trimAddress(address: string, max = 6): string {
  return (
    address.slice(0, max) +
    '...' +
    address.slice(address.length - 4, address.length)
  );
}

export function trimTxHash(
  txHash: string,
  headLength = 6,
  tailLength = 4,
): string {
  const start = txHash.slice(0, headLength);
  const end = txHash.slice(txHash.length - tailLength, txHash.length);
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

export function getWrappedToken(token: Token): Token {
  // if token is not native, return token
  if (isNative(token.tokenId.address)) {
    const chainConfig = config.chains[token.chain];
    const wrappedNativeTokenAddr = chainConfig!.wrappedGasToken;
    if (wrappedNativeTokenAddr) {
      const wrappedNativeToken = config.tokens.get(
        token.chain,
        wrappedNativeTokenAddr,
      );
      if (wrappedNativeToken) {
        return wrappedNativeToken;
      }
    }
  }

  // Otherwise we just return the token :>
  return token;
}

export function getWrappedTokenId(token: Token): TokenId {
  const wrapped = getWrappedToken(token);
  return wrapped.tokenId!;
}

export function getGasToken(chain: Chain): Token {
  const gasToken = config.tokens.getGasToken(chain);
  if (!gasToken) throw new Error(`gas token not found for ${chain}`);
  return gasToken;
}

export function chainDisplayName(chain: Chain): string {
  const chainConfig = config.chains[chain];
  if (chainConfig) {
    return chainConfig.displayName;
  } else {
    return chain;
  }
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

export const getUSDFormat = (price: number | undefined): string => {
  if (typeof price === 'undefined') {
    return '';
  }

  if (price === 0) {
    return '$0';
  }

  return Intl.NumberFormat('en-EN', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

export const calculateUSDPriceRaw = (
  getTokenPrice: (token: Token) => number | undefined,
  amount?: sdkAmount.Amount | number,
  token?: Token,
): number | undefined => {
  if (typeof amount === 'undefined' || !token) {
    return undefined;
  }

  const usdPrice = getTokenPrice(token);
  if (usdPrice) {
    if (typeof amount === 'number') {
      return amount * usdPrice;
    } else {
      return sdkAmount.whole(amount) * usdPrice;
    }
  }
};

export const calculateUSDPrice = (
  getTokenPrice: (token: Token) => number | undefined,
  amount?: sdkAmount.Amount | number,
  token?: Token,
): string => {
  return getUSDFormat(calculateUSDPriceRaw(getTokenPrice, amount, token));
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

export const getTokenExplorerUrl = (chain: Chain, address: string) => {
  const chainConfig = config.chains[chain]!;
  let explorerUrl = '';

  if (chain === 'Sui') {
    explorerUrl = `${chainConfig.explorerUrl}coin/${address}`;
  } else if (chain === 'Aptos') {
    if (isHexString(address)) {
      explorerUrl = `${chainConfig.explorerUrl}fungible_asset/${address}`;
    } else {
      explorerUrl = `${chainConfig.explorerUrl}coin/${address}`;
    }
  } else {
    explorerUrl = `${chainConfig.explorerUrl}address/${address}`;
  }

  return explorerUrl;
};

// Frankenstein tokens are wormhole-wrapped tokens that are not native to the chain
// and likely have no liquidity.
// An example of a Frankenstein token is wormhole-wrapped Arbitrum WETH on Solana.
// However wormhole-wrapped Ethereum WETH on Solana is not a Frankenstein token.
export const isFrankensteinToken = (token: Token, chain: Chain) => {
  if (!token.isTokenBridgeWrappedToken) {
    return false;
  }

  const { nativeChain, symbol } = token;

  if (symbol === 'USDC' && nativeChain === 'Ethereum' && chain === 'Fantom') {
    return true;
  }

  if (token.symbol === 'tBTC') {
    return true;
  }

  return (
    !(['Ethereum', 'Sepolia'] as Chain[]).includes(nativeChain) &&
    ['ETH', 'WETH', 'wstETH', 'USDT', 'USDC', 'USDC.e'].includes(symbol)
  );
};

export const isStableCoin = (token: Token) => {
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
