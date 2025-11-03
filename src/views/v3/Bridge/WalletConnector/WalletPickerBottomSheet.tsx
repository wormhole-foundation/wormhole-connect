import React from 'react';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';

import WalletPickerHeader from './WalletPickerHeader';
import WalletPickerContent from './WalletPickerContent';
import type { TransferWallet } from 'utils/wallet';

interface WalletPickerBottomSheetProps {
  open: boolean;
  onCancel: () => void;
  onOpen: () => void;
  onSelect: () => void;
  showAddressInput: boolean;
  title: React.ReactNode;
  walletType: TransferWallet;
}

function WalletPickerBottomSheet({
  open,
  onCancel,
  onOpen,
  onSelect,
  showAddressInput,
  title,
  walletType,
}: WalletPickerBottomSheetProps) {
  const theme = useTheme();

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      slotProps={{
        paper: {
          sx: {
            background: theme.palette.input.background,
            borderRadius: '8px',
            height: 'calc(100vh - 40px)', // Force full-height on small mobile devices with 40px padding at the top
            maxWidth: '100vw', // Force full-width on small mobile devices
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        },
      }}
      transitionDuration={200}
      onOpen={onOpen}
      onClose={onCancel}
    >
      <Stack alignItems="center" paddingBottom="4px" paddingTop="8px">
        <Box
          sx={{
            width: '40px',
            height: '5px',
            backgroundColor: theme.palette.text.secondary,
            borderRadius: '8px',
          }}
        />
      </Stack>
      <WalletPickerHeader onClose={onCancel} title={title} />
      <WalletPickerContent
        onSelect={onSelect}
        walletType={walletType}
        showAddressInput={showAddressInput}
      />
    </SwipeableDrawer>
  );
}

export default React.memo(WalletPickerBottomSheet);
