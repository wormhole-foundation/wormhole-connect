import React from 'react';
import { AlgorandContextProvider } from './AlgorandWalletContext';
import { AptosWalletProvider } from './AptosWalletContext';
import BetaContextProvider from './InjectiveWalletContext';
import { EthereumProviderProvider } from './EthereumProviderContext';
import { NearContextProvider } from './NearWalletContext';
import { XplaWalletProvider } from './XplaWalletContext';
import { SolanaWalletProvider } from './SolanaWalletContext';
import { TerraWalletProvider } from './TerraWalletContext';
import { InjectiveWalletProvider } from './InjectiveWalletContext';

export type Props = {
  children: JSX.Element;
};

export const WalletProvider = ({ children }: Props) => {
  return (
    <BetaContextProvider>
      <SolanaWalletProvider>
        <EthereumProviderProvider>
          <TerraWalletProvider>
            <AlgorandContextProvider>
              <NearContextProvider>
                <XplaWalletProvider>
                  <AptosWalletProvider>
                    <InjectiveWalletProvider>
                      {children}
                    </InjectiveWalletProvider>
                  </AptosWalletProvider>
                </XplaWalletProvider>
              </NearContextProvider>
            </AlgorandContextProvider>
          </TerraWalletProvider>
        </EthereumProviderProvider>
      </SolanaWalletProvider>
    </BetaContextProvider>
  );
};

export default WalletProvider;
