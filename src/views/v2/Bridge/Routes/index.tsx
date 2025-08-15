import React, { useMemo, useState } from 'react';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { useTheme } from '@mui/material';

import config from 'config';
import SingleRoute from 'views/v2/Bridge/Routes/SingleRoute';

import type { routes } from '@wormhole-foundation/sdk';
import { Box, CircularProgress, Skeleton } from '@mui/material';

type Props = {
  routes: string[];
  selectedRoute?: string;
  onRouteChange: (route: string) => void;
  quotes: Record<string, routes.QuoteResult<routes.Options> | undefined>;
  isLoading: boolean;
};

const Routes = ({ ...props }: Props) => {
  const theme = useTheme();
  const [showAll, setShowAll] = useState(false);

  const styles = useMemo(
    () => ({
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
    }),
    [theme],
  );

  const routes = useMemo(() => {
    return props.routes.filter((rs) => props.quotes[rs] !== undefined);
  }, [props.routes, props.quotes]);

  const fastestRoute = useMemo(() => {
    return routes.reduce(
      (fastest, route) => {
        const quote = props.quotes[route];
        if (!quote || !quote.success) return fastest;

        if (
          quote.eta !== undefined &&
          quote.eta < fastest.eta &&
          quote.eta < 60_000
        ) {
          return { name: route, eta: quote.eta };
        } else {
          return fastest;
        }
      },
      { name: '', eta: Infinity },
    );
  }, [routes, props.quotes]);

  const cheapestRoute = useMemo(() => {
    return routes.reduce(
      (cheapest, route) => {
        const quote = props.quotes[route];
        const rc = config.routes.get(route);
        if (!quote || !quote.success || !rc.AUTOMATIC_DEPOSIT) return cheapest;

        const amountOut = BigInt(quote.destinationToken.amount.amount);
        if (amountOut > cheapest.amountOut) {
          return { name: route, amountOut };
        } else {
          return cheapest;
        }
      },
      { name: '', amountOut: 0n },
    );
  }, [routes, props.quotes]);

  // Find manual routes (routes without AUTOMATIC_DEPOSIT)
  const manualRoutes = useMemo(() => {
    return routes.filter((route) => {
      const rc = config.routes.get(route);
      return rc && !rc.AUTOMATIC_DEPOSIT;
    });
  }, [routes]);

  const renderRoutes = useMemo(() => {
    if (showAll) {
      return routes;
    }

    const selectedRoute = routes.find((route) => route === props.selectedRoute);

    // Special case when we have a selected route
    if (selectedRoute) {
      const topRoutes: Array<string> = [];

      const isSelectedFastest = selectedRoute === fastestRoute.name;
      const isSelectedCheapest = selectedRoute === cheapestRoute.name;

      if (isSelectedFastest) {
        // Selected is fastest: show selected first, then cheapest
        topRoutes.push(selectedRoute);
        if (cheapestRoute.name && cheapestRoute.name !== selectedRoute) {
          topRoutes.push(cheapestRoute.name);
        }
      } else if (isSelectedCheapest) {
        // Selected is cheapest: show fastest first, then selected
        if (fastestRoute.name && fastestRoute.name !== selectedRoute) {
          topRoutes.push(fastestRoute.name);
        }
        topRoutes.push(selectedRoute);
      } else {
        // Selected is neither: show selected first, then fastest or cheapest if we have >2 routes
        topRoutes.push(selectedRoute);
        if (routes.length > 2) {
          const routeToAdd = fastestRoute.name || cheapestRoute.name;
          if (routeToAdd) {
            topRoutes.push(routeToAdd);
          }
        }
      }

      // Add manual routes that aren't already in topRoutes
      return [...new Set([...topRoutes, ...manualRoutes])];
    }

    const defaultRoutes: Array<string> = [];

    if (fastestRoute.name) {
      defaultRoutes.push(fastestRoute.name);
    }
    if (cheapestRoute.name && cheapestRoute.name !== fastestRoute.name) {
      defaultRoutes.push(cheapestRoute.name);
    }

    // Always include manual routes in the default view
    const uniqueDefaultRoutes = [
      ...new Set([...defaultRoutes, ...manualRoutes]),
    ];

    if (uniqueDefaultRoutes.length === 0 && routes.length > 0) {
      return routes.slice(0, 1);
    }

    return uniqueDefaultRoutes;
  }, [
    showAll,
    routes,
    fastestRoute,
    cheapestRoute,
    props.selectedRoute,
    manualRoutes,
  ]);

  const hideShowToggle = useMemo(() => {
    // Check if we're showing all available routes already
    if (renderRoutes.length === routes.length) {
      return null;
    }

    return (
      <Link
        sx={styles.otherRoutesToggle}
        data-testid="other-routes-toggle"
        onClick={() => setShowAll((prev) => !prev)}
      >
        {showAll ? 'Hide other routes' : 'View other routes'}
      </Link>
    );
  }, [renderRoutes.length, routes.length, styles.otherRoutesToggle, showAll]);

  return (
    <>
      {props.isLoading || renderRoutes.length > 0 ? (
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
      ) : null}

      {props.isLoading && renderRoutes.length === 0 ? (
        <Skeleton variant="rounded" height={153} width="100%" />
      ) : (
        renderRoutes.map((name) => {
          const isSelected = name === props.selectedRoute;
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
              route={name}
              error={quoteError}
              isSelected={isSelected && !quoteError}
              isFastest={name === fastestRoute.name}
              isCheapest={name === cheapestRoute.name}
              isOnlyChoice={routes.length === 1}
              onSelect={props.onRouteChange}
              quote={quote}
            />
          );
        })
      )}
      {hideShowToggle}
    </>
  );
};

export default Routes;
