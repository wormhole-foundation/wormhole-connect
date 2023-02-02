import React, { Dispatch } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Theme, useTheme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import { RootState } from '../store';
import {
  connectReceivingWallet,
  connectWallet,
  clearWallet,
  openWalletModal,
  disconnect,
  Wallet,
  setCurrentAddress,
} from '../store/wallet';
import DownIcon from '../icons/components/Down';
import WalletIcon from '../icons/components/Wallet';
import { copyTextToClipboard, displayEvmAddress } from '../utils';
import ActionIndicator from './Action';
import WalletIcons from '../icons/components/WalletIcons';
import PopupState, { bindTrigger, bindPopover } from 'material-ui-popup-state';
import Popover from '@mui/material/Popover';
import { AnyAction } from '@reduxjs/toolkit';

const useStyles = makeStyles((theme: Theme) => ({
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'end',
    gap: '8px',
    cursor: 'pointer',
  },
  walletIcon: {
    width: '24px',
    height: '24px',
  },
  actionIndicator: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '14px',
    marginLeft: '4px',
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
    width: '175px',
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

// function getIcon(type: WalletType): string {
//   switch (type) {
//     case WalletType.METAMASK: {
//       return MetamaskIcon;
//     }
//     case WalletType.TRUST_WALLET: {
//       return TrustWalletIcon;
//     }
//     default: {
//       return '';
//     }
//   }
// }

type Props = {
  type: Wallet;
};
export const handleConnect = async (dispatch: Dispatch<AnyAction>, theme: Theme, type: Wallet) => {
  const walletConnection = await openWalletModal(
    theme,
    type === Wallet.RECEIVING,
  );
  if (type === Wallet.SENDING) {
    // add listeners
    const { connection } = walletConnection;
    connection.on('accountsChanged', async (accounts: string[]) => {
      if (accounts.length === 0) {
        await (disconnect(type));
        clearWallet(type);
      } else {
        const payload = {
          type,
          address: accounts[0],
        }
        dispatch(setCurrentAddress(payload));
      }
    });

    dispatch(connectWallet(walletConnection.address));
  } else {
    dispatch(connectReceivingWallet(walletConnection.address));
  }
};

function ConnectWallet(props: Props) {
  const classes = useStyles();
  const theme = useTheme();
  const dispatch = useDispatch();
  const wallet = useSelector((state: RootState) => state.wallet[props.type]);

  const connect = async (popupState?: any) => {
    if (popupState) popupState.close();
    await handleConnect(dispatch, theme, props.type);
  };

  const copy = async (popupState: any) => {
    await copyTextToClipboard(wallet.address);
    popupState.close();
  }

  const disconnectWallet = async () => {
    await disconnect(props.type);
    dispatch(clearWallet(Wallet.SENDING));
  }

  // const icon = getIcon(wallet.type);

  return wallet && wallet.address ? (
    <PopupState variant="popover" popupId="demo-popup-popover">
      {(popupState) => (
        <div>
          <div className={classes.row} {...bindTrigger(popupState)}>
            <WalletIcons name="metamask" height={24} />
            {displayEvmAddress(wallet.address)}
            <DownIcon className={classes.down} />
          </div>
          <Popover
            {...bindPopover(popupState)}
            sx={{ marginTop: 1 }}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <div className={classes.dropdown}>
              <div className={classes.dropdownItem} onClick={() => copy(popupState)}>Copy address</div>
              <div className={classes.dropdownItem} onClick={() => connect(popupState)}>Change wallet</div>
              <div className={classes.dropdownItem} onClick={disconnectWallet}>Disconnect</div>
            </div>
          </Popover>
        </div>
      )}
    </PopupState>
  ) : (
    <div className={classes.row} onClick={() => connect()}>
      <WalletIcon />
      <div>Connect wallet</div>
      <div className={classes.actionIndicator}>
        <ActionIndicator />
      </div>
    </div>
  );
}

export default ConnectWallet;
