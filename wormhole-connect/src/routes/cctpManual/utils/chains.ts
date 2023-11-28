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
  'solana',
];

export const CCTPDomains: Partial<Record<ChainName, number>> = {
  ethereum: 0,
  avalanche: 1,
  fuji: 1,
  goerli: 0,
  base: 6,
  optimism: 2,
  arbitrum: 3,
  optimismgoerli: 2,
  arbitrumgoerli: 3,
  basegoerli: 6,
  solana: 5,
};

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
    case 5:
      return 'solana';
    case 6:
      return config.isMainnet ? 'base' : 'basegoerli';
    case 7:
      return config.isMainnet ? 'polygon' : 'mumbai';
  }
  throw new Error('Invalid CCTP domain');
}

export function getDomainCCTP(chain: ChainName): number {
  const domain = CCTPDomains[chain];
  if (domain === undefined) throw new Error('Invalid CCTP chain');
  return domain;
}
