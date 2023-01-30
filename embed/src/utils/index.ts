import { TokenConfig } from 'config/types';
import { TokenId } from '@wormhole-foundation/wormhole-connect-sdk';
import { TOKENS_ARR } from '../sdk/config';

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

export function getTokenById(tokenId: TokenId): TokenConfig | void {
  TOKENS_ARR.forEach((t) => {
    if (t.tokenId !== 'native') {
      if (tokenId.address === t.tokenId.address) return t;
    }
  });
}

export function getTokenDecimals(tokenId: TokenId | 'native'): number {
  if (tokenId === 'native') return 18;
  const tokenConfig = getTokenById(tokenId);
  if (!tokenConfig) throw new Error('token config not found');
  return tokenConfig.decimals;
}
