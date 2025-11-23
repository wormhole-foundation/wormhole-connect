import React, { useMemo } from 'react';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { WalletIcon } from 'lucide-react';
import Box from '@mui/material/Box';

import { displayWalletAddress } from 'utils';
import type { WalletData } from 'store/wallet';

interface WalletAddressProps {
  isDisabled: boolean;
  wallet: WalletData;
}

function WalletAddress({ isDisabled, wallet }: WalletAddressProps) {
  const hasWallet = !!wallet?.address;
  const theme = useTheme();

  const address = hasWallet
    ? displayWalletAddress(wallet.type, wallet.address)
    : 'Not connected';

  const styles = useMemo(
    () => ({
      container: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        opacity: 1.0,
        ...(hasWallet && {
          border: `1px solid ${theme.palette.input.border}`,
          borderRadius: '16px',
          padding: '2px 8px',
          cursor: 'pointer',
          '&:hover': {
            borderColor: theme.palette.primary.main,
          },
        }),
      },
      walletAddress: {
        color: theme.palette.text.secondary,
        textTransform: 'uppercase',
      },
      greenDot: {
        width: '5px',
        height: '5px',
        borderRadius: '50%',
        backgroundColor: '#4caf50',
      },
      disabled: {
        opacity: '0.6',
        cursor: 'default',
        pointerEvents: 'none' as const,
      },
    }),
    [
      hasWallet,
      theme.palette.input.border,
      theme.palette.primary.main,
      theme.palette.text.secondary,
    ],
  );

  return (
    <Box sx={[styles.container, isDisabled && styles.disabled]}>
      <Typography sx={styles.walletAddress} fontSize={12} fontWeight={400}>
        {address}
      </Typography>
      <WalletIcon size={14} />
      {hasWallet && <div style={styles.greenDot} />}
    </Box>
  );
}

export default WalletAddress;
