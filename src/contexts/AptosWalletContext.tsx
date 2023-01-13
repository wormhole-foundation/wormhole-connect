import React, { useMemo } from "react";
import {
  AptosSnapAdapter,
  AptosWalletAdapter,
  BitkeepWalletAdapter,
  // BloctoWalletAdapter,
  FewchaWalletAdapter,
  FletchWalletAdapter,
  MartianWalletAdapter,
  NightlyWalletAdapter,
  PontemWalletAdapter,
  RiseWalletAdapter,
  SpikaWalletAdapter,
  TokenPocketWalletAdapter,
  useWallet,
  WalletAdapterNetwork,
  WalletProvider,
} from "@manahippo/aptos-wallet-adapter";
import { Props } from './WalletContext';
const { REACT_APP_ENV } = process.env;

export const useAptosContext = useWallet;

export const AptosWalletProvider = ({
  children,
}: Props) => {
  const wallets = useMemo(() => {
    const network =
      REACT_APP_ENV === "MAINNET"
        ? WalletAdapterNetwork.Mainnet
        : WalletAdapterNetwork.Testnet;
    return [
      new AptosWalletAdapter(),
      new MartianWalletAdapter(),
      new RiseWalletAdapter(),
      new NightlyWalletAdapter(),
      new PontemWalletAdapter(),
      new FletchWalletAdapter(),
      new FewchaWalletAdapter(),
      new SpikaWalletAdapter(),
      new AptosSnapAdapter({ network }),
      new BitkeepWalletAdapter(),
      new TokenPocketWalletAdapter(),
      // new BloctoWalletAdapter(
      //   network !== WalletAdapterNetwork.Devnet
      //     ? {
      //         network,
      //       }
      //     : undefined
      // ),
    ];
  }, []);
  return (
    <WalletProvider
      wallets={wallets}
      onError={(error: Error) => {
        console.log("wallet errors: ", error);
      }}
    >
      {children}
    </WalletProvider>
  );
};
