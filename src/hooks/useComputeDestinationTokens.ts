import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import config from 'config';
import { setDestToken } from 'store/transferInput';

import type { Token } from 'config/tokens';
import { isSameToken } from 'config/tokens';

import type { Chain, TokenId } from '@wormhole-foundation/sdk';
import { useTokens } from 'contexts/TokensContext';

type Props = {
  sourceChain: Chain | undefined;
  sourceToken: Token | undefined;
  destChain: Chain | undefined;
  route?: string;
};

type ReturnProps = {
  supportedDestTokens: Token[];
  isFetching: boolean;
};

const useComputeDestinationTokens = (props: Props): ReturnProps => {
  const { sourceChain, destChain, sourceToken } = props;

  const dispatch = useDispatch();

  const [supportedDestTokens, setSupportedDestTokens] = useState<Token[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const { getOrFetchToken, lastTokenCacheUpdate } = useTokens();

  useEffect(() => {
    if (!destChain) {
      return;
    }

    let active = true;

    const computeDestTokens = async () => {
      let supported: Token[] = [];

      setSupportedDestTokens([]);

      // Start fetching and setting all supported tokens

      if (!sourceChain && destChain) {
        // User hasn't selected a source chain yet, so we
        // return all of the known tokens on the destination chain.
        supported = config.tokens.getAllForChain(destChain);
      } else if (sourceChain && destChain) {
        let supportedIds: TokenId[] = [];
        setIsFetching(true);

        try {
          supportedIds = await config.routes.allSupportedDestTokens(
            sourceToken,
            sourceChain,
            destChain,
          );
        } catch (e) {
          console.error(e);
        }

        await Promise.all(
          supportedIds.map(async (tokenId) => {
            const t = await getOrFetchToken(tokenId);
            if (t) {
              supported.push(t);
            }
          }),
        );

        // Done fetching and setting all supported tokens
        setIsFetching(false);
      } else {
        return;
      }

      if (!active) {
        return;
      }

      // If we have a source token, check if it's available on the destination chain
      // and add it to the list if it's not already there (unless it's a same-chain swap)
      if (sourceToken && destChain && sourceChain !== destChain) {
        const sourceOnDest = config.tokens.get(
          destChain,
          sourceToken.addressString,
        );
        if (sourceOnDest) {
          const alreadyInList = supported.some((t) =>
            isSameToken(t, sourceOnDest),
          );
          if (!alreadyInList) {
            supported.push(sourceOnDest);
          }
        }
      }

      setSupportedDestTokens(supported);

      // Auto-select if there's only one option
      if (destChain && supported.length === 1) {
        dispatch(setDestToken(supported[0].tuple));
      }
    };

    computeDestTokens();

    return () => {
      active = false;
    };
  }, [
    sourceToken,
    sourceChain,
    destChain,
    dispatch,
    lastTokenCacheUpdate,
    getOrFetchToken,
  ]);

  return {
    supportedDestTokens,
    isFetching,
  };
};

export default useComputeDestinationTokens;
