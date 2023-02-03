import { TokenConfig } from 'config/types';
import { TokenId, ChainConfig } from '@wormhole-foundation/wormhole-connect-sdk';
import { CHAINS_ARR, TOKENS_ARR } from '../sdk/config';

export function convertAddress(address: string): string {
  if (address.length === 22) return address;
  return `0x${address.slice(address.length - 40, address.length)}`;
}

export function displayEvmAddress(address: string): string {
  const evmAddress = convertAddress(address);
  return (
    evmAddress.slice(0, 6) +
    '...' +
    evmAddress.slice(evmAddress.length - 4, evmAddress.length)
  );
}

export function getNetworkByChainId(chainId: number): ChainConfig | void {
  CHAINS_ARR.forEach((c) => {
    if (chainId === c.chainId) return c;
  })
}

export function getTokenById(tokenId: TokenId): TokenConfig | void {
  TOKENS_ARR.forEach((t) => {
    if (!t.tokenId) return;
    if (tokenId.address === t.tokenId!.address) return t;
  });
}

export function getTokenDecimals(tokenId: TokenId | 'native'): number {
  if (tokenId === 'native') return 18;
  const tokenConfig = getTokenById(tokenId);
  if (!tokenConfig) throw new Error('token config not found');
  return tokenConfig.decimals;
}

function fallbackCopyTextToClipboard(text: string) {
  const textArea = document.createElement('textarea')
  textArea.value = text

  // Avoid scrolling to bottom
  textArea.style.top = '0'
  textArea.style.left = '0'
  textArea.style.position = 'fixed'

  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  try {
    const successful = document.execCommand('copy')
    const msg = successful ? 'successful' : 'unsuccessful'
    console.log('Fallback: Copying text command was ' + msg)
    document.body.removeChild(textArea)
    return true
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err)
    document.body.removeChild(textArea)
    return false
  }
}

export function copyTextToClipboard(text: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(
      function () {
        console.log('Async: Copying to clipboard was successful!')
        return true
      },
      function (err) {
        console.error('Async: Could not copy text: ', err)
        return fallbackCopyTextToClipboard(text)
      }
    )
  }
  return fallbackCopyTextToClipboard(text)
}
