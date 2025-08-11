import type { WalletContextType } from 'contexts/wallet/WalletContext';
import WalletContext from 'contexts/wallet/WalletContext';
import { useContext } from 'react';

const useWalletProvider = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletProvider must be used within a WalletProvider');
  }
  return context;
};

export default useWalletProvider;
