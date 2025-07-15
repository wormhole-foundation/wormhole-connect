import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import Button from 'components/v3/Button';
import { RootState } from 'store';
import { displayWalletAddress } from 'utils';
import { TransferWallet } from 'utils/wallet';

import { TransferSide } from 'config/types';
import WalletSidebar from './Sidebar';
import config from 'config';

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
  const sourceChain = useSelector(
    (state: RootState) => state.transferInput.fromChain,
  );
  const destChain = useSelector(
    (state: RootState) => state.transferInput.toChain,
  );

  const [isOpen, setIsOpen] = useState(false);

  const connectWallet = useCallback(
    async (popupState?: any) => {
      if (disabled) {
        return;
      }

      popupState?.close();

      // If external wallet manager is configured, trigger external wallet connection
      if (config.externalWalletManager) {
        try {
          if (config.externalWalletManager.onWalletRequired) {
            const chain =
              type === TransferWallet.SENDING ? sourceChain : destChain;

            if (chain) {
              config.externalWalletManager.onWalletRequired(
                type === TransferWallet.SENDING ? 'sending' : 'receiving',
                chain,
              );
            }
          }
        } catch (error) {
          console.error('Failed to trigger external wallet connection:', error);
        }
      } else {
        // Use internal wallet selection
        setIsOpen(true);
      }
    },
    [disabled, type, sourceChain, destChain],
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
          styleOverrides={{
            '&:disabled': {
              cursor: 'not-allowed',
              pointerEvents: 'all !important',
            },
          }}
          onClick={() => connectWallet()}
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
          {!config.externalWalletManager && (
            <WalletSidebar
              open={isOpen}
              type={props.type}
              onClose={() => {
                setIsOpen(false);
              }}
              showAddressInput={props.type === TransferWallet.RECEIVING}
            />
          )}
        </>
      );
    }
  }, [disabled, isOpen, props.side, props.type, connectWallet]);

  if (wallet && wallet.address) {
    return connected;
  }

  return disconnected;
};

export default React.memo(WalletConnector);
