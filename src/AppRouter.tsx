import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';

import './App.css';
import type { RootState } from './store';
import { clearRedeem } from './store/redeem';
import { clearTransfer } from './store/transferInput';
import { isEmptyObject, usePrevious } from './utils';
import type { WormholeConnectConfig } from './config/types';
import { setConfig } from './config';
import config from './config';

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
          margin: '0 auto',
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

interface Props {
  config?: WormholeConnectConfig;
}

// since this will be embedded, we'll have to use pseudo routes instead of relying on the url
function AppRouter(props: Props) {
  const dispatch = useDispatch();

  const hasSetSsgConfig = useRef(false);
  const isInitialLoad = useRef(true);
  const route = useSelector((state: RootState) => state.router.route);

  const loadConfig = useCallback((customConfig: WormholeConnectConfig) => {
    if (!isEmptyObject(customConfig)) {
      setConfig(customConfig);
    }

    hasSetSsgConfig.current = true;
    config.triggerEvent({
      type: 'config',
      config: customConfig,
    });
  }, []);

  if (!hasSetSsgConfig.current) {
    // This runs once in SSG step (server-side pre-rendering)
    if (props.config) {
      loadConfig(props.config);
    }
    if (route !== 'bridge') {
      // The route may not be bridge on initial load if the component was re-rendered after client side navigation
      dispatch(setRoute('bridge'));
    }
  }

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      config.triggerEvent({
        type: 'load',
        config: props.config,
      });
    } else {
      if (props.config) {
        loadConfig(props.config);
        dispatch(clearTransfer());
      }
    }
  }, [props.config, loadConfig, dispatch]);
  // END config loading code

  return <AppRouterContent />;
}

export default AppRouter;
