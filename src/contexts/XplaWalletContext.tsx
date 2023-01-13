import { NetworkInfo, WalletProvider } from "@xpla/wallet-provider";
import React from "react";
import { Props } from "./WalletContext";

const testnet: NetworkInfo = {
  name: "testnet",
  chainID: "cube_47-5",
  lcd: "https://cube-lcd.xpla.dev",
  walletconnectID: 0,
};

const mainnet: NetworkInfo = {
  name: "mainnet",
  chainID: "dimension_37-1",
  lcd: "https://dimension-lcd.xpla.dev",
  walletconnectID: 1,
};

const walletConnectChainIds: Record<number, NetworkInfo> = {
  0: testnet,
  1: mainnet,
};

export const XplaWalletProvider = ({
  children,
}: Props) => {
  return (
    <WalletProvider
      defaultNetwork={mainnet}
      walletConnectChainIds={walletConnectChainIds}
    >
      {children}
    </WalletProvider>
  );
};
