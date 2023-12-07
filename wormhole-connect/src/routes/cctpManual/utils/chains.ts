import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { isMainnet } from 'config';

export const CCTPManual_CHAINS: ChainName[] = [
  'ethereum',
  'avalanche',
  'fuji',
  'goerli',
  'base',
  'optimism',
  'arbitrum',
  'optimismgoerli',
  'arbitrumgoerli',
  'basegoerli',
  'polygon',
  'mumbai',
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
    case 6:
      return isMainnet ? 'base' : 'basegoerli';
    case 7:
      return isMainnet ? 'polygon' : 'mumbai';
  }
  throw new Error('Invalid CCTP domain');
}
