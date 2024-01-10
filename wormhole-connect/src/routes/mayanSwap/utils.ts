import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { TokenConfig } from 'config/types';

import {
  fetchQuote,
  fetchTokenList,
  Quote,
  QuoteParams,
  ChainName as MayanChainName,
  Token as MayanToken,
} from '@mayanfinance/swap-sdk';

export const SUPPORTED_CHAINS: ChainName[] = [
  'solana',
  'ethereum',
  'bsc',
  'polygon',
  'avalanche',
  'arbitrum',
  'aptos',
];

// Cache
// Mapping of token address to boolean. For quick lookup.
const SUPPORTED_TOKENS: Map<ChainName, Map<string, boolean>> = new Map();

async function supportedTokens(
  chain: ChainName,
): Promise<Map<string, boolean>> {
  let cached = SUPPORTED_TOKENS.get(chain);
  if (cached) {
    return cached;
  }

  let tokens: MayanToken[] = await fetchTokenList(chain as MayanChainName);

  // Generate mapping of contract ID -> true
  let mapping = new Map(
    tokens.map((token) => {
      return [token.contract, true];
    }),
  );

  SUPPORTED_TOKENS.set(chain, mapping);

  return mapping;
}

export async function isTokenSupported(
  chain: ChainName,
  token: TokenConfig,
): Promise<boolean> {
  let tokens = await supportedTokens(chain);

  if (!token.tokenId) {
    // Native token is always supported of course ^_^
    return true;
  } else {
    return !!tokens.get(token.tokenId.address);
  }
}
