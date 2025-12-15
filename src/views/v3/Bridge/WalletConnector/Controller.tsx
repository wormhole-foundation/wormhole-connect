import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import {
  usePopupState,
  bindTrigger,
  bindPopover,
} from 'material-ui-popup-state/hooks';

import type { RootState } from 'store';
import { TransferWallet } from 'utils/wallet';
import { copyTextToClipboard } from 'utils';
import useWalletProvider from 'hooks/useWalletProvider';

import { useConfig } from 'contexts/ConfigContext';
import ExplorerLink from './ExplorerLink';
import { ListItemIcon, Tooltip } from '@mui/material';
import WalletPicker from './WalletPicker';
import WalletAddress from './WalletAddress';
import { CopyIcon, Repeat2Icon, UnplugIcon } from 'lucide-react';

type Props = {
  type: TransferWallet;
};

const COPY_MESSAGE_TIMOUT = 1000;

// Renders the connected state for a wallet given the type (sending | receiving)
const ConnectedWallet = (props: Props) => {
  const config = useConfig();
  const { connectWallet, disconnectWallet } = useWalletProvider();

  const { isTransactionInProgress, fromChain, toChain } = useSelector(
    (state: RootState) => state.transferInput,
  );

  const wallet = useSelector((state: RootState) => state.wallet[props.type]);
  const isSourceWallet = props.type === TransferWallet.SENDING;
  const selectedChain = isSourceWallet ? fromChain : toChain;

  const isChangeWalletVisible = isSourceWallet
    ? !config.ui.hideSourceChangeWallet
    : !config.ui.hideDestinationChangeWallet;

  const isDisconnectWalletVisible = isSourceWallet
    ? !config.ui.hideSourceDisconnectWallet
    : !config.ui.hideDestinationDisconnectWallet;

  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const popupState = usePopupState({
    variant: 'popover',
    popupId: `connected-wallet-popover-${props.type}`,
  });

  const handleChangeWallet = useCallback(async () => {
    if (!selectedChain) return;
    popupState?.close();
    setIsOpen(true);
    await connectWallet(selectedChain, props.type);
  }, [selectedChain, props.type, connectWallet, popupState]);

  const copyAddress = useCallback(() => {
    copyTextToClipboard(wallet.address);
    popupState?.close();
    setIsCopied(true);
  }, [popupState, wallet.address]);

  const handleDisconnectWallet = useCallback(async () => {
    if (!selectedChain) return;
    await disconnectWallet(selectedChain, props.type);
    popupState?.close();
  }, [disconnectWallet, popupState, selectedChain, props.type]);

  useEffect(() => {
    if (isCopied) {
      setTimeout(() => {
        setIsCopied(false);
      }, COPY_MESSAGE_TIMOUT);
    }
  }, [isCopied]);

  const popupTrigger = isTransactionInProgress ? {} : bindTrigger(popupState);

  return (
    <>
      <Tooltip title="Copied" open={isCopied} placement="top" arrow>
        <Box {...popupTrigger}>
          <WalletAddress wallet={wallet} isDisabled={isTransactionInProgress} />
        </Box>
      </Tooltip>
      {!!wallet.address && (
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
          slotProps={{
            paper: {
              sx: { marginTop: '4px' },
            },
          }}
          sx={{
            '& .MuiTypography-root': {
              fontSize: 14,
              flexGrow: 1,
            },
            '& .MuiListItemIcon-root': {
              justifyContent: 'flex-end',
            },
          }}
        >
          <List>
            <ListItemButton onClick={copyAddress}>
              <Typography>Copy address</Typography>
              <ListItemIcon>
                <CopyIcon size={14} />
              </ListItemIcon>
            </ListItemButton>
            {config.ui.explorer ? (
              <ExplorerLink
                address={wallet.address}
                href={config.ui.explorer.href}
                target={config.ui.explorer.target}
                label={config.ui.explorer.label}
              />
            ) : null}
            {isChangeWalletVisible && (
              <ListItemButton onClick={handleChangeWallet}>
                <Typography>Change wallet</Typography>
                <ListItemIcon>
                  <Repeat2Icon size={14} />
                </ListItemIcon>
              </ListItemButton>
            )}
            {isDisconnectWalletVisible && (
              <ListItemButton onClick={handleDisconnectWallet}>
                <Typography>Disconnect</Typography>
                <ListItemIcon>
                  <UnplugIcon size={14} />
                </ListItemIcon>
              </ListItemButton>
            )}
          </List>
        </Popover>
      )}
      <WalletPicker
        open={isOpen}
        walletType={props.type}
        setIsOpen={setIsOpen}
        isAddressInputVisible
      />
    </>
  );
};

export default ConnectedWallet;
