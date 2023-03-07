import React, { useEffect, useRef } from 'react';
import { makeStyles } from 'tss-react/mui';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { RootState } from './store';
import { clearRedeem } from './store/redeem';
import { clearTransfer } from './store/transfer';

import './App.css';
import Bridge from './views/Bridge/Bridge';
import WalletModal from './views/WalletModal';
import Redeem from './views/Redeem/Redeem';
import TxSearch from './views/TxSearch';
import { clearWallets } from './store/wallet';

const useStyles = makeStyles()((theme) => ({
  appContent: {
    textAlign: 'left',
    margin: '40px auto',
    maxWidth: '900px',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    padding: '16px',
    fontFamily: theme.palette.font.primary,
  },
}));

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

// since this will be embedded, we'll have to use pseudo routes instead of relying on the url
function AppRouter() {
  const classes = useStyles();
  const dispatch = useDispatch();

  const showWalletModal = useSelector(
    (state: RootState) => state.router.showWalletModal,
  );

  const route = useSelector((state: RootState) => state.router.route);
  const prevRoute = usePrevious(route);

  useEffect(() => {
    const redeemRoute = 'redeem';
    const bridgeRoute = 'bridge';
    // reset redeem state on leave
    if (prevRoute === redeemRoute && route !== redeemRoute) {
      dispatch(clearRedeem());
    }
    // reset transfer state on leave
    if (prevRoute === bridgeRoute && route !== bridgeRoute) {
      dispatch(clearTransfer());
    }
    // reset wallets when starting a new bridge transfer
    if (prevRoute !== bridgeRoute && route === bridgeRoute) {
      dispatch(clearWallets());
    }
  }, [route]);

  return (
    <div className={classes.appContent}>
      {showWalletModal && <WalletModal type={showWalletModal} />}
      {route === 'bridge' && <Bridge />}
      {route === 'redeem' && <Redeem />}
      {route === 'search' && <TxSearch />}
    </div>
  );
}

export default AppRouter;
