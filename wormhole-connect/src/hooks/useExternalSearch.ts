import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { coalesceChainName } from '@certusone/wormhole-sdk';
import { CHAINS_ARR, SEARCH_TX } from 'config';
import { useEffect, useState } from 'react';

const VALID_CHAINS = CHAINS_ARR.filter(
  (chain) => chain.key !== 'wormchain',
).map((chain) => chain.key);

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
    if (SEARCH_TX?.chainName && SEARCH_TX?.txHash) {
      const chainName = coalesceChainName(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        SEARCH_TX.chainName as any,
      ) as ChainName;
      if (VALID_CHAINS.includes(chainName)) {
        setHasExternalSearchtate(true);
        setTxHash(SEARCH_TX.txHash);
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
      if (SEARCH_TX) {
        SEARCH_TX.chainName = undefined;
        SEARCH_TX.txHash = undefined;
      }
    },
  };
}
