import { Chain } from '@wormhole-foundation/sdk';
import config from 'config';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store';
import { clearSearch, setSearch } from 'store/search';

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
      const chainName = config.ui.searchTx.chainName.toLowerCase();
      const cfg = config.chainsArr.find(
        (cfg) => cfg.sdkName.toLowerCase() === chainName,
      );

      if (cfg) {
        dispatch(
          setSearch({
            txHash: config.ui.searchTx.txHash,
            chain: cfg.sdkName,
          }),
        );
      }
    }
  }, [dispatch]);

  return {
    hasExternalSearch: !!(txHash && chain),
    txHash,
    chain,
    clear: () => {
      dispatch(clearSearch());
      if (config.ui.searchTx) {
        config.ui.searchTx.chainName = undefined;
        config.ui.searchTx.txHash = undefined;
      }
    },
  };
}
