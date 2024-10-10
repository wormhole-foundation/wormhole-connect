import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { makeStyles } from 'tss-react/mui';

import config from 'config';
import { RoutesConfig } from 'config/routes';
import SingleRoute from 'views/v2/Bridge/Routes/SingleRoute';

import type { RootState } from 'store';
import { RouteState } from 'store/transferInput';
import { routes } from '@wormhole-foundation/sdk';
import { Box, CircularProgress, Skeleton } from '@mui/material';

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
    marginTop: '16px',
    maxWidth: '420px',
    height: '48px',
    width: '100%',
  },
  otherRoutesToggle: {
    display: 'block',
    width: '100%',
    textAlign: 'center',
    fontSize: 14,
    color: theme.palette.text.secondary,
    textDecoration: 'none',
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
}));

type Props = {
  routes: RouteState[];
  selectedRoute?: string;
  onRouteChange: (route: string) => void;
  quotes: Record<string, routes.QuoteResult<routes.Options> | undefined>;
  isLoading: boolean;
  hasError: boolean;
};

const Routes = ({ ...props }: Props) => {
  const { classes } = useStyles();
  const [showAll, setShowAll] = useState(false);

  const { amount } = useSelector((state: RootState) => state.transferInput);

  const { sending: sendingWallet, receiving: receivingWallet } = useSelector(
    (state: RootState) => state.wallet,
  );

  const supportedRoutes = useMemo(() => {
    if (!props.routes) {
      return [];
    }

    return props.routes.filter((rs) => rs.supported);
  }, [props.routes]);

  const walletsConnected = useMemo(
    () => !!sendingWallet.address && !!receivingWallet.address,
    [sendingWallet.address, receivingWallet.address],
  );

  const renderRoutes = useMemo(() => {
    if (showAll) {
      return props.routes;
    }

    const selectedRoute = props.routes.find(
      (route) => route.name === props.selectedRoute,
    );

    return selectedRoute ? [selectedRoute] : props.routes.slice(0, 1);
  }, [showAll, props.routes]);

  const fastestRoute = useMemo(() => {
    return props.routes.reduce(
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
  }, [routes, props.quotes]);

  const cheapestRoute = useMemo(() => {
    return props.routes.reduce(
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
  }, [routes, props.quotes]);

  if (walletsConnected && supportedRoutes.length === 0 && Number(amount) > 0) {
    // Errors are displayed in AmountInput
    return;
  }

  if (supportedRoutes.length === 0 || !walletsConnected || props.hasError) {
    return null;
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
      <Box sx={{ display: 'flex', width: '100%' }}>
        <Typography
          align="left"
          fontSize={16}
          paddingBottom={0}
          marginTop="8px"
          marginBottom={0}
          width="100%"
          textAlign="left"
        >
          Routes
        </Typography>
        {props.isLoading ? (
          <CircularProgress sx={{ alignSelf: 'flex-end' }} size={20} />
        ) : null}
      </Box>

      {props.isLoading && renderRoutes.length === 0 ? (
        <Skeleton variant="rounded" height={153} width="100%" />
      ) : (
        renderRoutes.map(({ name }, index) => {
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
            />
          );
        })
      )}

      {props.routes.length > 1 && (
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
