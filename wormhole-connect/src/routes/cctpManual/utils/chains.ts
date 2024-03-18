import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import config from 'config';

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
      return config.isMainnet ? 'ethereum' : 'goerli';
    case 1:
      return config.isMainnet ? 'avalanche' : 'fuji';
    case 2:
      return config.isMainnet ? 'optimism' : 'optimismgoerli';
    case 3:
      return config.isMainnet ? 'arbitrum' : 'arbitrumgoerli';
    case 6:
      return config.isMainnet ? 'base' : 'basegoerli';
    case 7:
      return config.isMainnet ? 'polygon' : 'mumbai';
  }
  throw new Error('Invalid CCTP domain');
}
