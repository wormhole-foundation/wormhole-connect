import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Tooltip from '@mui/material/Tooltip';
import Link from '@mui/material/Link';
import { makeStyles } from 'tss-react/mui';

import { RoutesConfig } from 'config/routes';
import SingleRoute from 'views/v2/Bridge/Routes/SingleRoute';
import AlertBannerV2 from 'components/v2/AlertBanner';

import type { RootState } from 'store';
import useRoutesQuotesBulk from 'hooks/useRoutesQuotesBulk';
import { RouteState } from 'store/transferInput';

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
  sortedSupportedRoutes: RouteState[];
  selectedRoute?: string;
  onRouteChange: (route: string) => void;
};

const Routes = ({ sortedSupportedRoutes, ...props }: Props) => {
  const { classes } = useStyles();
  const [showAll, setShowAll] = useState(false);

  const { amount, routeStates, fromChain, token, toChain, destToken } =
    useSelector((state: RootState) => state.transferInput);
  const { toNativeToken } = useSelector((state: RootState) => state.relay);

  const { sending: sendingWallet, receiving: receivingWallet } = useSelector(
    (state: RootState) => state.wallet,
  );

  const supportedRoutes = useMemo(() => {
    if (!routeStates) {
      return [];
    }

    return routeStates.filter((rs) => rs.supported);
  }, [routeStates]);

  const supportedRoutesNames = useMemo(
    () => supportedRoutes.map((r) => r.name),
    [supportedRoutes],
  );

  const { quotesMap, isFetching } = useRoutesQuotesBulk(supportedRoutesNames, {
    amount,
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

  const renderRoutes = useMemo(() => {
    if (showAll) {
      return sortedSupportedRoutes;
    }

    const selectedRoute = sortedSupportedRoutes.find(
      (route) => route.name === props.selectedRoute,
    );

    return selectedRoute ? [selectedRoute] : sortedSupportedRoutes.slice(0, 1);
  }, [showAll, sortedSupportedRoutes]);

  if (walletsConnected && supportedRoutes.length === 0 && Number(amount) > 0) {
    return (
      <AlertBannerV2
        error
        show
        content="No route found for this transaction"
        style={{ justifyContent: 'center' }}
      />
    );
  }

  if (supportedRoutes.length === 0 || !walletsConnected) {
    return <></>;
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
        const quoteResult = quotesMap[name];
        const quote = quoteResult?.success ? quoteResult : undefined;
        // Default message added as precaution, as 'Error' type cannot be trusted
        const quoteError =
          quoteResult?.success === false
            ? quoteResult?.error?.message ??
              `Error while getting a quote for ${name}.`
            : undefined;
        return (
          <SingleRoute
            key={name}
            route={routeConfig}
            available={available}
            error={availabilityError || quoteError}
            isSelected={isSelected}
            onSelect={props.onRouteChange}
            quote={quote}
            isFetchingQuote={isFetching}
          />
        );
      })}
      {sortedSupportedRoutes.length > 1 && (
        <Link
          onClick={() => setShowAll((prev) => !prev)}
          className={classes.otherRoutesToggle}
        >
          {showAll ? 'Hide other routes' : 'View other routes'}
        </Link>
      )}
    </>
  );
};

export default Routes;
