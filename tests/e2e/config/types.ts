import { type Chain } from '@wormhole-foundation/sdk';

export type TestConfig = {
  name: string;
  config: string;
  enabled: boolean;
  sourceWallet?: {
    address: string;
    privateKey: string;
  };
  sourceAsset: {
    chain: Chain;
    symbol: string;
    address: string | undefined;
  };
  destinationWallet?: {
    address: string;
  };
  destinationAsset: {
    chain: Chain;
    symbol: string;
    address: string | undefined;
  };
  amount: string;
  waitForCompletion: boolean;
};
