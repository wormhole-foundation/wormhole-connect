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

  const renderRoutes = useMemo(() => {
    if (showAll) {
      return routes;
    }

    const selectedRoute = routes.find((route) => route === props.selectedRoute);

    // Special case when we have a selected route
    if (selectedRoute) {
      const topRoutes: Array<string> = [];
      // if the selected route is the fastest, add it first and the cheapest route below
      if (selectedRoute === fastestRoute.name) {
        topRoutes.push(selectedRoute);
        if (cheapestRoute.name && cheapestRoute.name !== selectedRoute) {
          topRoutes.push(cheapestRoute.name);
        }
      } else if (selectedRoute === cheapestRoute.name) {
        // if the selected route is the cheapest add the fastest route first and selected below
        if (fastestRoute.name && fastestRoute.name !== selectedRoute) {
          topRoutes.push(fastestRoute.name);
        }
        topRoutes.push(selectedRoute);
      } else {
        // if the selected route is neither fastest nor cheapest, we add it at the top
        topRoutes.push(selectedRoute);
        if (routes.length > 2) {
          // if we have more than 2 routes in total, meaning there are at least two more routes to show,
          // then we add one of the fastest or cheapest routes below the selected route
          if (fastestRoute.name) {
            // Add the fastest route if it we have one
            topRoutes.push(fastestRoute.name);
          } else if (cheapestRoute.name) {
            // otherwise add the cheapest route
            topRoutes.push(cheapestRoute.name);
          }
        }
      }
      return topRoutes;
    }

    // If we have fastest and cheapest routes, we show them both at the top
    if (!!fastestRoute.name && !!cheapestRoute.name) {
      return routes.slice(0, 2);
    }

    // Otherwise we might have a cheapest route but none qualifying as fastest,
    // so we show the first route at the top
    return routes.slice(0, 1);
  }, [showAll, routes, fastestRoute, cheapestRoute, props.selectedRoute]);

  const hideShowToggle = useMemo(() => {
    // If we have less than 2 routes; or there are 2 but those are the fastest and cheapest routes,
    // we do not show the toggle to view other routes
    if (
      routes.length < 2 ||
      (routes.length === 2 && !!fastestRoute.name && !!cheapestRoute.name)
    ) {
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
  }, [
    cheapestRoute.name,
    styles.otherRoutesToggle,
    fastestRoute.name,
    routes.length,
    showAll,
  ]);

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
        renderRoutes.map((name, index) => {
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
