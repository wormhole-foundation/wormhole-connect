import { useEffect, useRef } from 'react';
import { BigNumber, utils } from 'ethers';
import {
  TokenId,
  ChainName,
  ChainId,
  Context,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { CHAINS, CHAINS_ARR, TOKENS, TOKENS_ARR } from '../config';
import { NetworkConfig, TokenConfig } from '../config/types';
import { toDecimals } from './balance';
import { isValidTransactionDigest, SUI_TYPE_ARG } from '@mysten/sui.js';
import { isHexString } from 'ethers/lib/utils.js';
import { isEvmChain, wh } from '../sdk';

export const MAX_DECIMALS = 6;
export const NORMALIZED_DECIMALS = 8;

export function convertAddress(address: string): string {
  if (address.length === 22) return address;
  return `0x${address.slice(address.length - 40, address.length)}`;
}

function isNative(address: string) {
  return address === SUI_TYPE_ARG || address === '0x1::aptos_coin::AptosCoin';
}

export function trimAddress(address: string, max: number = 6): string {
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
  walletType: Context,
  address: string,
): string {
  if (walletType === Context.ETH) {
    return trimAddress(convertAddress(address));
  } else if (walletType === Context.SOLANA) {
    return trimAddress(address, 4);
  }
  return trimAddress(address);
}

export function getNetworkByChainId(chainId: number): NetworkConfig | void {
  return CHAINS_ARR.filter((c) => chainId === c.chainId)[0];
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

export function getTokenById(tokenId: TokenId): TokenConfig | void {
  return TOKENS_ARR.filter(
    (t) =>
      t.tokenId &&
      tokenId.address.toLowerCase() === t.tokenId!.address.toLowerCase(),
  )[0];
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
  if (!tokenConfig) throw new Error('token config not found');

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
  } else if (chain === 'sei') {
    return isHexString(hexPrefix(tx), 32);
  } else {
    if (tx.startsWith('0x') && tx.length === 66) return true;
    return tx.length > 70 && tx.length < 100;
  }
}

export function debounce(callback: any, wait: number) {
  let timeout: any;
  return (...args: any) => {
    clearTimeout(timeout);
    timeout = setTimeout(function (this: any) {
      callback.apply(this, args);
    }, wait);
  };
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
  amount: BigNumber,
  decimals: number,
  numDecimals?: number,
): string {
  const normalizedDecimals =
    decimals > NORMALIZED_DECIMALS ? NORMALIZED_DECIMALS : decimals;
  return toDecimals(amount, normalizedDecimals, numDecimals);
}
