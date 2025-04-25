import { Chain } from '@wormhole-foundation/sdk';
import config from 'config';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store';
import { clearExternalSearch, setExternalSearch } from 'store/search';

type ExternalSearch = {
  hasExternalSearch?: boolean;
  txHash?: string;
  chain?: Chain;
  clear: () => void;
};

export function useExternalSearch(): ExternalSearch {
  const dispatch = useDispatch();
  const { txHash, chain } = useSelector((state: RootState) => state.search);

  useEffect(() => {
    if (config.ui.searchTx?.chainName && config.ui.searchTx?.txHash) {
      const chain = config.ui.searchTx.chainName.toLowerCase() as Chain;
      const isConfigured = config.chainsArr.some(
        (cfg) => cfg.sdkName === chain,
      );

      if (isConfigured) {
        dispatch(
          setExternalSearch({
            txHash: config.ui.searchTx.txHash,
            chain,
          }),
        );
      }
    }
  }, []);

  return {
    hasExternalSearch: !!(txHash && chain),
    txHash,
    chain,
    clear: () => {
      dispatch(clearExternalSearch());
      if (config.ui.searchTx) {
        config.ui.searchTx.chainName = undefined;
        config.ui.searchTx.txHash = undefined;
      }
    },
  };
}
