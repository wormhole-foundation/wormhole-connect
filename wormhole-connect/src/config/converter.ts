import * as v1 from '@wormhole-foundation/wormhole-connect-sdk';
import {
  Network as NetworkConnect,
  TokenConfig as TokenConfigV1,
  TokensConfig as TokensConfigV1,
  ChainsConfig as ChainsConfigV1,
} from 'config/types';

import * as v2 from '@wormhole-foundation/sdk';

// SDKConverter provides utility functions for converting core types between SDKv1 and SDKv2
// This is only meant to be used while we transition to SDKv2
export class SDKConverter {
  wh: v1.WormholeContext;
  chains: ChainsConfigV1;
  tokens: TokensConfigV1;

  constructor(
    wh: v1.WormholeContext,
    chains: ChainsConfigV1,
    tokens: TokensConfigV1,
  ) {
    this.wh = wh;
    this.chains = chains;
    this.tokens = tokens;
  }

  // Chain conversion

  toChainIdV1(chain: v2.Chain) {
    return v2.toChainId(chain) as v1.ChainId;
  }

  toChainNameV1(chain: v2.Chain) {
    return this.wh.toChainName(this.toChainIdV1(chain));
  }

  toChainV2(chain: v1.ChainName | v1.ChainId): v2.Chain {
    return v2.toChain(this.wh.toChainId(chain));
  }

  // Network conversion

  toNetworkV2(network: NetworkConnect): v2.Network {
    switch (network) {
      case 'mainnet':
        return 'Mainnet';
      case 'testnet':
        return 'Testnet';
      case 'devnet':
        return 'Devnet';
    }
  }

  toNetworkV1(network: v2.Network): NetworkConnect {
    return network.toLowerCase() as NetworkConnect;
  }

  // Token conversion

  toTokenIdV1(token: v2.TokenId): v1.TokenId | undefined {
    if (token.address === 'native') {
      // In Connect's legacy code, native tokens don't have a tokenId
      return undefined;
    } else {
      return {
        chain: this.toChainNameV1(token.chain),
        address: token.address.toString(),
      };
    }
  }

  toTokenIdV2(token: v1.TokenId | TokenConfigV1): v2.TokenId {
    if (this.isTokenConfigV1(token)) {
      return v2.Wormhole.tokenId(
        this.toChainV2(token.nativeChain),
        token.tokenId?.address ?? 'native',
      );
    } else {
      return v2.Wormhole.tokenId(this.toChainV2(token.chain), token.address);
    }
  }

  isTokenConfigV1(v: v1.TokenId | TokenConfigV1): v is TokenConfigV1 {
    return 'key' in v;
  }

  // Attempts to find the Connect TokenConfig, which is comomnly used in Connect code base,
  // given a v2.TokenId
  findTokenConfigV1(tokenId: v2.TokenId): TokenConfigV1 | undefined {
    const isNative = tokenId.address === 'native';
    const chain = this.toChainNameV1(tokenId.chain);

    for (const key in this.tokens) {
      const token = this.tokens[key];
      if (token.nativeChain === chain) {
        if (isNative && token.tokenId === undefined) {
          // Connect's TokenConfig lacks a tokenId field when it's the native gas token
          return token;
        } else if (token.tokenId?.address === tokenId.address.toString()) {
          return token;
        }
      }
    }
  }
}
