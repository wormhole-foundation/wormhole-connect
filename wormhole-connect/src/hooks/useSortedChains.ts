import { ChainConfig } from "config/types";
import { useFetchChainTotalBalance } from "./useFetchChainTotalBalance";
import { useEffect, useMemo } from "react";
import { isDisabledChain } from "store/transferInput";
import { WalletData } from "store/wallet";

export const useSortedChains = (wallet: WalletData, chains: ChainConfig[]): void => {
  const walletSupportedChains = useMemo(() => {
    return chains.filter(chain => !isDisabledChain(chain.key, wallet));
  }, [wallet.address, chains]);

  console.log("supchain", walletSupportedChains);

  const totalFetcher = useFetchChainTotalBalance(wallet.address, walletSupportedChains);

  useEffect(() => {
    console.log("fetch");
    totalFetcher().then(a => console.log("total", a));
  } ,[totalFetcher] );


};
