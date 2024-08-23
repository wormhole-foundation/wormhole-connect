import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import config from 'config';
import { setToken, setSupportedSourceTokens } from 'store/transferInput';

import type { Chain } from '@wormhole-foundation/sdk';
import type { TokenConfig } from 'config/types';

type Props = {
  sourceChain: Chain | undefined;
  sourceToken: string;
  destChain: Chain | undefined;
  destToken: string;
  route?: string;
};

type ReturnProps = {
  isFetching: boolean;
};

const useComputeSourceTokens = (props: Props): ReturnProps => {
  const { sourceChain, destChain, sourceToken, destToken, route } = props;

  const dispatch = useDispatch();

  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (!sourceChain) {
      return;
    }

    let active = true;

    const computeSrcTokens = async () => {
      let supported: Array<TokenConfig> = [];

      // Start fetching and setting all supported tokens
      setIsFetching(true);

      try {
        supported = await config.routes.allSupportedSourceTokens(
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

      // Done fetching and setting all supported tokens
      setIsFetching(false);
    };

    computeSrcTokens();

    return () => {
      active = false;
    };
    // IMPORTANT: do not include token in dependency array
  }, [route, sourceChain, destToken, dispatch]);

  return { isFetching };
};

export default useComputeSourceTokens;
