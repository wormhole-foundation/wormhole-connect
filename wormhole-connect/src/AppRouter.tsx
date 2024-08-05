import React, { useContext, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import './App.css';
import { RootState } from './store';
import { clearRedeem } from './store/redeem';
import { clearTransfer } from './store/transferInput';
import { isEmptyObject, usePrevious } from './utils';
import { Route, WormholeConnectConfig } from './config/types';
import { setConfig } from './config';
import config from './config';

import Bridge from './views/Bridge/Bridge';
import FAQ from './views/FAQ';
import Redeem from './views/Redeem/Redeem';
import Terms from './views/Terms';
import TxSearch from './views/TxSearch';
import WalletModal from './views/WalletModal';
import {
  setTxDetails,
  setSendTx,
  setRoute as setRedeemRoute,
} from 'store/redeem';
import { setRoute } from './store/router';
import { setRoute as setTransferRoute } from 'store/transferInput';
import { clearWallets } from './store/wallet';
import { clearPorticoBridge } from 'store/porticoBridge';
import { useExternalSearch } from 'hooks/useExternalSearch';
import internalConfig from 'config';

import BridgeV2 from 'views/v2/Bridge';
import RedeemV2 from 'views/v2/Redeem';
import { RouteContext } from 'contexts/RouteContext';

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
  const routeContext = useContext(RouteContext);

  // We update the global config once when WormholeConnect is first mounted, if a custom
  // config was provided.
  //
  // We don't allow config changes afterwards because they could lead to lots of
  // broken and undesired behavior.
  React.useEffect(() => {
    if (!isEmptyObject(props.config)) {
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
      routeContext.clear();
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

  // IMPORTANT: This is temporary code to enable easier debugging for Redeem view
  useEffect(() => {
    if (props.config?.redeemDebugger) {
      dispatch(setTransferRoute(Route.Relay));
      dispatch(
        setTxDetails({
          sendTx:
            '0xe019ecbf9b29d041384dcf5154899e4818f10b8805bf75114c745ddebe9100bc',
          sender: '0x49887A216375FDED17DC1aAAD4920c3777265614',
          amount: '0.1',
          recipient: '0x49887A216375FDED17DC1aAAD4920c3777265614',
          toChain: 'polygon',
          fromChain: 'ethereum',
          tokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          tokenKey: 'USDT',
          tokenDecimals: 6,
          receivedTokenKey: 'USDT',
          receiveAmount: '0.03003',
          receiveNativeAmount: 0.01,
          relayerFee: {
            fee: 0.006997,
            tokenKey: 'USDT',
          },
        }),
      );
      dispatch(
        setSendTx(
          '0xe019ecbf9b29d041384dcf5154899e4818f10b8805bf75114c745ddebe9100bc',
        ),
      );
      dispatch(setRedeemRoute(route));
      dispatch(setRoute('redeem'));
    }
  }, [props.config?.redeemDebugger]);

  const bridge = useMemo(() => {
    return props.config?.useRedesign ? <BridgeV2 /> : <Bridge />;
  }, [props.config?.useRedesign]);

  const redeem = useMemo(() => {
    return props.config?.useRedesign ? <RedeemV2 /> : <Redeem />;
  }, [props.config?.useRedesign]);

  const walletSelector = useMemo(() => {
    return props.config?.useRedesign || !showWalletModal ? null : (
      <WalletModal type={showWalletModal} />
    );
  }, [showWalletModal, props.config?.useRedesign]);

  return (
    <div className={classes.appContent}>
      {walletSelector}
      {route === 'bridge' && bridge}
      {route === 'redeem' && redeem}
      {route === 'search' && <TxSearch />}
      {route === 'terms' && <Terms />}
      {route === 'faq' && <FAQ />}
    </div>
  );
}

export default AppRouter;
