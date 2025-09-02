import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

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
 * Compute the destination tokens for a given source token and chains.
 * Behavior:
 * 1. If no destination chain: return empty
 * 2. If no source chain OR no source token: return all tokens on destination chain
 * 3. If both chains selected AND a source token: fetch supported destination tokens from routes
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

  // If source chain is not selected OR source token is not selected,
  // return all of the known tokens on the destination chain.
  if (!sourceChain || !sourceToken) {
    return config.tokens.getAllForChain(destChain);
  }

  // Both chains selected - fetch supported tokens from routes
  const supportedTokenIds = await config.routes.allSupportedDestTokens(
    sourceToken,
    sourceChain,
    destChain,
  );

  const tokens = await Promise.all(supportedTokenIds.map(getOrFetchToken));
  const supportedTokens = tokens.filter((token) => !!token);

  return supportedTokens;
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
