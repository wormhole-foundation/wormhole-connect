import React from 'react';
import { Dialog, useTheme } from '@mui/material';
import WalletPickerHeader from './WalletPickerHeader';
import WalletPickerContent from './WalletPickerContent';
import type { TransferWallet } from 'utils/wallet';

interface WalletPickerModalProps {
  open: boolean;
  onCancel: () => void;
  onSelect: () => void;
  showAddressInput: boolean;
  title: React.ReactNode;
  walletType: TransferWallet;
}

function WalletPickerModal({
  open,
  onCancel,
  onSelect,
  showAddressInput,
  title,
  walletType,
}: WalletPickerModalProps) {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      slotProps={{
        paper: {
          sx: {
            width: '400px',
            maxHeight: '80vh',
            borderRadius: '8px',
            background: theme.palette.input.background,
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)', // Safari support
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.24)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        },
        root: {
          sx: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)', // Safari support
          },
        },
      }}
    >
      <WalletPickerHeader onClose={onCancel} title={title} />
      <WalletPickerContent
        onSelect={onSelect}
        walletType={walletType}
        showAddressInput={showAddressInput}
      />
    </Dialog>
  );
}

export default WalletPickerModal;
