import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { isMainnet } from 'config';

export const CCTPManual_CHAINS: ChainName[] = [
  'ethereum',
  'avalanche',
  'fuji',
  'goerli',
  'optimism',
  'arbitrum',
  'optimismgoerli',
  'arbitrumgoerli',
];

export function getChainNameCCTP(domain: number): ChainName {
  switch (domain) {
    case 0:
      return isMainnet ? 'ethereum' : 'goerli';
    case 1:
      return isMainnet ? 'avalanche' : 'fuji';
    case 2:
      return isMainnet ? 'optimism' : 'optimismgoerli';
    case 3:
      return isMainnet ? 'arbitrum' : 'arbitrumgoerli';
  }
  throw new Error('Invalid CCTP domain');
}
