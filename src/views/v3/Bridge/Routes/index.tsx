import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { routes } from '@wormhole-foundation/sdk';

import config from 'config';
import ClockIcon from 'icons/Clock';
import { millisToHumanString } from 'utils';
import { setToNativeToken } from 'store/relay';
import RoutesMobile from 'views/v3/Bridge/Routes/RoutesBottomSheet';
import RoutesDesktop from 'views/v3/Bridge/Routes/RoutesModal';

import type { RootState } from 'store';

type Props = {
  routes: string[];
  selectedRoute?: string;
  onRouteChange: (route: string) => void;
  quotes: Record<string, routes.QuoteResult<routes.Options> | undefined>;
  isLoading: boolean;
};

function Routes({
  routes: routesList,
  selectedRoute,
  onRouteChange,
  quotes,
  isLoading,
}: Props) {
  const dispatch = useDispatch();
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { toNativeToken } = useSelector((state: RootState) => ({
    ...state.relay,
  }));

  const [showModal, setShowModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [highlightedRoute, setHighlightedRoute] = useState<
    string | undefined
  >();
  const [originalToNativeToken, setOriginalToNativeToken] =
    useState<number>(toNativeToken);
  const [originalSelectedRoute, setOriginalSelectedRoute] = useState<
    string | undefined
  >(selectedRoute);

  useEffect(() => {
    // Reset the highlighted route when the selected route changes
    if (selectedRoute && selectedRoute !== highlightedRoute) {
      setHighlightedRoute(selectedRoute);
    }
    // Set highlighted route to the selected route when it changes
    // Triggered only when the selected route changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoute]);

  // Event handlers
  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    // Only revert if route selection changed (not just gas amount on same route)
    if (highlightedRoute !== originalSelectedRoute) {
      setHighlightedRoute(originalSelectedRoute);
      dispatch(setToNativeToken(originalToNativeToken));
    }
  }, [
    highlightedRoute,
    originalSelectedRoute,
    originalToNativeToken,
    dispatch,
  ]);

  const handleCloseDrawer = useCallback(() => {
    setShowDrawer(false);
    // Only revert if route selection changed (not just gas amount on same route)
    if (highlightedRoute !== originalSelectedRoute) {
      setHighlightedRoute(originalSelectedRoute);
      dispatch(setToNativeToken(originalToNativeToken));
    }
  }, [
    highlightedRoute,
    originalSelectedRoute,
    originalToNativeToken,
    dispatch,
  ]);

  const handleToggleRoutes = useCallback(() => {
    // Store the original values when opening modal/drawer
    setOriginalToNativeToken(toNativeToken);
    setOriginalSelectedRoute(selectedRoute);
    if (mobile) {
      setShowDrawer(true);
    } else {
      setShowModal((prev) => !prev);
    }
  }, [mobile, selectedRoute, toNativeToken]);

  const handleRouteSelect = useCallback(
    (route: string) => {
      setHighlightedRoute(route);
      if (toNativeToken !== 0) {
        dispatch(setToNativeToken(0));
      }
    },
    [dispatch, toNativeToken],
  );

  const handleGasTokenChange = useCallback(
    (value: number) => {
      if (value !== toNativeToken) {
        dispatch(setToNativeToken(value));
      }
    },
    [dispatch, toNativeToken],
  );

  const handleRouteConfirm = useCallback(() => {
    if (highlightedRoute) {
      onRouteChange(highlightedRoute);
    }

    // Update the original values as well since user confirmed their selection
    setOriginalToNativeToken(toNativeToken);
    setOriginalSelectedRoute(highlightedRoute);

    mobile ? setShowDrawer(false) : setShowModal(false);
  }, [highlightedRoute, toNativeToken, mobile, onRouteChange]);

  const routesWithQuotes = routesList.filter((rs) => quotes[rs] !== undefined);

  const fastestRoute = routesWithQuotes.reduce(
    (fastest, route) => {
      const quote = quotes[route];
      if (!quote || !quote.success) return fastest;

      if (
        quote.eta !== undefined &&
        quote.eta < fastest.eta &&
        quote.eta < 60_000
      ) {
        return { name: route, eta: quote.eta };
      }
      return fastest;
    },
    { name: '', eta: Infinity },
  );

  const cheapestRoute = routesWithQuotes.reduce(
    (cheapest, route) => {
      const quote = quotes[route];
      const rc = config.routes.get(route);
      if (!quote || !quote.success || !rc.AUTOMATIC_DEPOSIT) return cheapest;

      const amountOut = BigInt(quote.destinationToken.amount.amount);
      if (amountOut > cheapest.amountOut) {
        return { name: route, amountOut };
      }
      return cheapest;
    },
    { name: '', amountOut: 0n },
  );

  const selectedQuote = !selectedRoute
    ? undefined
    : (() => {
        const quoteResult = quotes[selectedRoute];
        return quoteResult?.success ? quoteResult : undefined;
      })();

  const bestRoute = fastestRoute.name
    ? config.routes.get(fastestRoute.name)
    : cheapestRoute.name
    ? config.routes.get(cheapestRoute.name)
    : undefined;

  const routeSection = useMemo(() => {
    if (selectedRoute && selectedRoute !== bestRoute?.rc.meta.name) {
      const route = config.routes.get(selectedRoute);
      return (
        <>
          Route
          {route.rc.meta.provider && (
            <span
              style={{ fontWeight: 500 }}
            >{` via ${route.rc.meta.provider}`}</span>
          )}
        </>
      );
    } else {
      return (
        <>
          Best route
          {bestRoute?.rc.meta.provider && (
            <span
              style={{ fontWeight: 500 }}
            >{` via ${bestRoute?.rc.meta.provider}`}</span>
          )}
        </>
      );
    }
  }, [selectedRoute, bestRoute]);

  const selectButtonDisabled =
    !!selectedRoute && selectedRoute === highlightedRoute;

  // Done fetching and no routes are available.
  // This can be an error case which the message is shown by the parent component.
  if (!isLoading && routesList.length === 0) {
    return <></>;
  }

  return (
    <>
      {isLoading ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '54px',
            width: '100%',
            gap: '12px',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              height: '20px',
              width: '100%',
              justifyContent: 'space-between',
            }}
          >
            <Skeleton
              variant="rounded"
              height={20}
              width="70%"
              sx={{ borderRadius: '20px' }}
            />
            <Skeleton
              variant="rounded"
              height={20}
              width="25%"
              sx={{ borderRadius: '20px' }}
            />
          </Box>
          <Skeleton
            variant="rounded"
            height={20}
            width="100%"
            sx={{ borderRadius: '20px' }}
          />
        </Box>
      ) : (
        <>
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <Stack spacing="12px">
              <Box
                sx={{
                  color: theme.palette.text.primary,
                  fontSize: '14px',
                  fontWeight: 700,
                  opacity: 0.5,
                }}
              >
                {routeSection}
              </Box>
              <Box>
                <Link
                  component="span"
                  data-testid="other-routes-toggle"
                  underline="none"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    color: theme.palette.text.primary,
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 700,
                    opacity: 0.5,
                  }}
                  onClick={handleToggleRoutes}
                >
                  View other routes
                  <ChevronRightIcon
                    fontSize="small"
                    sx={{ marginLeft: '4px' }}
                  />
                </Link>
              </Box>
            </Stack>
            <Box
              sx={{
                display: 'flex',
                fontSize: '14px',
                justifyContent: 'flex-end',
                opacity: 0.5,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  height: '21px',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ClockIcon
                  sx={{ color: '#7A8390', width: '12px', height: '12px' }}
                />
                <Typography
                  component="span"
                  fontSize="14px"
                  lineHeight="14px"
                  sx={{
                    color:
                      selectedQuote?.eta && selectedQuote.eta < 60 * 1000
                        ? theme.palette.success.main
                        : theme.palette.text.primary,
                  }}
                >
                  {selectedQuote?.eta
                    ? millisToHumanString(selectedQuote.eta)
                    : 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </>
      )}
      {mobile ? (
        <RoutesMobile
          open={showDrawer}
          onOpen={() => setShowDrawer(true)}
          onClose={handleCloseDrawer}
          routesWithQuotes={routesWithQuotes}
          highlightedRoute={highlightedRoute}
          quotes={quotes}
          fastestRoute={fastestRoute}
          cheapestRoute={cheapestRoute}
          onRouteSelect={handleRouteSelect}
          onGasChange={handleGasTokenChange}
          onRouteConfirm={handleRouteConfirm}
          selectButtonDisabled={selectButtonDisabled}
        />
      ) : (
        <RoutesDesktop
          open={showModal}
          onClose={handleCloseModal}
          routesWithQuotes={routesWithQuotes}
          highlightedRoute={highlightedRoute}
          quotes={quotes}
          fastestRoute={fastestRoute}
          cheapestRoute={cheapestRoute}
          onRouteSelect={handleRouteSelect}
          onGasChange={handleGasTokenChange}
          onRouteConfirm={handleRouteConfirm}
          selectButtonDisabled={selectButtonDisabled}
        />
      )}
    </>
  );
}

export default memo(Routes);
