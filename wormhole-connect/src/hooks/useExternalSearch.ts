import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { coalesceChainName } from '@certusone/wormhole-sdk';
import config from 'config';
import { useEffect, useState } from 'react';

type ExternalSearch = {
  hasExternalSearch: boolean;
  txHash?: string;
  chainName?: ChainName;
  clear: () => void;
};

export function useExternalSearch(): ExternalSearch {
  const [hasExternalSearch, setHasExternalSearchtate] =
    useState<boolean>(false);
  const [txHash, setTxHash] = useState<string>();
  const [chainName, setChainName] = useState<ChainName>();
  useEffect(() => {
    if (config.searchTx?.chainName && config.searchTx?.txHash) {
      const chainName = coalesceChainName(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config.searchTx.chainName as any,
      ) as ChainName;

      const validChains = config.chainsArr
        .filter((chain) => chain.key !== 'wormchain')
        .map((chain) => chain.key);

      if (validChains.includes(chainName)) {
        setHasExternalSearchtate(true);
        setTxHash(config.searchTx.txHash);
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
      if (config.searchTx) {
        config.searchTx.chainName = undefined;
        config.searchTx.txHash = undefined;
      }
    },
  };
}
