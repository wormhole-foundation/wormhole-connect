import { Chain } from '@wormhole-foundation/sdk';
import config from 'config';
import { useEffect, useState } from 'react';

type ExternalSearch = {
  hasExternalSearch: boolean;
  txHash?: string;
  chainName?: Chain;
  clear: () => void;
};

export function useExternalSearch(): ExternalSearch {
  const [hasExternalSearch, setHasExternalSearchtate] =
    useState<boolean>(false);
  const [txHash, setTxHash] = useState<string>();
  const [chainName, setChainName] = useState<Chain>();
  useEffect(() => {
    if (config.ui.searchTx?.chainName && config.ui.searchTx?.txHash) {
      const chainName = config.ui.searchTx.chainName.toLowerCase() as Chain;

      const validChains = config.chainsArr
        .filter((chain) => chain.key !== 'Wormchain')
        .map((chain) => chain.key);

      if (validChains.includes(chainName)) {
        setHasExternalSearchtate(true);
        setTxHash(config.ui.searchTx.txHash);
        setChainName(chainName);
      }
    }
  }, []);

  return {
    hasExternalSearch,
    txHash,
    chainName,
    clear: () => {
      setHasExternalSearchtate(false);
      setTxHash(undefined);
      setChainName(undefined);
      if (config.ui.searchTx) {
        config.ui.searchTx.chainName = undefined;
        config.ui.searchTx.txHash = undefined;
      }
    },
  };
}
