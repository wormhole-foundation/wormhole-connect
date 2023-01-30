import { makeStyles } from '@mui/styles';
import React from 'react';
import { Theme, useTheme } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  connectReceivingWallet,
  connectWallet,
  openWalletModal,
} from '../store/wallet';
// import MetamaskIcon from '../icons/wallets/metamask-fox.svg';
// import TrustWalletIcon from '../icons/wallets/trust-wallet.svg';
import DownIcon from '../icons/components/Down';
import PopupState, { bindTrigger, bindPopover } from 'material-ui-popup-state';
import Popover from '@mui/material/Popover';
import { useDispatch } from 'react-redux';
import WalletIcon from '../icons/components/Wallet';
import { displayEvmAddress } from '../utils';
import { CHAINS } from '../sdk/config';
import { BigNumber } from 'ethers';
import { setFromNetwork } from '../store/transfer';
import ActionIndicator from './Action';
const MetamaskIcon = '/assets/wallets/metamask-fox.svg';

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

function ConnectWallet(props: Props) {
  const classes = useStyles();
  const theme = useTheme();
  const dispatch = useDispatch();
  const wallet = useSelector((state: RootState) => state.wallet[props.type]);
  const sourceChain = useSelector(
    (state: RootState) => state.transfer.fromNetwork,
  );
  const sourceConfig = CHAINS[sourceChain!];

  const connect = async () => {
    const walletConnection = await openWalletModal(
      theme,
      props.type === Wallet.RECEIVING,
    );
    if (props.type === Wallet.SENDING) {
      // add listeners
      const { connection } = walletConnection;
      connection.on('accountsChanged', async () => {
        if (connection.isMetaMask) {
          window.location.reload();
          return;
        }
      });
      connection.on('chainChanged', async (chainId: number) => {
        console.log('network change', chainId);
        // get name of network and set in store
        // TODO: is this how we want to handle a network change?
        const id = BigNumber.from(chainId).toNumber();
        if (sourceConfig && id !== sourceConfig.chainId) {
          dispatch(setFromNetwork(sourceConfig.key));
        }
      });

      dispatch(connectWallet(walletConnection.address));
    } else {
      dispatch(connectReceivingWallet(walletConnection.address));
    }
  };

  // const icon = getIcon(wallet.type);

  return wallet && wallet.address ? (
    <PopupState variant="popover" popupId="demo-popup-popover">
      {(popupState) => (
        <div>
          <div className={classes.row} {...bindTrigger(popupState)}>
            <img
              className={classes.walletIcon}
              src={MetamaskIcon}
              alt="wallet"
            />
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
      <div className={classes.actionIndicator}>
        <ActionIndicator />
      </div>
    </div>
  );
}

export default ConnectWallet;
