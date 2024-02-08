import { useEffect, useRef } from 'react';
import { BigNumber, BigNumberish, utils } from 'ethers';
import { isHexString } from 'ethers/lib/utils.js';
import { isValidTransactionDigest, SUI_TYPE_ARG } from '@mysten/sui.js';
import {
  TokenId,
  ChainName,
  ChainId,
  Context,
} from '@wormhole-foundation/wormhole-connect-sdk';

import { CHAINS, CHAINS_ARR, TOKENS, TOKENS_ARR } from 'config';
import { ChainConfig, TokenConfig } from 'config/types';
import { isEvmChain, wh } from 'utils/sdk';
import { toDecimals } from './balance';
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
  return CHAINS_ARR.filter((c) => chainId === c.chainId)[0];
}

export function getChainConfig(chain: ChainName | ChainId): ChainConfig {
  const chainConfig = CHAINS[wh.toChainName(chain)];
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
    const wrapped = TOKENS[token.wrappedAsset];
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
  return TOKENS_ARR.find(
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
  const gasToken = TOKENS[getChainConfig(chain).gasToken];
  if (!gasToken) throw new Error(`gas token not found for ${chain}`);
  return gasToken;
}

export function getTokenDecimals(
  chain: ChainId,
  tokenId: TokenId | 'native' = 'native',
): number {
  const chainName = wh.toChainName(chain);
  const chainConfig = CHAINS[chainName];
  if (!chainConfig) throw new Error(`chain config for ${chainName} not found`);

  if (tokenId === 'native') {
    return chainConfig.nativeTokenDecimals;
  }

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

export function fromNormalizedDecimals(
  amount: BigNumber,
  decimals: number,
): BigNumber {
  return decimals > NORMALIZED_DECIMALS
    ? utils.parseUnits(amount.toString(), decimals - NORMALIZED_DECIMALS)
    : amount;
}

export function toNormalizedDecimals(
  amount: BigNumberish,
  decimals: number,
  numDecimals?: number,
): string {
  const normalizedDecimals =
    decimals > NORMALIZED_DECIMALS ? NORMALIZED_DECIMALS : decimals;
  return toDecimals(amount, normalizedDecimals, numDecimals);
}

export function normalizeAmount(
  amount: BigNumber,
  decimals: number,
): BigNumber {
  if (decimals > NORMALIZED_DECIMALS) {
    return amount.div(BigNumber.from(10).pow(decimals - NORMALIZED_DECIMALS));
  }
  return amount;
}

export function deNormalizeAmount(
  amount: BigNumber,
  decimals: number,
): BigNumber {
  if (decimals > NORMALIZED_DECIMALS) {
    return amount.mul(BigNumber.from(10).pow(decimals - NORMALIZED_DECIMALS));
  }
  return amount;
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
  const hydratedParts = [];
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

export const getUSDFormat = (price: number | undefined): string => {
  if (typeof price !== 'undefined') {
    return `(${price > 0 ? '~' : ''}${Intl.NumberFormat('en-EN', {
      style: 'currency',
      currency: 'USD',
    }).format(price)})`;
  }
  return '';
};

export const calculateUSDPrice = (
  amount?: number | string,
  tokenPrices?: TokenPrices,
  token?: TokenConfig,
): string => {
  if (!amount || !tokenPrices || !token) return '';
  const usdPrice = getTokenPrice(tokenPrices || {}, token) || 0;
  if (usdPrice > 0) {
    const price = Number.parseFloat(`${amount}`) * usdPrice;
    return getUSDFormat(price);
  }
  return '';
};
