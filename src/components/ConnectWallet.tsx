import { makeStyles } from '@mui/styles';
import React from 'react';
import { Theme } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  connectReceivingWallet,
  connectWallet,
} from '../store/wallet';
import MetamaskIcon from '../icons/wallets/metamask-fox.svg';
// import TrustWalletIcon from '../icons/wallets/trust-wallet.svg';
import DownIcon from '../icons/components/Down';
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
  const dispatch = useDispatch();
  const wallet = useSelector((state: RootState) => state.wallet[props.type]);

  const connect = () => {
    if (props.type === Wallet.SENDING) {
      dispatch(connectWallet());
    } else {
      dispatch(connectReceivingWallet());
    }
  };

  // const icon = getIcon(wallet.type);

  return wallet && wallet.address && wallet.connected ? (
    <div className={classes.row}>
      <img className={classes.walletIcon} src={MetamaskIcon} alt="wallet" />
      {wallet.address}
      <DownIcon className={classes.down} />
    </div>
  ) : (
    <div className={classes.row} onClick={() => connect()}>
      <WalletIcon />
      <div>Connect wallet</div>
    </div>
  );
}

export default NetworksModal;
