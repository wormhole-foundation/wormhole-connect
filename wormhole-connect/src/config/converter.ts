import * as v1 from 'sdklegacy';
import {
  Network as NetworkConnect,
  TokenConfig as TokenConfigV1,
  TokensConfig as TokensConfigV1,
} from 'config/types';

import * as v2 from '@wormhole-foundation/sdk';
import { getTokenBridgeWrappedTokenAddress } from 'utils/sdkv2';
import { getGasToken } from 'utils';

// SDKConverter provides utility functions for converting core types between SDKv1 and SDKv2
// This is only meant to be used while we transition to SDKv2
export class SDKConverter {
  wh: v1.WormholeContext;

  constructor(wh: v1.WormholeContext) {
    this.wh = wh;
  }

  // Chain conversion

  toChainIdV1(chain: v2.Chain) {
    return v2.toChainId(chain) as v1.ChainId;
  }

  toChainNameV1(chain: v2.Chain) {
    return this.wh.toChainName(this.toChainIdV1(chain));
  }

  toChainV2(chain: v1.ChainName | v1.ChainId): v2.Chain {
    if (typeof chain !== 'number' && typeof chain !== 'string') {
      throw new Error(JSON.stringify(chain));
    }
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

  toTokenIdV2(
    token: v1.TokenId | TokenConfigV1,
    chain?: v1.ChainName,
  ): v2.TokenId {
    if (this.isTokenConfigV1(token)) {
      if (chain && chain != token.nativeChain) {
        // Getting foreign address
        const foreignAsset = token.foreignAssets?.[chain];
        if (foreignAsset) {
          return v2.Wormhole.tokenId(
            this.toChainV2(chain),
            foreignAsset.address,
          );
        } else {
          throw new Error('no foreign asset');
        }
      } else {
        // Getting native address
        const address = this.getNativeTokenAddressV2(token);
        if (!address) throw new Error('no address');
        return v2.Wormhole.tokenId(this.toChainV2(token.nativeChain), address);
      }
    } else {
      return v2.Wormhole.tokenId(this.toChainV2(token.chain), token.address);
    }
  }

  tokenIdV2<C extends v2.Chain>(
    chain: v1.ChainName | v1.ChainId,
    address: string,
  ): v2.TokenId<C> {
    const chainv2 = this.toChainV2(chain) as C;
    return v2.Wormhole.tokenId(chainv2, address);
  }

  isTokenConfigV1(v: v1.TokenId | TokenConfigV1): v is TokenConfigV1 {
    return 'key' in v;
  }

  // Attempts to find the Connect TokenConfig, which is commonly used in Connect code base,
  // given a v2.TokenId
  findTokenConfigV1(
    tokenId: v2.TokenId,
    tokenConfigs: TokenConfigV1[],
  ): TokenConfigV1 | undefined {
    const isNative = tokenId.address === 'native';
    const chain = this.toChainNameV1(tokenId.chain);

    for (const key in tokenConfigs) {
      const token = tokenConfigs[key];
      if (token.nativeChain === chain) {
        if (isNative && token.key === getGasToken(chain).key) {
          return token;
        } else if (
          token.tokenId?.address.toLowerCase() ===
          tokenId.address.toString().toLowerCase()
        ) {
          return token;
        }
      } else {
        // Check foreign assets
        const fa = token.foreignAssets?.[chain];
        if (fa && fa.address === tokenId.address.toString()) {
          return token;
        }
      }
    }
  }

  async getTokenIdV2ForKey<C extends v2.Chain>(
    key: string,
    chain: v1.ChainName | v1.ChainId,
    tokenConfigs: TokensConfigV1,
  ): Promise<v2.TokenId<C> | undefined> {
    const tokenConfig = tokenConfigs[key];
    if (!tokenConfig) return undefined;

    const chainName = this.wh.toChainName(chain);

    if (tokenConfig.nativeChain === chainName) {
      const address = this.getNativeTokenAddressV2(tokenConfig);
      if (!address) return undefined;
      return this.tokenIdV2(chainName, address);
    } else {
      // For token bridge route, we might be trying to fetch a token's address on its
      // non-native chain.
      const foreignAddress = await getTokenBridgeWrappedTokenAddress(
        tokenConfigs[key],
        this.toChainV2(chain),
      );
      if (!foreignAddress) return undefined;
      return this.tokenIdV2(chainName, foreignAddress.toString());
    }
  }

  getNativeTokenAddressV2(token: TokenConfigV1): string | undefined {
    const address =
      // If the token is the native gas token, return 'native'
      // Note: We don't set the address to 'native' for CELO because the Celo token bridge
      // doesn't have WETH set. Celo also has multiple native gas tokens.
      getGasToken(token.nativeChain).key === token.key && token.key !== 'CELO'
        ? 'native'
        : token.tokenId?.address;
    return address;
  }
}
