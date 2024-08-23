import { Chain, ChainId } from '@wormhole-foundation/sdk';

export type Network = 'mainnet' | 'testnet' | 'devnet';

export const NATIVE = 'native';

export enum Context {
  ETH = 'Ethereum',
  TERRA = 'Terra',
  XPLA = 'XPLA',
  SOLANA = 'Solana',
  ALGORAND = 'Algorand',
  NEAR = 'Near',
  APTOS = 'Aptos',
  SUI = 'Sui',
  SEI = 'Sei',
  COSMOS = 'Cosmos',
  OTHER = 'OTHER',
}

export type ChainResourceMap = {
  [chain in Chain]?: string;
};

export type ChainConfig = {
  key: Chain;
  id: ChainId;
  context: Context;
  finalityThreshold: number;
  nativeTokenDecimals: number;
  cctpDomain?: number;
  disabledAsSource?: boolean;
  disabledAsDestination?: boolean;
};

export type WormholeConfig = {
  env: Network;
  rpcs: ChainResourceMap;
  rest: ChainResourceMap;
  graphql: ChainResourceMap;
  wormholeHosts: string[];
  chains: {
    [chain in Chain]?: ChainConfig;
  };
};

export type Address = string;

export type TokenId = {
  chain: Chain;
  address: string;
};

export type AnyContext = any;

export type AnyContracts = any;

export type TokenDetails = {
  symbol: string;
  decimals: number;
};
