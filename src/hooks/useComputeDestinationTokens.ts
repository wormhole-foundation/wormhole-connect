import { useEffect, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import memoize from 'fast-memoize';

import config from 'config';
import { setDestToken } from 'store/transferInput';

import type { Token } from 'config/tokens';

import type { Chain, TokenId } from '@wormhole-foundation/sdk';
import { useTokens } from 'contexts/TokensContext';

type Props = {
  sourceChain: Chain | undefined;
  sourceToken: Token | undefined;
  destChain: Chain | undefined;
};

type ReturnProps = {
  supportedDestTokens: Token[];
  isFetching: boolean;
};

/**
 * Fetch supported destination token IDs from routes.
 * Memoized to avoid redundant API calls.
 */
const fetchSupportedDestTokenIds = memoize(
  async (
    sourceTokenKey: string | undefined,
    sourceChain: Chain,
    destChain: Chain,
  ): Promise<TokenId[]> => {
    // Find the actual token from the key
    const sourceToken = sourceTokenKey
      ? config.tokens.getAll().find((t) => t.key === sourceTokenKey)
      : undefined;

    try {
      return await config.routes.allSupportedDestTokens(
        sourceToken,
        sourceChain,
        destChain,
      );
    } catch (e) {
      console.error(e);
      return [];
    }
  },
);

/**
 * Compute the destination tokens for a given source token and chains.
 * This handles three cases:
 * 1. No source chain selected - returns all tokens on destination chain
 * 2. Both chains selected with source token - fetches supported destination tokens from routes
 * 3. Both chains selected without source token - returns empty array
 */
const computeDestTokensForChains = async (
  sourceChain: Chain | undefined,
  destChain: Chain | undefined,
  sourceToken: Token | undefined,
  getOrFetchToken: (tokenId: TokenId) => Promise<Token | undefined>,
): Promise<Token[]> => {
  if (!destChain) {
    return [];
  }

  // User hasn't selected a source chain yet, so we
  // return all of the known tokens on the destination chain.
  if (!sourceChain) {
    return config.tokens.getAllForChain(destChain);
  }

  // Both chains selected - fetch supported tokens from routes
  const supportedIds = await fetchSupportedDestTokenIds(
    sourceToken?.key,
    sourceChain,
    destChain,
  );

  const supported: Token[] = [];
  await Promise.all(
    supportedIds.map(async (tokenId) => {
      const t = await getOrFetchToken(tokenId);
      if (t) {
        supported.push(t);
      }
    }),
  );

  return supported;
};

const useComputeDestinationTokens = (props: Props): ReturnProps => {
  const { sourceChain, destChain, sourceToken } = props;

  const dispatch = useDispatch();
  const { getOrFetchToken, lastTokenCacheUpdate } = useTokens();

  const [supportedDestTokens, setSupportedDestTokens] = useState<Token[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const computeDestTokens = useCallback(async () => {
    setSupportedDestTokens([]);
    setIsFetching(true);

    try {
      const supported = await computeDestTokensForChains(
        sourceChain,
        destChain,
        sourceToken,
        getOrFetchToken,
      );

      setSupportedDestTokens(supported);

      // Auto-select if there's only one option
      if (destChain && supported.length === 1) {
        dispatch(setDestToken(supported[0].tuple));
      }
    } finally {
      setIsFetching(false);
    }
  }, [sourceToken, sourceChain, destChain, dispatch, getOrFetchToken]);

  useEffect(() => {
    computeDestTokens();
  }, [computeDestTokens, lastTokenCacheUpdate]);

  return {
    supportedDestTokens,
    isFetching,
  };
};

export default useComputeDestinationTokens;
