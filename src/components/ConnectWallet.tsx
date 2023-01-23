import { makeStyles } from '@mui/styles';
import React from 'react';
import { Theme, useTheme } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { connectReceivingWallet, connectWallet, openWalletModal } from '../store/wallet';
import MetamaskIcon from '../icons/wallets/metamask-fox.svg';
// import TrustWalletIcon from '../icons/wallets/trust-wallet.svg';
import DownIcon from '../icons/components/Down';
import PopupState, { bindTrigger, bindPopover } from 'material-ui-popup-state';
import Popover from '@mui/material/Popover';
import { useDispatch } from 'react-redux';
import WalletIcon from '../icons/components/Wallet';

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

export enum Wallet {
  SENDING = 'sending',
  RECEIVING = 'receiving',
}

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

function NetworksModal(props: Props) {
  const classes = useStyles();
  const theme = useTheme();
  const dispatch = useDispatch();
  const wallet = useSelector((state: RootState) => state.wallet[props.type]);

  const connect = () => {
    if (props.type === Wallet.SENDING) {
      openWalletModal(theme);
      dispatch(connectWallet());
    } else {
      dispatch(connectReceivingWallet());
    }
  };

  // const icon = getIcon(wallet.type);

  return wallet && wallet.address && wallet.connected ? (
    <PopupState variant="popover" popupId="demo-popup-popover">
      {(popupState) => (
        <div>
          <div className={classes.row} {...bindTrigger(popupState)}>
            <img
              className={classes.walletIcon}
              src={MetamaskIcon}
              alt="wallet"
            />
            {wallet.address}
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
              <div className={classes.dropdownItem}>Copy address</div>
              <div className={classes.dropdownItem}>Change wallet</div>
              <div className={classes.dropdownItem}>Disconnect</div>
            </div>
          </Popover>
        </div>
      )}
    </PopupState>
  ) : (
    <div className={classes.row} onClick={() => connect()}>
      <WalletIcon />
      <div>Connect wallet</div>
    </div>
  );
}

export default NetworksModal;
