import React, { useContext, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';

import './App.css';
import type { RootState } from './store';
import { clearRedeem } from './store/redeem';
import { clearTransfer } from './store/transferInput';
import { usePrevious } from './utils';
import { useConfig } from './contexts/ConfigContext';

import Terms from './views/Terms';
import TxSearch from './views/TxSearch';
import { setRoute } from './store/router';
import { clearWallets } from './store/wallet';
import { useExternalSearch } from 'hooks/useExternalSearch';

import BridgeV3 from 'views/v3/Bridge';
import RedeemV3 from 'views/v3/Redeem';
import { RouteContext } from 'contexts/RouteContext';
import SvgDefs from 'icons/SvgDefs';
import { Box } from '@mui/material';

const AppRouterContent = () => {
  const theme = useTheme();
  const routeContext = useContext(RouteContext);
  const route = useSelector((state: RootState) => state.router.route);
  const dispatch = useDispatch();

  const prevRoute = usePrevious(route);
  const { hasExternalSearch } = useExternalSearch();

  useEffect(() => {
    const redeemRoute = 'redeem';
    const bridgeRoute = 'bridge';
    // reset redeem state on leave
    if (prevRoute === redeemRoute && route !== redeemRoute) {
      dispatch(clearRedeem());
      dispatch(clearWallets());
      routeContext.clear();
    }
    // reset transfer state on leave
    const isEnteringBridge = route === bridgeRoute && prevRoute !== bridgeRoute;
    if (isEnteringBridge && prevRoute !== 'history') {
      dispatch(clearTransfer());
    }
  }, [route, prevRoute, dispatch, routeContext]);

  useEffect(() => {
    if (hasExternalSearch) {
      dispatch(clearRedeem());
      dispatch(setRoute('search'));
    }
  }, [hasExternalSearch, dispatch]);

  return (
    <Box
      sx={{
        textAlign: 'left',
        margin: '40px auto',
        maxWidth: '900px',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        fontFamily: theme.typography.fontFamily,
        [theme.breakpoints.down('sm')]: {
          margin: '16px auto',
        },
      }}
    >
      <SvgDefs />
      {route === 'bridge' && <BridgeV3 showHistory={false} />}
      {route === 'redeem' && <RedeemV3 />}
      {route === 'history' && <BridgeV3 showHistory />}
      {route === 'search' && <TxSearch />}
      {route === 'terms' && <Terms />}
    </Box>
  );
};

// since this will be embedded, we'll have to use pseudo routes instead of relying on the url
function AppRouter() {
  const dispatch = useDispatch();
  const config = useConfig();
  const route = useSelector((state: RootState) => state.router.route);

  // Track config changes to clear transfer state when config is updated
  const prevConfig = usePrevious(config);
  const hasInitialized = useRef(false);

  // SSG route initialization - ensure we start on bridge route
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      if (route !== 'bridge') {
        dispatch(setRoute('bridge'));
      }
    }
  }, [route, dispatch]);

  // Clear transfer state when config changes (after initial load)
  useEffect(() => {
    if (prevConfig && prevConfig !== config) {
      dispatch(clearTransfer());
    }
  }, [config, prevConfig, dispatch]);

  return <AppRouterContent />;
}

export default AppRouter;
