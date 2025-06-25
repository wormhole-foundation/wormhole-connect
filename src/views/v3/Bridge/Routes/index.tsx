import React, { useMemo, useState } from 'react';
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

const Routes = ({ ...props }: Props) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { toNativeToken } = useSelector((state: RootState) => ({
    ...state.relay,
  }));

  const [showModal, setShowModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [highlightedRoute, setHighlightedRoute] = useState<string | undefined>(
    props.selectedRoute,
  );
  const [gasTokenAmount, setGasTokenAmount] = useState<number>(
    toNativeToken * 100,
  );

  const routesWithQuotes = useMemo(() => {
    return props.routes.filter((rs) => props.quotes[rs] !== undefined);
  }, [props.routes, props.quotes]);

  const fastestRoute = useMemo(() => {
    return routesWithQuotes.reduce(
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
  }, [routesWithQuotes, props.quotes]);

  const cheapestRoute = useMemo(() => {
    return routesWithQuotes.reduce(
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
  }, [routesWithQuotes, props.quotes]);

  const selectedQuote = useMemo(() => {
    if (!props.selectedRoute) {
      return undefined;
    }
    const quoteResult = props.quotes[props.selectedRoute];
    const quote = quoteResult?.success ? quoteResult : undefined;
    return quote;
  }, [props.selectedRoute, props.quotes]);

  const routesHeader = useMemo(
    () => (
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
          onClick={() => (mobile ? setShowDrawer(false) : setShowModal(false))}
        >
          <CloseIcon sx={{ height: '24px', width: '24px' }} />
        </IconButton>
      </Box>
    ),
    [mobile],
  );

  const routes = useMemo(
    () => (
      <Stack sx={{ gap: '16px', overflowY: 'auto', maxHeight: '75vh' }}>
        {routesWithQuotes.map((name, index) => {
          const isSelected = name === highlightedRoute;
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
              isOnlyChoice={routesWithQuotes.length === 1}
              onSelect={(r) => {
                setHighlightedRoute(r);
              }}
              onGasChange={(value: number) => setGasTokenAmount(value)}
              quote={quote}
            />
          );
        })}
      </Stack>
    ),
    [
      cheapestRoute.name,
      fastestRoute.name,
      highlightedRoute,
      props.quotes,
      routesWithQuotes,
    ],
  );

  const bestRoute = useMemo(() => {
    if (fastestRoute.name) {
      return config.routes.get(fastestRoute.name);
    } else if (cheapestRoute.name) {
      return config.routes.get(cheapestRoute.name);
    }
    return undefined;
  }, [cheapestRoute.name, fastestRoute.name]);

  const timeToDestination = useMemo(
    () => (
      <Box
        sx={{
          display: 'flex',
          height: '21px',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <ClockIcon sx={{ color: '#7A8390', width: '12px', height: '12px' }} />
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
          {selectedQuote?.eta ? millisToHumanString(selectedQuote.eta) : 'N/A'}
        </Typography>
      </Box>
    ),
    [selectedQuote, theme.palette.success.main, theme.palette.text.primary],
  );

  const routeDetails = useMemo(() => {
    let routeSection: React.ReactNode;

    if (
      props.selectedRoute &&
      props.selectedRoute !== bestRoute?.rc.meta.name
    ) {
      const selectedRoute = config.routes.get(props.selectedRoute);
      routeSection = (
        <>
          Route
          <span
            style={{ fontWeight: 500 }}
          >{` via ${selectedRoute.rc.meta.provider}`}</span>
        </>
      );
    } else {
      routeSection = (
        <>
          Best route
          <span
            style={{ fontWeight: 500 }}
          >{` via ${bestRoute?.rc.meta.provider}`}</span>
        </>
      );
    }

    return (
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
          {/* Temp: Gas top off will be added in phase-2 of Connect re-design */}
          {/* <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: theme.palette.text.primary,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 700,
              opacity: 0.5,
            }}
          >
            Include gas top off
            <ChevronRightIcon fontSize="small" sx={{ marginLeft: '4px' }} />
          </Box> */}
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
              onClick={() =>
                mobile ? setShowDrawer(true) : setShowModal((prev) => !prev)
              }
            >
              View other routes
              <ChevronRightIcon fontSize="small" sx={{ marginLeft: '4px' }} />
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
          {timeToDestination}
        </Box>
      </Box>
    );
  }, [
    bestRoute?.rc.meta.name,
    bestRoute?.rc.meta.provider,
    mobile,
    props.selectedRoute,
    theme.palette.text.primary,
    timeToDestination,
  ]);

  const selectButtonDisabled = useMemo(() => {
    return (
      !!props.selectedRoute &&
      props.selectedRoute === highlightedRoute &&
      toNativeToken === gasTokenAmount / 100
    );
  }, [props.selectedRoute, highlightedRoute, toNativeToken, gasTokenAmount]);

  const selectButton = useMemo(
    () => (
      <Button
        variant="primary"
        sx={{
          padding: '16px 24px',
          height: '48px',
          borderRadius: '48px',
        }}
        onClick={() => {
          if (highlightedRoute) {
            // Set the selected route
            props.onRouteChange(highlightedRoute);
          }
          // If there is a new gas drop off amount, update toNativeToken
          if (gasTokenAmount !== toNativeToken) {
            dispatch(setToNativeToken(gasTokenAmount));
          }
          mobile ? setShowDrawer(false) : setShowModal(false);
        }}
        disabled={selectButtonDisabled}
        data-testid="select-route-button"
        fullWidth
      >
        <Typography fontSize="16px" fontWeight={600} textTransform="none">
          {mobile ? 'Select' : 'Select Route'}
        </Typography>
      </Button>
    ),
    [
      selectButtonDisabled,
      mobile,
      highlightedRoute,
      gasTokenAmount,
      toNativeToken,
      props,
      dispatch,
    ],
  );

  // Done fetching and no routes are available.
  // This can be an error case which the message is shown by the parent component.
  if (!props.isLoading && props.routes.length === 0) {
    return <></>;
  }

  return (
    <>
      {props.isLoading ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '54px',
            width: '100%',
            gap: '12px',
          }}
        >
          <Skeleton
            variant="rounded"
            height={20}
            width="100%"
            sx={{ borderRadius: '20px' }}
          />
          <Skeleton
            variant="rounded"
            height={20}
            width="100%"
            sx={{ borderRadius: '20px' }}
          />
        </Box>
      ) : (
        <>
          {routeDetails}
          {mobile ? (
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
              onClose={() => setShowDrawer(false)}
            >
              <Box
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  padding: '8px',
                  borderRadius: '12px',
                  gap: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  width: '420px',
                }}
              >
                {routesHeader}
                {routes}
                {selectButton}
              </Box>
            </SwipeableDrawer>
          ) : (
            <Modal
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              open={showModal}
              onClose={() => setShowModal(false)}
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
                }}
              >
                {routesHeader}
                {routes}
                {selectButton}
              </Box>
            </Modal>
          )}
        </>
      )}
    </>
  );
};

export default Routes;
