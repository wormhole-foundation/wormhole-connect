import config from 'config';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { BigNumber } from 'ethers';
import { setReceiverNativeBalance } from 'store/transferInput';

import type { WalletData } from 'store/wallet';
import type { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';

import { getTokenDecimals } from 'utils';
import { toChainId } from 'utils/sdk';
import { toDecimals } from 'utils/balance';

type Props = {
  sourceChain: ChainName | undefined;
  destChain: ChainName | undefined;
  receiving: WalletData;
};

export const useComputeReceiverNativeBalance = (props: Props): void => {
  const { sourceChain, destChain, receiving } = props;
  const dispatch = useDispatch();
  // check destination native balance
  useEffect(() => {
    if (!sourceChain || !destChain || !receiving.address) {
      return;
    }

    const chainConfig = config.chains?.[destChain];

    config.wh
      .getNativeBalance(receiving.address, destChain)
      .then((res: BigNumber) => {
        const tokenConfig = chainConfig?.gasToken
          ? config.tokens[chainConfig.gasToken]
          : undefined;
        if (!tokenConfig)
          throw new Error('Could not get native gas token config');
        const decimals = getTokenDecimals(
          toChainId(tokenConfig.nativeChain),
          'native',
        );
        dispatch(setReceiverNativeBalance(toDecimals(res, decimals, 6)));
      });
  }, [sourceChain, destChain, receiving.address, dispatch]);
};
