import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import config from 'config';

export const CCTPManual_CHAINS: ChainName[] = [
  'ethereum',
  'avalanche',
  'fuji',
  'sepolia',
  'base',
  'optimism',
  'arbitrum',
  'optimism_sepolia',
  'arbitrum_sepolia',
  'base_sepolia',
  'polygon',
  'mumbai',
  'solana',
];

export const CCTPDomains: Partial<Record<ChainName, number>> = {
  ethereum: 0,
  avalanche: 1,
  fuji: 1,
  sepolia: 0,
  base: 6,
  optimism: 2,
  arbitrum: 3,
  optimism_sepolia: 2,
  arbitrum_sepolia: 3,
  base_sepolia: 6,
  solana: 5,
  polygon: 7,
  mumbai: 7,
};

export function getChainNameCCTP(domain: number): ChainName {
  switch (domain) {
    case 0:
      return config.isMainnet ? 'ethereum' : 'sepolia';
    case 1:
      return config.isMainnet ? 'avalanche' : 'fuji';
    case 2:
      return config.isMainnet ? 'optimism' : 'optimism_sepolia';
    case 3:
      return config.isMainnet ? 'arbitrum' : 'arbitrum_sepolia';
    case 5:
      return 'solana';
    case 6:
      return config.isMainnet ? 'base' : 'base_sepolia';
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
