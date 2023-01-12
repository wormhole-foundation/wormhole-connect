import { Network as Environment, Contracts } from '@certusone/wormhole-sdk';
import { MainnetChainName, MainnetChainId } from './config/MAINNET';
import { TestnetChainName, TestnetChainId } from './config/TESTNET';

export const NATIVE = 'native';
// TODO: conditionally set these types
export type ChainName = MainnetChainName | TestnetChainName;
export type ChainId = MainnetChainId | TestnetChainId;
export enum Context {
  ETH = 'Ethereum',
  TERRA = 'Terra',
  INJECTIVE = 'Injective',
  XPLA = 'XPLA',
  SOLANA = 'Solana',
  ALGORAND = 'Algorand',
  NEAR = 'Near',
  APTOS = 'Aptos',
  OTHER = 'OTHER',
}

export type Rpcs = {
  [chain in ChainName]?: string;
};

export type ChainConfig = {
  id: ChainId;
  context: Context;
  contracts: Contracts;
};

export type WormholeConfig = {
  env: Environment;
  rpcs: Rpcs;
  chains: {
    [chain in ChainName]?: ChainConfig;
  };
};

export type Address = string;

export type TokenId = {
  chain: ChainName;
  address: string;
};
