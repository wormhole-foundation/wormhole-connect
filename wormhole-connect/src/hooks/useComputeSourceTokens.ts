import config from 'config';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { setToken, setSupportedSourceTokens } from 'store/transferInput';

import type { Route, TokenConfig } from 'config/types';

import RouteOperator from 'routes/operator';

import { Chain } from '@wormhole-foundation/sdk';

type Props = {
  sourceChain: Chain | undefined;
  sourceToken: string;
  destChain: Chain | undefined;
  destToken: string;
  route: Route | undefined;
};

export const useComputeSourceTokens = (props: Props): void => {
  const { sourceChain, destChain, sourceToken, destToken, route } = props;

  const dispatch = useDispatch();

  useEffect(() => {
    if (!sourceChain) {
      return;
    }

    let active = true;

    const computeSrcTokens = async () => {
      let supported: Array<TokenConfig> = [];

      try {
        supported = await RouteOperator.allSupportedSourceTokens(
          config.tokens[destToken],
          sourceChain,
          destChain,
        );
      } catch (e) {
        console.error(e);
      }

      if (active) {
        dispatch(setSupportedSourceTokens(supported));
        const isTokenSupported =
          sourceToken && supported.some((t) => t.key === sourceToken);
        if (!isTokenSupported) {
          dispatch(setToken(''));
        }
        if (supported.length === 1 && sourceToken === '') {
          dispatch(setToken(supported[0].key));
        }
      }
    };

    computeSrcTokens();

    return () => {
      active = false;
    };
    // IMPORTANT: do not include token in dependency array
  }, [route, sourceChain, destToken, dispatch]);
};
