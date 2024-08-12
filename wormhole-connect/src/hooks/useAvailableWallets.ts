import { useEffect, useState } from 'react';

import type { Context } from 'sdklegacy';
import { Chain } from '@wormhole-foundation/sdk';

import config from 'config';
import { WalletData, getWalletOptions } from 'utils/wallet';

type GetWalletsLoading = {
  state: 'loading';
};
type GetWalletsError = {
  state: 'error';
  error: string;
};
type GetWalletsResult = {
  state: 'result';
  options: WalletData[];
};

type GetWallets = GetWalletsLoading | GetWalletsError | GetWalletsResult;

type Props = {
  chain: Chain | undefined;
  supportedChains: Set<Context>;
};

type ReturnProps = {
  walletOptionsResult: GetWallets;
};

const FAILED_TO_LOAD_ERR =
  'Failed to load wallets. Please refresh and try again.';

export const useAvailableWallets = (props: Props): ReturnProps => {
  const { chain, supportedChains } = props;

  const [walletOptionsResult, setWalletOptionsResult] = useState<GetWallets>({
    state: 'loading',
  });

  useEffect(() => {
    let cancelled = false;
    async function getAvailableWallets() {
      if (!chain) {
        return [];
      }

      const chainConfig = config.chains[chain];

      if (chainConfig && supportedChains.has(chainConfig.context)) {
        return await getWalletOptions(chainConfig);
      } else {
        return [];
      }
    }
    (async () => {
      try {
        const options = await getAvailableWallets();
        if (!cancelled && options) {
          setWalletOptionsResult({
            state: 'result',
            options,
          });
        }
      } catch (e) {
        setWalletOptionsResult({ state: 'error', error: FAILED_TO_LOAD_ERR });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chain, supportedChains]);

  return {
    walletOptionsResult,
  };
};
