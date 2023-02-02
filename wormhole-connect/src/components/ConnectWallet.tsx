import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Theme, useTheme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import { RootState } from '../store';
import {
  connectReceivingWallet,
  connectWallet,
  disconnectReceiving,
  disconnectSending,
  openWalletModal,
  disconnect,
  Wallet,
} from '../store/wallet';
import DownIcon from '../icons/components/Down';
import WalletIcon from '../icons/components/Wallet';
import { copyTextToClipboard, displayEvmAddress } from '../utils';
import ActionIndicator from './Action';
import WalletIcons from '../icons/components/WalletIcons';
import PopupState, { bindTrigger, bindPopover } from 'material-ui-popup-state';
import Popover from '@mui/material/Popover';

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

function ConnectWallet(props: Props) {
  const classes = useStyles();
  const theme = useTheme();
  const dispatch = useDispatch();
  const wallet = useSelector((state: RootState) => state.wallet[props.type]);

  const connect = async (popupState?: any) => {
    if (popupState) popupState.close();
    const walletConnection = await openWalletModal(
      theme,
      props.type === Wallet.RECEIVING,
    );
    if (props.type === Wallet.SENDING) {
      // add listeners
      const { connection } = walletConnection;
      connection.on('accountsChanged', async (accounts: string[]) => {
        if (accounts.length === 0) {
          await (disconnect(props.type));
          if (props.type === Wallet.SENDING) {
            dispatch(disconnectSending());
          } else {
            dispatch(disconnectReceiving());
          }
        }
      });

      dispatch(connectWallet(walletConnection.address));
    } else {
      dispatch(connectReceivingWallet(walletConnection.address));
    }
  };

  const copy = async (popupState: any) => {
    await copyTextToClipboard(wallet.address);
    popupState.close();
  }

  const disconnectWallet = async () => {
    await disconnect(props.type);
    if (props.type === Wallet.SENDING) {
      dispatch(disconnectSending());
    } else {
      dispatch(disconnectReceiving());
    }
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
