import React from 'react';

type Environment = 'MAINNET' | 'TESTNET';
export const MAINNET_CHAINS = {
  solana: 1,
  ethereum: 2,
  bsc: 4,
  polygon: 5,
  avalanche: 6,
  fantom: 10,
  celo: 14,
  moonbeam: 16,
} as const;
export type MainnetChainName = keyof typeof MAINNET_CHAINS;
export type MainnetChainId = (typeof MAINNET_CHAINS)[MainnetChainName];

export const TESTNET_CHAINS = {
  solana: 1,
  goerli: 2,
  bsc: 4,
  mumbai: 5,
  fuji: 6,
  fantom: 10,
  alfajores: 14,
  moonbasealpha: 16,
} as const;
export type TestnetChainName = keyof typeof TESTNET_CHAINS;
export type TestnetChainId = (typeof TESTNET_CHAINS)[TestnetChainName];

export type ChainName = MainnetChainName | TestnetChainName;
export type ChainId = MainnetChainId | TestnetChainId;

export type Rpcs = {
  [chain in ChainName]?: string;
};
export type Contracts = {
  core?: string;
  token_bridge?: string;
  nft_bridge?: string;
  relayer?: string;
};

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

export type ChainConfig = {
  key: ChainName;
  id: ChainId;
  context: Context;
  contracts: Contracts;
  finalityThreshold: number;
};

export type WormholeConfig = {
  env: Environment;
  rpcs: Rpcs;
  chains: {
    [chain in ChainName]?: ChainConfig;
  };
};

class WormholeBridge extends React.Component<
  { config?: WormholeConfig; }
> {
  componentDidMount() {
    const script = document.createElement("script");
    script.src = "https://wormhole-foundation.github.io/wormhole-connect/main.js";
    script.async = true;

    const link = document.createElement("link");
    link.href = "https://wormhole-foundation.github.io/wormhole-connect/main.css";

    document.body.appendChild(script);
    document.body.appendChild(link);
  }

  render() {
    return (
      // @ts-ignore
      <div id="wormhole-connect" config={this.props.config ? JSON.stringify(this.props.config) : null}></div>
    );
  }
}

export default WormholeBridge;
