import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import config from 'config';
import { setDestToken, setSupportedDestTokens } from 'store/transferInput';

import type { TokenConfig } from 'config/types';

import { Chain } from '@wormhole-foundation/sdk';

type Props = {
  sourceChain: Chain | undefined;
  sourceToken: string;
  destToken: string;
  destChain: Chain | undefined;
  route?: string;
};

type ReturnProps = {
  isFetching: boolean;
};

const useComputeDestinationTokens = (props: Props): ReturnProps => {
  const { sourceChain, destChain, sourceToken, destToken } = props;

  const dispatch = useDispatch();

  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (!destChain) {
      return;
    }

    let active = true;

    const computeDestTokens = async () => {
      let supported: Array<TokenConfig> = [];

      // Start fetching and setting all supported tokens
      setIsFetching(true);

      try {
        supported = await config.routes.allSupportedDestTokens(
          config.tokens[sourceToken],
          sourceChain,
          destChain,
        );
      } catch (e) {
        console.error(e);
      }

      dispatch(setSupportedDestTokens(supported));

      // Done fetching and setting all supported tokens
      setIsFetching(false);

      if (active && destChain && destToken !== '') {
        // check if the pre selected destToken is supported
        const isTokenSupported = supported.some((t) => t.key == destToken);
        if (!isTokenSupported) {
          // if not, clear the destToken
          dispatch(setDestToken(''));
        }
      } else if (destChain && supported.length === 1) {
        if (active) {
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
        if (active && key) {
          dispatch(setDestToken(key));
        }
      }
    };

    computeDestTokens();

    return () => {
      active = false;
    };
  }, [sourceToken, sourceChain, destChain, dispatch]);

  return {
    isFetching,
  };
};

export default useComputeDestinationTokens;
