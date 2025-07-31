import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import {
  createDefaultAuthorizationCache,
  createDefaultChainSelector,
  createDefaultWalletNotFoundHandler,
  registerMwa,
} from '@solana-mobile/wallet-standard-mobile';

import Button from 'components/v2/Button';
import type { RootState } from 'store';
import { displayWalletAddress } from 'utils';
import { TransferWallet } from 'utils/wallet';
import useWalletProvider from 'hooks/useWalletProvider';

import type { TransferSide } from 'config/types';
import WalletSidebar from './Sidebar';

type Props = {
  side: TransferSide;
  type: TransferWallet;
  disabled?: boolean;
};

// Parent component to display Connect Wallet CTA
// and the sidebar for the list of available wallets.
const WalletConnector = (props: Props) => {
  const { disabled = false, type } = props;

  const wallet = useSelector((state: RootState) => state.wallet[type]);
  const { fromChain, toChain } = useSelector(
    (state: RootState) => state.transferInput,
  );
  const { connectWallet, walletProvider } = useWalletProvider();

  const selectedChain = type === TransferWallet.SENDING ? fromChain : toChain;

  const [isOpen, setIsOpen] = useState(false);

  // Register the MWA (Mobile Wallet Adapter) on component mount
  // This allows the app to interact with wallets that support the MWA standard.
  // See for more details: https://docs.solanamobile.com/mobile-wallet-adapter/migrating-to-wallet-standard
  useEffect(() => {
    registerMwa({
      appIdentity: {
        name: 'Wormhole Connect',
        uri: 'https://portalbridge.com/',
        icon: '/logo192.png',
      },
      authorizationCache: createDefaultAuthorizationCache(),
      chains: ['solana:devnet', 'solana:mainnet'],
      chainSelector: createDefaultChainSelector(),
      onWalletNotFound: createDefaultWalletNotFoundHandler(),
    });
  }, []);

  const handleConnectWallet = useCallback(
    async (popupState?: any) => {
      if (disabled || !selectedChain) {
        return;
      }

      popupState?.close();
      setIsOpen(true);
      await connectWallet(selectedChain, type);
    },
    [disabled, selectedChain, type, connectWallet],
  );

  const connected = useMemo(() => {
    if (!wallet?.address) {
      return null;
    }

    return (
      <div>{`Connected to ${displayWalletAddress(
        wallet.type,
        wallet.address,
      )}`}</div>
    );
  }, [wallet.address, wallet.type]);

  const disconnected = useMemo(() => {
    const button = (
      <span style={{ width: '100%' }}>
        <Button
          disableRipple
          variant="primary"
          data-testid={`${props.side}-section-connect-wallet-button`}
          disabled={disabled}
          sx={{
            '&:disabled': {
              cursor: 'not-allowed',
              pointerEvents: 'all !important',
            },
          }}
          onClick={() => handleConnectWallet()}
        >
          <Typography textTransform="none">
            {`Connect ${props.side} wallet`}
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
    props.side,
    props.type,
    handleConnectWallet,
    walletProvider,
  ]);

  if (wallet && wallet.address) {
    return connected;
  }

  return disconnected;
};

export default WalletConnector;
