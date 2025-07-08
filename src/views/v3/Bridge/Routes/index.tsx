import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Modal from '@mui/material/Modal';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Typography from '@mui/material/Typography';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { routes } from '@wormhole-foundation/sdk';

import config from 'config';
import ClockIcon from 'icons/Clock';
import CloseIcon from '@mui/icons-material/Close';
import SingleRoute from 'views/v3/Bridge/Routes/SingleRoute';
import { millisToHumanString } from 'utils';
import Button from 'components/v3/Button';
import { setToNativeToken } from 'store/relay';

import type { RootState } from 'store';

type Props = {
  routes: string[];
  selectedRoute?: string;
  onRouteChange: (route: string) => void;
  quotes: Record<string, routes.QuoteResult<routes.Options> | undefined>;
  isLoading: boolean;
};

const Routes = ({
  routes: routesList,
  selectedRoute,
  onRouteChange,
  quotes,
  isLoading,
}: Props) => {
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
  const [gasTokenAmount, setGasTokenAmount] = useState<number>(
    toNativeToken * 100,
  );

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
    setHighlightedRoute(selectedRoute);
    setShowModal(false);
  }, [selectedRoute]);

  const handleCloseDrawer = useCallback(() => {
    setShowDrawer(false);
  }, []);

  const handleToggleRoutes = useCallback(() => {
    if (mobile) {
      setShowDrawer(true);
    } else {
      setShowModal((prev) => !prev);
    }
  }, [mobile]);

  const handleRouteSelect = useCallback((route: string) => {
    setHighlightedRoute(route);
  }, []);

  const handleGasTokenChange = useCallback((value: number) => {
    setGasTokenAmount(value);
  }, []);

  const handleSelectRoute = useCallback(() => {
    if (highlightedRoute) {
      onRouteChange(highlightedRoute);
    }
    if (gasTokenAmount !== toNativeToken) {
      dispatch(setToNativeToken(gasTokenAmount));
    }
    mobile ? setShowDrawer(false) : setShowModal(false);
  }, [
    highlightedRoute,
    onRouteChange,
    gasTokenAmount,
    toNativeToken,
    dispatch,
    mobile,
  ]);

  const routesWithQuotes = useMemo(() => {
    return routesList.filter((rs) => quotes[rs] !== undefined);
  }, [routesList, quotes]);

  const fastestRoute = useMemo(() => {
    return routesWithQuotes.reduce(
      (fastest, route) => {
        const quote = quotes[route];
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
  }, [routesWithQuotes, quotes]);

  const cheapestRoute = useMemo(() => {
    return routesWithQuotes.reduce(
      (cheapest, route) => {
        const quote = quotes[route];
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
  }, [routesWithQuotes, quotes]);

  const selectedQuote = useMemo(() => {
    if (!selectedRoute) {
      return undefined;
    }
    const quoteResult = quotes[selectedRoute];
    const quote = quoteResult?.success ? quoteResult : undefined;
    return quote;
  }, [selectedRoute, quotes]);

  const handleCloseRoutes = useCallback(() => {
    mobile ? handleCloseDrawer() : handleCloseModal();
  }, [mobile, handleCloseDrawer, handleCloseModal]);

  const bestRoute = useMemo(() => {
    if (fastestRoute.name) {
      return config.routes.get(fastestRoute.name);
    } else if (cheapestRoute.name) {
      return config.routes.get(cheapestRoute.name);
    }
    return undefined;
  }, [cheapestRoute.name, fastestRoute.name]);

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

  const selectButtonDisabled = useMemo(() => {
    return (
      !!selectedRoute &&
      selectedRoute === highlightedRoute &&
      toNativeToken === gasTokenAmount / 100
    );
  }, [selectedRoute, highlightedRoute, toNativeToken, gasTokenAmount]);

  // Routes drawer for mobile
  const routesDrawer = useMemo(
    () => (
      <SwipeableDrawer
        anchor="bottom"
        open={showDrawer}
        slotProps={{
          paper: {
            sx: {
              background: theme.palette.input.background,
              borderRadius: '8px',
              height: 'calc(100vh - 40px)', // Force full-height on small mobile devices with 40px padding at the top
              maxWidth: '100vw', // Force full-width on small mobile devices
            },
          },
        }}
        transitionDuration={200}
        onOpen={() => setShowDrawer(true)}
        onClose={handleCloseDrawer}
      >
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            padding: '8px',
            borderRadius: '12px',
            gap: '16px',
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '420px',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <Typography component={'span'} fontSize="16px" fontWeight={600}>
              Routes
            </Typography>
            <IconButton
              sx={{ opacity: 0.5, padding: 0 }}
              onClick={handleCloseRoutes}
            >
              <CloseIcon sx={{ height: '24px', width: '24px' }} />
            </IconButton>
          </Box>
          <Stack sx={{ gap: '16px', overflowY: 'auto', maxHeight: '75vh' }}>
            {routesWithQuotes.map((name) => {
              const isSelected = name === highlightedRoute;
              const quoteResult = quotes[name];
              const quote = quoteResult?.success ? quoteResult : undefined;
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
                  isOnlyChoice={routesWithQuotes.length === 1}
                  onSelect={handleRouteSelect}
                  onGasChange={handleGasTokenChange}
                  quote={quote}
                />
              );
            })}
          </Stack>
          <Button
            variant="primary"
            styleOverrides={{
              padding: '16px 24px',
              height: '48px',
              borderRadius: '48px',
            }}
            onClick={handleSelectRoute}
            disabled={selectButtonDisabled}
            data-testid="select-route-button"
            fullWidth
          >
            <Typography fontSize="16px" fontWeight={600} textTransform="none">
              Select
            </Typography>
          </Button>
        </Box>
      </SwipeableDrawer>
    ),
    [
      showDrawer,
      theme.palette.input.background,
      theme.palette.background.paper,
      handleCloseDrawer,
      handleCloseRoutes,
      routesWithQuotes,
      highlightedRoute,
      quotes,
      fastestRoute.name,
      cheapestRoute.name,
      handleRouteSelect,
      handleGasTokenChange,
      handleSelectRoute,
      selectButtonDisabled,
    ],
  );

  // Routes modal for desktop
  const routesModal = useMemo(
    () => (
      <Modal
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        open={showModal}
        onClose={handleCloseModal}
      >
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            padding: '24px',
            borderRadius: '12px',
            gap: '16px',
            display: 'flex',
            flexDirection: 'column',
            width: '420px',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)', // Safari support
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <Typography component={'span'} fontSize="16px" fontWeight={600}>
              Routes
            </Typography>
            <IconButton
              sx={{ opacity: 0.5, padding: 0 }}
              onClick={handleCloseRoutes}
            >
              <CloseIcon sx={{ height: '24px', width: '24px' }} />
            </IconButton>
          </Box>
          <Stack sx={{ gap: '16px', overflowY: 'auto', maxHeight: '75vh' }}>
            {routesWithQuotes.map((name) => {
              const isSelected = name === highlightedRoute;
              const quoteResult = quotes[name];
              const quote = quoteResult?.success ? quoteResult : undefined;
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
                  isOnlyChoice={routesWithQuotes.length === 1}
                  onSelect={handleRouteSelect}
                  onGasChange={handleGasTokenChange}
                  quote={quote}
                />
              );
            })}
          </Stack>
          <Button
            variant="primary"
            styleOverrides={{
              padding: '16px 24px',
              height: '48px',
              borderRadius: '48px',
            }}
            onClick={handleSelectRoute}
            disabled={selectButtonDisabled}
            data-testid="select-route-button"
            fullWidth
          >
            <Typography fontSize="16px" fontWeight={600} textTransform="none">
              Select Route
            </Typography>
          </Button>
        </Box>
      </Modal>
    ),
    [
      showModal,
      theme.palette.background.paper,
      handleCloseModal,
      handleCloseRoutes,
      routesWithQuotes,
      highlightedRoute,
      quotes,
      fastestRoute.name,
      cheapestRoute.name,
      handleRouteSelect,
      handleGasTokenChange,
      handleSelectRoute,
      selectButtonDisabled,
    ],
  );

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
          {mobile ? routesDrawer : routesModal}
        </>
      )}
    </>
  );
};

export default React.memo(Routes);
