import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';

import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

import {
  usePopupState,
  bindTrigger,
  bindPopover,
} from 'material-ui-popup-state/hooks';

import type { RootState } from 'store';
import { TransferWallet } from 'utils/wallet';
import { copyTextToClipboard, displayWalletAddress } from 'utils';
import useWalletProvider from 'hooks/useWalletProvider';

import config from 'config';
import ExplorerLink from './ExplorerLink';
import WalletSidebar from './Sidebar';
import { Tooltip } from '@mui/material';

type Props = {
  type: TransferWallet;
};

const COPY_MESSAGE_TIMOUT = 1000;

// Renders the connected state for a wallet given the type (sending | receiving)
const ConnectedWallet = (props: Props) => {
  const theme = useTheme();
  const { connectWallet, disconnectWallet } = useWalletProvider();

  const styles = useMemo(
    () => ({
      connectWallet: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '8px',
        cursor: 'pointer',
        opacity: 1.0,
      },
      walletAddress: {
        color: theme.palette.text.secondary,
        marginLeft: '8px',
      },
      disabled: {
        opacity: '0.6',
        cursor: 'default',
        pointerEvents: 'none' as const,
      },
    }),
    [theme],
  );

  const { isTransactionInProgress, fromChain, toChain } = useSelector(
    (state: RootState) => state.transferInput,
  );

  const wallet = useSelector((state: RootState) => state.wallet[props.type]);

  const selectedChain =
    props.type === TransferWallet.SENDING ? fromChain : toChain;

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
      {!wallet?.address ? null : (
        <>
          <Box
            sx={[
              styles.connectWallet,
              isTransactionInProgress && styles.disabled,
            ]}
            {...popupTrigger}
          >
            <Tooltip title="Copied" open={isCopied} placement="top" arrow>
              <Typography
                sx={styles.walletAddress}
                fontSize={12}
                fontWeight={400}
              >
                {displayWalletAddress(wallet.type, wallet.address)}
              </Typography>
            </Tooltip>
            {popupState.isOpen ? (
              <ExpandLess fontSize="small" />
            ) : (
              <ExpandMore fontSize="small" />
            )}
          </Box>
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
              <ListItemButton onClick={handleChangeWallet}>
                <Typography fontSize={14}>Change wallet</Typography>
              </ListItemButton>
              <ListItemButton onClick={handleDisconnectWallet}>
                <Typography fontSize={14}>Disconnect</Typography>
              </ListItemButton>
            </List>
          </Popover>
        </>
      )}
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
};

export default ConnectedWallet;
