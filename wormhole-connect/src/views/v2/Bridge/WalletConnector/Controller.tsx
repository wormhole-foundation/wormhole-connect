import React, { useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';

import {
  usePopupState,
  bindTrigger,
  bindPopover,
} from 'material-ui-popup-state/hooks';

import { RootState } from 'store';
import { disconnectWallet as disconnectFromStore } from 'store/wallet';
import { TransferWallet } from 'utils/wallet';
import { copyTextToClipboard, displayWalletAddress } from 'utils';

import DownIcon from 'icons/Down';
import WalletIcons from 'icons/WalletIcons';
import config from 'config';
import ExplorerLink from './ExplorerLink';
import WalletSidebar from './Sidebar';
import { Tooltip } from '@mui/material';

const useStyles = makeStyles()((theme: any) => ({
  connectWallet: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 0 4px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    opacity: 1.0,
  },
  walletAddress: {
    color: theme.palette.primary.main,
    marginLeft: '8px',
  },
  down: {
    color: theme.palette.primary.main,
    transition: 'transform 0.15s ease-in',
    strokeWidth: '2px',
  },
  up: {
    transform: 'scaleY(-1)',
  },
  dropdown: {
    backgroundColor: theme.palette.popover.background,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '8px',
  },
  dropdownItem: {
    borderRadius: '8px',
    padding: '16px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.popover.secondary,
    },
  },
}));

type Props = {
  type: TransferWallet;
};

const COPY_MESSAGE_TIMOUT = 1000;

// Renders the connected state for a wallet given the type (sending | receiving)
const ConnectedWallet = (props: Props) => {
  const dispatch = useDispatch();

  const { classes } = useStyles();

  const wallet = useSelector((state: RootState) => state.wallet[props.type]);

  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const popupState = usePopupState({
    variant: 'popover',
    popupId: `connected-wallet-popover-${props.type}`,
  });

  const connectWallet = useCallback(() => {
    popupState?.close();
    setIsOpen(true);
  }, []);

  const copyAddress = useCallback(() => {
    copyTextToClipboard(wallet.address);
    popupState?.close();
    setIsCopied(true);
  }, [wallet.address]);

  const disconnectWallet = useCallback(() => {
    dispatch(disconnectFromStore(props.type));
    popupState?.close();
  }, [props.type]);

  useEffect(() => {
    if (isCopied) {
      setTimeout(() => {
        setIsCopied(false);
      }, COPY_MESSAGE_TIMOUT);
    }
  }, [isCopied]);

  if (!wallet?.address) {
    return <></>;
  }

  return (
    <>
      <div className={classes.connectWallet} {...bindTrigger(popupState)}>
        <WalletIcons name={wallet.name} icon={wallet.icon} height={20} />
        <Tooltip title="Copied" open={isCopied} placement="top" arrow>
          <Typography
            className={classes.walletAddress}
            fontSize={14}
            fontWeight={700}
          >
            {displayWalletAddress(wallet.type, wallet.address)}
          </Typography>
        </Tooltip>
        <DownIcon
          className={`${classes.down} ${popupState.isOpen ? classes.up : ''}`}
        />
      </div>
      <Popover
        {...bindPopover(popupState)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <List>
          <ListItemButton onClick={copyAddress}>
            <Typography fontSize={14}>Copy address</Typography>
          </ListItemButton>
          {config.ui.explorer ? (
            <ExplorerLink
              address={wallet.address}
              href={config.ui.explorer.href}
              target={config.ui.explorer.target}
              label={config.ui.explorer.label}
            />
          ) : null}
          <ListItemButton onClick={connectWallet}>
            <Typography fontSize={14}>Change wallet</Typography>
          </ListItemButton>
          <ListItemButton onClick={disconnectWallet}>
            <Typography fontSize={14}>Disconnect</Typography>
          </ListItemButton>
        </List>
      </Popover>
      <WalletSidebar
        open={isOpen}
        type={props.type}
        onClose={() => {
          setIsOpen(false);
        }}
      />
    </>
  );
};

export default ConnectedWallet;
