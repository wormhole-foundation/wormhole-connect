import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  fetchDigitalAsset,
  mplTokenMetadata,
} from '@metaplex-foundation/mpl-token-metadata';
import { publicKey } from '@metaplex-foundation/umi';
import type {
  Wormhole,
  PlatformToChains,
  TokenId,
  Network,
  NativeAddress,
  Chain,
} from '@wormhole-foundation/sdk';
import { chainToPlatform } from '@wormhole-foundation/sdk';
import config, { getWormholeContextV2 } from 'config';
import type { Token } from 'config/tokens';
import { Contract } from 'ethers';
import type { SuiClient } from '@mysten/sui/client';
import type { StacksNetwork } from '@stacks/network';
import { fetchJson } from 'utils';

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
    case 'Stacks':
      return getTokenMetadataStacks(wh, tokenId);
    case 'Sui':
      return getTokenMetadataSui(wh, tokenId);
  }
}

export async function getTokenMetadataSolana(
  wh: Wormhole<Network>,
  tokenId: TokenId,
): Promise<TokenMetadataFromRpc | undefined> {
  try {
    if (chainToPlatform(tokenId.chain) !== 'Solana') return undefined;
    const platform = wh.getPlatform('Solana');
    const rpc = platform.getRpc(tokenId.chain as PlatformToChains<'Solana'>);
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

export async function getTokenMetadataStacks(
  wh: Wormhole<Network>,
  tokenId: TokenId,
): Promise<TokenMetadataFromRpc | undefined> {
  try {
    const principal = tokenId.address.toString();

    const platform = wh.getPlatform('Stacks');
    const rpc: StacksNetwork = platform.getRpc(
      tokenId.chain as PlatformToChains<'Stacks'>,
    );

    const token = await fetchJson(
      `${rpc.client.baseUrl}/metadata/v1/ft/${principal}`,
    );

    if (!token) {
      return undefined;
    }

    return {
      symbol: token?.symbol ?? '',
      name: token?.name ?? '',
      icon: token?.image_uri || token.image_thumbnail_uri,
    };
  } catch (e) {
    console.error(e);
    return undefined;
  }
}

/**
 * Find a token by address or symbol.
 * First tries to find by address, then falls back to symbol if not found.
 * @param chain - The chain to search on
 * @param address - The token address (optional)
 * @param symbol - The token symbol (optional)
 * @returns The found token or undefined
 */
export function findToken(
  chain: Chain | undefined,
  address?: string,
  symbol?: string,
): Token | undefined {
  if (!chain) {
    return undefined;
  }

  let token: Token | undefined;

  // Try by address first
  if (address) {
    try {
      token = config.tokens.get(chain, address);
    } catch (_e) {
      // Token not found by address - silently continue to try by symbol
    }
  }

  // Fallback to symbol if not found by address
  if (!token && symbol) {
    token = config.tokens.findBySymbol(chain, symbol);
  }

  return token;
}
