import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import { useMediaQuery } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import Button from 'components/v2/Button';
import { RootState } from 'store';
import { displayWalletAddress } from 'utils';
import { TransferWallet } from 'utils/wallet';

import { TransferSide } from 'config/types';
import WalletSidebar from './Sidebar';

const useStyles = makeStyles()((theme: any) => ({
  connectWallet: {
    padding: '8px 16px',
    borderRadius: '8px',
    height: '48px',
    margin: 'auto',
    maxWidth: '420px',
    width: '100%',
    boxShadow: 'none',
    backgroundColor: theme.palette.button.primary,
    color: theme.palette.button.primaryText,
    '&:disabled': {
      backgroundColor: theme.palette.button.disabled,
      color: theme.palette.button.disabledText,
    },
    '&:hover': {
      boxShadow: 'none',
      backgroundColor: theme.palette.button.hover,
    },
    '&:active': {
      boxShadow: 'none',
      backgroundColor: theme.palette.button.action,
      color: theme.palette.button.actionText,
    },
  },
  connected: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '8px',
    backgroundColor: theme.palette.button.primary,
    cursor: 'not-allowed',
    opacity: 0.7,
    margin: 'auto',
    maxWidth: '420px',
    width: '100%',
  },
}));

type Props = {
  side: TransferSide;
  type: TransferWallet;
  disabled?: boolean;
};

// Parent component to display Connect Wallet CTA
// and the sidebar for the list of available wallets.
const WalletConnector = (props: Props) => {
  const { disabled = false, type } = props;

  const theme = useTheme();

  const { classes } = useStyles();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const wallet = useSelector((state: RootState) => state.wallet[type]);

  const [isOpen, setIsOpen] = useState(false);

  const connectWallet = useCallback(
    async (popupState?: any) => {
      if (disabled) {
        return;
      }

      popupState?.close();
      setIsOpen(true);
    },
    [disabled],
  );

  const connected = useMemo(() => {
    if (!wallet?.address) {
      return null;
    }

    return (
      <div className={classes.connected}>{`Connected to ${displayWalletAddress(
        wallet.type,
        wallet.address,
      )}`}</div>
    );
  }, [classes.connected, wallet.address, wallet.type]);

  const disconnected = useMemo(() => {
    const button = (
      <span style={{ width: '100%' }}>
        <Button
          disableRipple
          variant="primary"
          className={classes.connectWallet}
          data-testid={`${props.side}-section-connect-wallet-button`}
          disabled={disabled}
          sx={{
            '&:disabled': {
              cursor: 'not-allowed',
              pointerEvents: 'all !important',
            },
          }}
          onClick={() => connectWallet()}
        >
          <Typography textTransform="none">
            {mobile
              ? props.side === 'source'
                ? 'Connect'
                : 'Select wallet'
              : `${props.side === 'source' ? 'Connect' : 'Select'} ${
                  props.side
                } wallet`}
          </Typography>
        </Button>
      </span>
    );

    if (disabled) {
      return (
        <Tooltip title={`Please select a ${props.side} network`}>
          {button}
        </Tooltip>
      );
    } else {
      return (
        <>
          {button}
          <WalletSidebar
            open={isOpen}
            type={props.type}
            onClose={() => {
              setIsOpen(false);
            }}
            showAddressInput={props.type === TransferWallet.RECEIVING}
          />
        </>
      );
    }
  }, [
    disabled,
    isOpen,
    mobile,
    props.side,
    props.type,
    classes.connectWallet,
    connectWallet,
  ]);

  if (wallet && wallet.address) {
    return connected;
  }

  return disconnected;
};

export default WalletConnector;
