import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import config from 'config';
import { setDestToken, setSupportedDestTokens } from 'store/transferInput';

import type { TokenConfig } from 'config/types';

import { Chain } from '@wormhole-foundation/sdk';

type Props = {
  sourceChain: Chain | undefined;
  sourceToken: string;
  destChain: Chain | undefined;
  route?: string;
};

type ReturnProps = {
  isFetching: boolean;
};

const useComputeDestinationTokens = (props: Props): ReturnProps => {
  const { sourceChain, destChain, sourceToken } = props;

  const dispatch = useDispatch();

  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (!destChain) {
      return;
    }

    let canceled = false;

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
  }, [sourceToken, sourceChain, destChain, dispatch]);

  return {
    isFetching,
  };
};

export default useComputeDestinationTokens;
