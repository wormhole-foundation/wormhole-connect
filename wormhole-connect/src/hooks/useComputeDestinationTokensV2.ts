import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import config from 'config';
import { setDestToken } from 'store/transferInput';

import type { Route, TokenConfig } from 'config/types';
import type { ChainName } from 'sdklegacy';

import RouteOperator from 'routes/operator';

type Props = {
  sourceChain: ChainName | undefined;
  sourceToken: string;
  destChain: ChainName | undefined;
  route: Route | undefined;
};

type returnProps = {
  allSupportedTokens: Array<TokenConfig>;
  supportedTokens: Array<TokenConfig>;
  isFetching: boolean;
};

const useComputeDestinationTokensV2 = (props: Props): returnProps => {
  const { sourceChain, destChain, sourceToken, route } = props;

  const dispatch = useDispatch();

  const [allSupportedTokens, setAllSupportedTokens] = useState<
    Array<TokenConfig>
  >([]);
  const [supportedTokens, setSupportedTokens] = useState<Array<TokenConfig>>(
    [],
  );
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (!destChain) {
      return;
    }

    let canceled = false;

    const computeDestTokens = async () => {
      let supported: Array<TokenConfig> = [];
      let allSupported: Array<TokenConfig> = [];

      // Start fetching scoped-down and all supported tokens
      setIsFetching(true);

      try {
        supported = await RouteOperator.allSupportedDestTokens(
          config.tokens[sourceToken],
          sourceChain,
          destChain,
        );

        allSupported = await RouteOperator.allSupportedDestTokens(
          undefined,
          sourceChain,
          destChain,
        );
      } catch (e) {
        console.error(e);
      }

      if (sourceToken) {
        // If any of the tokens are native to the chain, only select those.
        // This is to avoid users inadvertently receiving wrapped versions of the token.
        const nativeTokens = supported.filter(
          (t) => t.nativeChain === destChain,
        );
        if (nativeTokens.length > 0) {
          supported = nativeTokens;
        }
      }

      setSupportedTokens(supported);
      setAllSupportedTokens(allSupported);

      // Done fetching scoped-down and all supported tokens
      setIsFetching(false);

      if (destChain && supported.length === 1) {
        if (!canceled) {
          dispatch(setDestToken(supported[0].key));
        }
      }

      // If all the supported tokens are the same token
      // select the native version for applicable tokens
      const symbols = supported.map((t) => t.symbol);
      if (
        destChain &&
        symbols.every((s) => s === symbols[0]) &&
        ['USDC', 'tBTC'].includes(symbols[0])
      ) {
        const key = supported.find(
          (t) =>
            t.symbol === symbols[0] &&
            t.nativeChain === t.tokenId?.chain &&
            t.nativeChain === destChain,
        )?.key;
        if (!canceled && key) {
          dispatch(setDestToken(key));
        }
      }
    };

    computeDestTokens();

    return () => {
      canceled = true;
    };
  }, [route, sourceToken, sourceChain, destChain, dispatch]);

  return {
    allSupportedTokens,
    supportedTokens,
    isFetching,
  };
};

export default useComputeDestinationTokensV2;
