import { NetworkInfo, WalletProvider } from "@terra-money/wallet-provider";
import React from "react";
const { REACT_APP_ENV } = process.env;
import { Props } from "./WalletContext";

const mainnet: NetworkInfo = {
  name: "mainnet",
  chainID: "phoenix-1",
  lcd: "https://phoenix-lcd.terra.dev",
  walletconnectID: 1,
};

const classic: NetworkInfo = {
  name: "classic",
  chainID: "columbus-5",
  lcd: "https://columbus-lcd.terra.dev",
  walletconnectID: 2,
}

const testnet: NetworkInfo = {
  name: "testnet",
  chainID: "pisco-1",
  lcd: "https://pisco-lcd.terra.dev",
  walletconnectID: 0,
};

const walletConnectChainIds: Record<number, NetworkInfo> = {
  0: testnet,
  1: mainnet,
  2: classic,
};

export const TerraWalletProvider = ({
  children,
}: Props) => {
  return (
    <WalletProvider
      defaultNetwork={REACT_APP_ENV === "TESTNET" ? testnet : mainnet}
      walletConnectChainIds={walletConnectChainIds}
    >
      {children}
    </WalletProvider>
  );
};
