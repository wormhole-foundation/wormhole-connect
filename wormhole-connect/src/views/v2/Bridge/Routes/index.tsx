import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Tooltip from '@mui/material/Tooltip';
import Link from '@mui/material/Link';
import { makeStyles } from 'tss-react/mui';

import config from 'config';
import { RoutesConfig } from 'config/routes';
import SingleRoute from 'views/v2/Bridge/Routes/SingleRoute';
import AlertBannerV2 from 'components/v2/AlertBanner';

import type { RootState } from 'store';
import { RouteState } from 'store/transferInput';

import { routes } from '@wormhole-foundation/sdk';
import { Typography } from '@mui/material';

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
    color: theme.palette.primary.main,
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
  quotes: Record<string, routes.QuoteResult<routes.Options> | undefined>;
  isFetchingQuotes: boolean;
};

const Routes = ({ sortedSupportedRoutes, ...props }: Props) => {
  const { classes } = useStyles();
  const [showAll, setShowAll] = useState(false);

  const { amount, routeStates } = useSelector(
    (state: RootState) => state.transferInput,
  );

  const { sending: sendingWallet, receiving: receivingWallet } = useSelector(
    (state: RootState) => state.wallet,
  );

  const supportedRoutes = useMemo(() => {
    if (!routeStates) {
      return [];
    }

    return routeStates.filter((rs) => rs.supported);
  }, [routeStates]);

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

  const fastestRoute = useMemo(() => {
    return sortedSupportedRoutes.reduce(
      (fastest, route) => {
        const quote = props.quotes[route.name];
        if (!quote || !quote.success) return fastest;

        if (
          quote.eta !== undefined &&
          quote.eta < fastest.eta &&
          quote.eta < 60_000
        ) {
          return { name: route.name, eta: quote.eta };
        } else {
          return fastest;
        }
      },
      { name: '', eta: Infinity },
    );
  }, [sortedSupportedRoutes, props.quotes]);

  const cheapestRoute = useMemo(() => {
    return sortedSupportedRoutes.reduce(
      (cheapest, route) => {
        const quote = props.quotes[route.name];
        const rc = config.routes.get(route.name);
        // TODO put AUTOMATIC_DEPOSIT into RouteState
        if (!quote || !quote.success || !rc.AUTOMATIC_DEPOSIT) return cheapest;

        const amountOut = BigInt(quote.destinationToken.amount.amount);
        if (amountOut > cheapest.amountOut) {
          return { name: route.name, amountOut };
        } else {
          return cheapest;
        }
      },
      { name: '', amountOut: 0n },
    );
  }, [sortedSupportedRoutes, props.quotes]);

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
      <Typography
        fontSize={16}
        paddingBottom={0}
        marginTop="8px"
        marginBottom={0}
        width="100%"
        textAlign="left"
      >
        Routes
      </Typography>
      {renderRoutes.map(({ name }, index) => {
        const routeConfig = RoutesConfig[name];
        const isSelected = routeConfig.name === props.selectedRoute;
        const quoteResult = props.quotes[name];
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
            error={quoteError}
            isSelected={isSelected && !quoteError}
            isFastest={name === fastestRoute.name}
            isCheapest={name === cheapestRoute.name}
            isOnlyChoice={supportedRoutes.length === 1}
            onSelect={props.onRouteChange}
            quote={quote}
            isFetchingQuote={props.isFetchingQuotes}
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
