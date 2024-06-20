import React, { useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
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

type StyleProps = { disabled?: boolean };

const useStyles = makeStyles<StyleProps>()((theme: any) => ({
  connectWallet: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    opacity: 1.0,
  },
  walletIcon: {
    width: '24px',
    height: '24px',
  },
  down: {
    marginRight: '-8px',
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

// Renders the connected state for a wallet given the type (sending | receiving)
const ConnectedWallet = (props: Props) => {
  const dispatch = useDispatch();

  const { classes } = useStyles({});

  const wallet = useSelector((state: RootState) => state.wallet[props.type]);

  const [isOpen, setIsOpen] = useState(false);

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
  }, [wallet.address]);

  const disconnectWallet = useCallback(() => {
    dispatch(disconnectFromStore(props.type));
    popupState?.close();
  }, [props.type]);

  if (!wallet?.address) {
    return <></>;
  }

  return (
    <>
      <div className={classes.connectWallet} {...bindTrigger(popupState)}>
        <WalletIcons name={wallet.name} icon={wallet.icon} height={24} />
        <Typography fontSize={14}>
          {displayWalletAddress(wallet.type, wallet.address)}
        </Typography>
        <DownIcon className={classes.down} />
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
          {config.explorer ? (
            <ListItem>
              <ExplorerLink
                address={wallet.address}
                href={config.explorer.href}
                target={config.explorer.target}
                label={config.explorer.label}
              />
            </ListItem>
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
