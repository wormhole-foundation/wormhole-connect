import React from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import type { InternalWalletProvider } from 'utils/wallet/InternalWalletProvider';
import { isInternalProvider } from 'utils/wallet/InternalWalletProvider';
import useWalletProvider from 'hooks/useWalletProvider';
import { TransferWallet } from 'utils/wallet';
import WalletPickerBottomSheet from './WalletPickerBottomSheet';
import WalletPickerModal from './WalletPickerModal';

interface WalletPickerProps {
  isAddressInputVisible: boolean;
  open: boolean;
  setIsOpen: (open: boolean) => void;
  walletType: TransferWallet;
}

function WalletPicker({
  isAddressInputVisible,
  open,
  setIsOpen,
  walletType,
}: WalletPickerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { walletProvider } = useWalletProvider();
  const internalWalletProvider = walletProvider as InternalWalletProvider;

  const showAddressInput =
    isAddressInputVisible && walletType === TransferWallet.RECEIVING;

  const handleCancel = React.useCallback(() => {
    internalWalletProvider.onWalletSelectCancelled();
    setIsOpen(false);
  }, [internalWalletProvider, setIsOpen]);

  const handleSelect = React.useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  const handleOpen = React.useCallback(() => {
    setIsOpen(true);
  }, [setIsOpen]);

  if (!isInternalProvider(walletProvider)) {
    return null;
  }

  const title =
    walletType === TransferWallet.RECEIVING
      ? 'Select destination wallet'
      : 'Connect a wallet';

  if (isMobile) {
    return (
      <WalletPickerBottomSheet
        open={open}
        onCancel={handleCancel}
        onSelect={handleSelect}
        onOpen={handleOpen}
        showAddressInput={showAddressInput}
        walletType={walletType}
        title={title}
      />
    );
  }

  return (
    <WalletPickerModal
      open={open}
      onCancel={handleCancel}
      onSelect={handleSelect}
      showAddressInput={showAddressInput}
      walletType={walletType}
      title={title}
    />
  );
}

export default React.memo(WalletPicker);
