import { useEffect, useState } from 'react';

import { Chain, chainToPlatform, Platform } from '@wormhole-foundation/sdk';

import config from 'config';
import { WalletData, getWalletOptions } from 'utils/wallet';

type WalletOptions = {
  state: 'result' | 'loading' | 'error';
  options?: WalletData[];
  error?: string;
};

type Props = {
  chain: Chain | undefined;
  supportedChains: Set<Platform>;
};

type ReturnProps = {
  walletOptionsResult: WalletOptions;
};

const FAILED_TO_LOAD_ERR =
  'Failed to load wallets. Please refresh and try again.';

export const useAvailableWallets = (props: Props): ReturnProps => {
  const { chain, supportedChains } = props;

  const [walletOptionsResult, setWalletOptionsResult] = useState<WalletOptions>(
    {
      state: 'loading',
    },
  );

  useEffect(() => {
    let cancelled = false;
    async function getAvailableWallets() {
      if (!chain) {
        return [];
      }

      const chainConfig = config.chains[chain];

      if (
        chainConfig &&
        supportedChains.has(chainToPlatform(chainConfig.sdkName))
      ) {
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
        console.error(`Error loading wallet options for ${chain}: ${e}`);
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
