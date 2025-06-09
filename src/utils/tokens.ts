import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  fetchDigitalAsset,
  mplTokenMetadata,
} from '@metaplex-foundation/mpl-token-metadata';
import { publicKey } from '@metaplex-foundation/umi';
import {
  Wormhole,
  PlatformToChains,
  TokenId,
  chainToPlatform,
  Network,
  NativeAddress,
  ChainContext,
  Chain,
} from '@wormhole-foundation/sdk';
import config, { getWormholeContextV2 } from 'config';
import { Contract } from 'ethers';
import { SuiClient } from '@mysten/sui/client';
import { SDKv2Route } from 'routes/sdkv2/route';

interface TokenMetadataFromRpc {
  symbol: string;
  name: string;
  icon?: string;
}

export async function getTokenMetadataFromRpc(
  tokenId: TokenId,
): Promise<TokenMetadataFromRpc | undefined> {
  const wh = await getWormholeContextV2();
  const platform = chainToPlatform(tokenId.chain);

  switch (platform) {
    case 'Solana':
      return getTokenMetadataSolana(wh, tokenId);
    case 'Evm':
      return getTokenMetadataEvm(wh, tokenId);
    case 'Sui':
      return getTokenMetadataSui(wh, tokenId);
  }
}

export async function getTokenMetadataSolana(
  wh: Wormhole<Network>,
  tokenId: TokenId,
): Promise<TokenMetadataFromRpc | undefined> {
  try {
    const platform = wh.getPlatform('Solana');
    const rpc = platform.getRpc('Solana');
    const umi = createUmi(rpc);
    umi.use(mplTokenMetadata());

    const { metadata } = await fetchDigitalAsset(
      umi,
      publicKey((tokenId.address as NativeAddress<'Solana'>).unwrap()),
    );

    const { symbol, name } = metadata;
    let icon: string | undefined = undefined;

    if (metadata.uri) {
      // Try to get an image from ipfs
      try {
        const { image } = await (await fetch(metadata.uri)).json();
        if (image) {
          icon = image;
        }
      } catch (_) {
        // Oh well we tried
      }
    }

    return { symbol, name, icon };
  } catch (e) {
    return undefined;
  }
}

export async function getTokenMetadataEvm(
  wh: Wormhole<Network>,
  tokenId: TokenId,
): Promise<TokenMetadataFromRpc | undefined> {
  try {
    const ABI = [
      'function symbol() view returns (string)',
      'function name() view returns (string)',
    ];

    const platform = wh.getPlatform('Evm');
    const rpc = platform.getRpc(tokenId.chain as PlatformToChains<'Evm'>);

    const contract = new Contract(tokenId.address.toString(), ABI, rpc);
    const symbolPromise = contract.symbol();
    const namePromise = contract.name();
    const [symbol, name] = await Promise.all([symbolPromise, namePromise]);
    return { symbol, name };
  } catch (e) {
    console.error(e);
    return undefined;
  }
}

export async function getTokenMetadataSui(
  wh: Wormhole<Network>,
  tokenId: TokenId,
): Promise<TokenMetadataFromRpc | undefined> {
  try {
    const platform = wh.getPlatform('Sui');
    const rpc: SuiClient = platform.getRpc(
      tokenId.chain as PlatformToChains<'Sui'>,
    );
    const token = await rpc.getCoinMetadata({
      coinType: tokenId.address.toString(),
    });
    return { symbol: token?.symbol ?? '', name: token?.name ?? '' };
  } catch (e) {
    console.error(e);
    return undefined;
  }
}

// returns true if the token is supported by a NTT route, false otherwise
export const hasNttRoute = async (
  token: TokenId,
  fromContext: ChainContext<Network, Chain>,
  toContext: ChainContext<Network, Chain>,
): Promise<boolean> => {
  const checkRouteSupport = async (routeName: string): Promise<boolean> => {
    const route: SDKv2Route | undefined = config.routes.get(routeName);
    if (!route) return false;

    try {
      const destTokens = await route.rc.supportedDestinationTokens(
        token,
        fromContext,
        toContext,
      );

      return destTokens.length > 0;
    } catch (e) {
      return false;
    }
  };

  const [isManualSupported, isAutomaticSupported, isM0Supported] =
    await Promise.all([
      checkRouteSupport('ManualNtt'),
      checkRouteSupport('AutomaticNtt'),
      checkRouteSupport('M0AutomaticRoute'),
    ]);

  return isManualSupported || isAutomaticSupported || isM0Supported;
};
