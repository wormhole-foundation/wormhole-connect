import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Tooltip from '@mui/material/Tooltip';
import { makeStyles } from 'tss-react/mui';

import { RoutesConfig } from 'config/routes';
import useAvailableRoutes from 'hooks/useAvailableRoutes';
import SingleRoute from 'views/v2/Bridge/Routes/SingleRoute';

import type { RootState } from 'store';
import useRoutesQuotesBulk from 'hooks/useRoutesQuotesBulk';
import { CircularProgress, Link } from '@mui/material';
import RouteOperator from 'routes/operator';

const useStyles = makeStyles()((theme: any) => ({
  connectWallet: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '8px',
    backgroundColor: theme.palette.button.primary,
    cursor: 'not-allowed',
    opacity: 0.7,
    margin: 'auto',
    maxWidth: '420px',
    width: '100%',
  },
  otherRoutesToggle: {
    fontSize: 14,
    color: '#C1BBF6',
    textDecoration: 'none',
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
}));

type Props = {
  selectedRoute?: string;
  onRouteChange: (route: string) => void;
};

const Routes = (props: Props) => {
  const { classes } = useStyles();
  const [showAll, setShowAll] = useState(false);

  const { amount, routeStates, fromChain, token, toChain, destToken } =
    useSelector((state: RootState) => state.transferInput);
  const { toNativeToken } = useSelector((state: RootState) => state.relay);

  const { sending: sendingWallet, receiving: receivingWallet } = useSelector(
    (state: RootState) => state.wallet,
  );

  useAvailableRoutes();

  const supportedRoutes = useMemo(() => {
    if (!routeStates) {
      return [];
    }

    return routeStates.filter((rs) => rs.supported);
  }, [routeStates]);

  const supportedRoutesNames = useMemo(
    () => supportedRoutes.map((r) => r.name as Route),
    [supportedRoutes],
  );

  const { quotesMap, isFetching } = useRoutesQuotesBulk(supportedRoutesNames, {
    amount: Number.parseFloat(amount),
    sourceChain: fromChain,
    sourceToken: token,
    destChain: toChain,
    destToken,
    nativeGas: toNativeToken,
  });

  const walletsConnected = useMemo(
    () => !!sendingWallet.address && !!receivingWallet.address,
    [sendingWallet.address, receivingWallet.address],
  );

  const sortedSupportedRoutes = useMemo(() => [...supportedRoutes].sort((routeA, routeB) => {
    const quoteA = quotesMap[routeA.name as Route];
    const quoteB = quotesMap[routeB.name as Route];
    const routeConfigA = RouteOperator.getRoute(routeA.name as Route);
    const routeConfigB = RouteOperator.getRoute(routeB.name as Route);

    // 1. Prioritize automatic routes
    if (routeConfigA.AUTOMATIC_DEPOSIT && !routeConfigB.AUTOMATIC_DEPOSIT) {
      return -1;
    } else if (!routeConfigA.AUTOMATIC_DEPOSIT && routeConfigB.AUTOMATIC_DEPOSIT) {
      return 1;
    }

    if (quoteA && quoteB) {
      // 2. Prioritize estimated time
      if (quoteA.eta > quoteB.eta) {
        return 1;
      } else if (quoteA.eta < quoteB.eta) {
        return -1;
      }

      // 3. Compare relay fees
      if (quoteA.relayerFee > quoteB.relayerFee) {
        return 1;
      } else if (quoteA.relayerFee < quoteB.relayerFee) {
        return -1;
      }
    }

    // Don't swap when routes match by all criteria or don't have quotas
    return 0;
  }), [supportedRoutes, quotesMap]);

  const renderRoutes = useMemo(() => showAll ? sortedSupportedRoutes : sortedSupportedRoutes.slice(0, 1), [showAll, sortedSupportedRoutes]);

  if (supportedRoutes.length === 0 || !walletsConnected) {
    return <></>;
  }

  if (isFetching) {
    return <CircularProgress />;
  }

  if (walletsConnected && !(Number(amount) > 0)) {
    return (
      <Tooltip title="Please enter the amount to view available routes">
        <div className={classes.connectWallet}>
          <div>View routes</div>
        </div>
      </Tooltip>
    );
  }

  return (
    <>
      {renderRoutes.map(({ name, available, availabilityError }) => {
        const routeConfig = RoutesConfig[name];
        const isSelected = routeConfig.name === props.selectedRoute;
        return (
          <SingleRoute
            route={routeConfig}
            available={available}
            error={availabilityError}
            isSelected={isSelected}
            onSelect={props.onRouteChange}
          />
        );
      })}
      {sortedSupportedRoutes.length > 1 && (
        <Link onClick={() => setShowAll(prev => !prev)} className={classes.otherRoutesToggle}>
          {showAll ? 'Hide other routes' : 'View other routes'}
        </Link>
      )}
    </>
  );
};

export default Routes;
