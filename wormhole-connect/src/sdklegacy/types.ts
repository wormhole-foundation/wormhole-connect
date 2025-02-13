import { Network, Chain, ChainId } from '@wormhole-foundation/sdk';

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
  OTHER = 'OTHER',
}

export type ChainResourceMap = {
  [chain in Chain]?: string;
};

export type ChainConfig = {
  key: Chain;
  id: ChainId;
  context: Context;
  disabledAsSource?: boolean;
  disabledAsDestination?: boolean;
};

export type WormholeConfig = {
  env: Network;
  rpcs: ChainResourceMap;
  chains: {
    [chain in Chain]?: ChainConfig;
  };
};

export type Address = string;

export type AnyContext = any;

export type AnyContracts = any;
