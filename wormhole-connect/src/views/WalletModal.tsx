import { makeStyles } from '@mui/styles';
import React from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import Spacer from '../components/Spacer';
import { Theme } from '@mui/material';
import { useDispatch } from 'react-redux';
import { setWalletModal } from '../store/router';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const MetamaskIcon = '/assets/wallets/metamask-fox.svg';
const BinanceIcon = '/assets/wallets/binance-wallet.svg';
const CoinbaseIcon = '/assets/wallets/coinbase.svg';
const TrustIcon = '/assets/wallets/trust-wallet.svg';
const PhantomIcon = '/assets/wallets/phantom-wallet.svg';
const WalletConnectIcon = '/assets/wallets/walletconnect.svg';

const useStyles = makeStyles((theme: Theme) => ({
  walletRow: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: '16px 8px',
    transition: `background-color 0.4s`,
    cursor: 'pointer',
    fontSize: '16px',
    '&:hover': {
      backgroundColor: theme.palette.primary[700],
    },
    '&:not(:last-child)': {
      borderBottom: `0.5px solid ${theme.palette.divider}`,
    },
  },
  icon: {
    width: '32px',
    height: '32px',
    marginRight: '16px',
  },
}));

type Wallet = {
  name: string;
  icon: string;
};
const WalletOptions: Wallet[] = [
  {
    name: 'Metamask',
    icon: MetamaskIcon,
  },
  {
    name: 'Binance Wallet',
    icon: BinanceIcon,
  },
  {
    name: 'Coinbase',
    icon: CoinbaseIcon,
  },
  {
    name: 'Trust Wallet',
    icon: TrustIcon,
  },
  {
    name: 'Phantom Wallet',
    icon: PhantomIcon,
  },
  {
    name: 'Wallet Connect',
    icon: WalletConnectIcon,
  },
];

function NetworksModal() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const displayWalletOptions = (wallets: Wallet[]): JSX.Element[] => {
    return wallets.map((wallet, i) => (
      <div className={classes.walletRow} key={i}>
        <img className={classes.icon} src={wallet.icon} alt={wallet.name} />
        <div>{wallet.name}</div>
      </div>
    ));
  };
  const closeWalletModal = () => {
    dispatch(setWalletModal(false));
    document.removeEventListener('click', closeWalletModal);
  };
  document.addEventListener('close', closeWalletModal, { once: true });
  const showWalletModal = useSelector(
    (state: RootState) => state.router.showWalletModal,
  );

  return (
    <Modal open={showWalletModal} closable width={500}>
      <Header text="Connect wallet" align="left" />
      <Spacer height={32} />
      <div>{displayWalletOptions(WalletOptions)}</div>
    </Modal>
  );
}

export default NetworksModal;
