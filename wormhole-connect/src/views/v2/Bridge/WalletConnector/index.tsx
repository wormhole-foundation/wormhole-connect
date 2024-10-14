import React, { useMemo } from 'react';
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
import { useWalletManager } from 'utils/wallet/wallet-manager';

import { TransferSide } from 'config/types';

const useStyles = makeStyles()((theme: any) => ({
  connectWallet: {
    padding: '8px 16px',
    borderRadius: '8px',
    margin: 'auto',
    maxWidth: '420px',
    width: '100%',
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
// and the sidebar for the lsit of available wallets.
const WalletConnector = (props: Props) => {
  const { disabled = false, type } = props;
  const { connectWallet } = useWalletManager()

  const theme = useTheme();

  const { classes } = useStyles();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const wallet = useSelector((state: RootState) => state.wallet[type]);

  const connected = useMemo(() => {
    return (
      <div className={classes.connected}>{`Connected to ${displayWalletAddress(
        wallet.type,
        wallet.address,
      )}`}</div>
    );
  }, []);

  const disconnected = useMemo(() => {
    const button = (
      <span style={{ width: '100%' }}>
        <Button
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
          onClick={() => connectWallet(type)}
        >
          <Typography textTransform="none">
            {mobile ? 'Connect' : `Connect ${props.side} wallet`}
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
        </>
      );
    }
  }, [disabled, mobile, props.side, props.type, connectWallet]);

  if (wallet && wallet.address) {
    return connected;
  }

  return disconnected;
};

export default WalletConnector;
