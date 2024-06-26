import config from 'config';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { setToken, setSupportedSourceTokens } from 'store/transferInput';

import type { Route } from 'config/types';
import type { ChainName } from 'sdklegacy';

import RouteOperator from 'routes/operator';

type Props = {
  sourceChain: ChainName | undefined;
  sourceToken: string;
  destChain: ChainName | undefined;
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
      const supported = await RouteOperator.allSupportedSourceTokens(
        config.tokens[destToken],
        sourceChain,
        destChain,
      );
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
