import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import { Tooltip, useMediaQuery } from '@mui/material';

import { RootState } from 'store';
import { TransferWallet } from 'utils/wallet';

import { TransferSide } from 'config/types';
import WalletSidebar from './Sidebar';

type StyleProps = { disabled?: boolean };

const useStyles = makeStyles<StyleProps>()((theme: any, { disabled }) => ({
  connectWallet: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '8px',
    backgroundColor: theme.palette.button.primary,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.7 : 1.0,
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

  const theme = useTheme();

  const { classes } = useStyles({ disabled });
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
    return (
      <Tooltip
        title={
          'Please enter amount and select a route to initiate the transaction'
        }
      >
        <div className={classes.connected}>
          <div>Connected</div>
        </div>
      </Tooltip>
    );
  }, []);

  const disconnected = useMemo(() => {
    const button = (
      <div
        className={classes.connectWallet}
        onClick={() => connectWallet()}
        data-testid={`${props.side}-section-connect-wallet-button`}
      >
        <div>{mobile ? 'Connect' : `Connect ${props.side} wallet`}</div>
      </div>
    );

    if (disabled) {
      return (
        <Tooltip title={'Please select a network first'}>{button}</Tooltip>
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
          />
        </>
      );
    }
  }, [disabled, isOpen, mobile, props.side, props.type]);

  if (wallet && wallet.address) {
    return connected;
  }

  return disconnected;
};

export default WalletConnector;
