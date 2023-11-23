import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import './App.css';
import { RootState } from './store';
import { clearRedeem } from './store/redeem';
import { clearTransfer } from './store/transferInput';
import { usePrevious } from './utils';

import Bridge from './views/Bridge/Bridge';
import FAQ from './views/FAQ';
import Redeem from './views/Redeem/Redeem';
import Terms from './views/Terms';
import TxSearch from './views/TxSearch';
import WalletModal from './views/WalletModal';
import { SEARCH_TX } from 'config';
import { setRoute } from 'store/router';

const useStyles = makeStyles()((theme: any) => ({
  appContent: {
    textAlign: 'left',
    margin: '40px auto',
    maxWidth: '900px',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    padding: '16px',
    fontFamily: theme.palette.font.primary,
    [theme.breakpoints.down('sm')]: {
      margin: '0 auto',
    },
  },
}));

// since this will be embedded, we'll have to use pseudo routes instead of relying on the url
function AppRouter() {
  const { classes } = useStyles();
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
  }, [route, prevRoute, dispatch]);

  useEffect(() => {
    if (SEARCH_TX?.chainName && SEARCH_TX?.txHash) {
      dispatch(clearRedeem());
      dispatch(setRoute('search'));
    }
  }, [dispatch]);

  return (
    <div className={classes.appContent}>
      {showWalletModal && <WalletModal type={showWalletModal} />}
      {route === 'bridge' && <Bridge />}
      {route === 'redeem' && <Redeem />}
      {route === 'search' && <TxSearch />}
      {route === 'terms' && <Terms />}
      {route === 'faq' && <FAQ />}
    </div>
  );
}

export default AppRouter;
