import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import './App.css';
import { RootState } from './store';
import { clearRedeem } from './store/redeem';
import { clearTransfer } from './store/transferInput';
import { usePrevious } from './utils';
import { WormholeConnectConfig } from './config/types';
import { setConfig } from './config';
import config from './config';

import Bridge from './views/Bridge/Bridge';
import FAQ from './views/FAQ';
import Redeem from './views/Redeem/Redeem';
import Terms from './views/Terms';
import TxSearch from './views/TxSearch';
import WalletModal from './views/WalletModal';
import { setRoute } from './store/router';
import { clearWallets } from './store/wallet';
import { clearPorticoBridge } from 'store/porticoBridge';
import { useExternalSearch } from 'hooks/useExternalSearch';
import { clearNtt } from 'store/ntt';
import internalConfig from 'config';

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

interface Props {
  config?: WormholeConnectConfig;
}

// since this will be embedded, we'll have to use pseudo routes instead of relying on the url
function AppRouter(props: Props) {
  const { classes } = useStyles();
  const dispatch = useDispatch();

  // We update the global config once when WormholeConnect is first mounted, if a custom
  // config was provided.
  //
  // We don't allow config changes afterwards because they could lead to lots of
  // broken and undesired behavior.
  React.useEffect(() => {
    if (props.config) {
      setConfig(props.config);
      dispatch(clearTransfer());
    }

    config.triggerEvent({
      type: 'load',
    });
  }, []);

  const showWalletModal = useSelector(
    (state: RootState) => state.router.showWalletModal,
  );

  const route = useSelector((state: RootState) => state.router.route);
  const prevRoute = usePrevious(route);
  const { hasExternalSearch } = useExternalSearch();
  useEffect(() => {
    const redeemRoute = 'redeem';
    const bridgeRoute = 'bridge';
    // reset redeem state on leave
    if (prevRoute === redeemRoute && route !== redeemRoute) {
      dispatch(clearRedeem());
      dispatch(clearWallets());
      dispatch(clearNtt());
      internalConfig.wh.registerProviders(); // reset providers that may have been set during transfer
    }
    // reset transfer state on leave
    if (route === bridgeRoute && prevRoute !== bridgeRoute) {
      dispatch(clearTransfer());
      dispatch(clearPorticoBridge());
    }
  }, [route, prevRoute, dispatch]);

  useEffect(() => {
    if (hasExternalSearch) {
      dispatch(clearRedeem());
      dispatch(setRoute('search'));
    }
  }, [hasExternalSearch, dispatch]);

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
