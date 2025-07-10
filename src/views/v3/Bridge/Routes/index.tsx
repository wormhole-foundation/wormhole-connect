import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import type { routes } from '@wormhole-foundation/sdk';

import { getBestRoutes } from 'utils/routes';
import { OPACITY } from 'utils/style';
import type { RootState } from 'store';
import { setToNativeToken } from 'store/relay';
import RoutesMobile from './RoutesBottomSheet';
import RoutesDesktop from './RoutesModal';
import RoutesLoader from './RoutesLoader';
import RoutesLink from './RoutesLink';
import Eta from './Eta';

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
  const theme: any = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { toNativeToken } = useSelector((state: RootState) => ({
    ...state.relay,
  }));

  const { toChain: destChain, fromChain: sourceChain } = useSelector(
    (state: RootState) => state.transferInput,
  );

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
  const [selectedRouteBadge, setSelectedRouteBadge] =
    useState<string>('fastest');

  const routesWithQuotes = routesList.filter((rs) => quotes[rs] !== undefined);

  const { fastestRoute, cheapestRoute } = getBestRoutes(
    routesWithQuotes,
    quotes,
  );

  const selectedQuote = useMemo(() => {
    if (!selectedRoute) {
      return undefined;
    }
    const quoteResult = quotes[selectedRoute];
    return quoteResult?.success ? quoteResult : undefined;
  }, [selectedRoute, quotes]);

  useEffect(() => {
    // Reset the highlighted route when the selected route changes
    if (selectedRoute) {
      if (selectedRoute !== highlightedRoute) {
        setHighlightedRoute(selectedRoute);
      }

      // Set the selected route badge based on the selected route
      if (selectedRoute === fastestRoute.name) {
        setSelectedRouteBadge('fastest');
      } else if (selectedRoute === cheapestRoute.name) {
        setSelectedRouteBadge('cheapest');
      } else {
        setSelectedRouteBadge('');
      }
    }

    // Set highlighted route to the selected route when it changes
    // Triggered only when the selected route changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoute, fastestRoute.name, cheapestRoute.name]);

  const styles = useMemo(
    () => ({
      toggleGroup: {
        height: '32px',
        width: '100%',
        minWidth: '174px',
        gap: '4px',
        padding: '4px 0',
      },
      toggleButton: {
        border: 'none',
        borderRadius: '24px !important', // We need to force override MUI's default border radius
        color: theme.palette.text.secondary,
        width: '100%',
        padding: '4px 0',
        fontSize: '12px',
        fontWeight: 600,
        textTransform: 'none',
        '&.Mui-selected': {
          backgroundColor: theme.palette.primary.main + OPACITY[25],
          color: theme.palette.text.primary,
        },
      },
      toggleButtonLabel: {
        fontSize: '12px',
        fontWeight: 600,
        textTransform: 'none',
      },
    }),
    [theme],
  );

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
      if (route === highlightedRoute) {
        // If the route is already highlighted, do nothing
        // This can happen if the user clicks the same route again
        return;
      }

      setHighlightedRoute(route);

      if (toNativeToken !== 0) {
        dispatch(setToNativeToken(0));
      }
    },
    [dispatch, highlightedRoute, toNativeToken],
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

    if (mobile) {
      setShowDrawer(false);
    } else {
      setShowModal(false);
    }
  }, [highlightedRoute, toNativeToken, mobile, onRouteChange]);

  const routeSelectionPills = useMemo(() => {
    if (
      fastestRoute.name &&
      cheapestRoute.name &&
      cheapestRoute.name !== fastestRoute.name
    ) {
      return (
        <Box sx={{ maxWidth: '174px' }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={selectedRouteBadge}
            sx={styles.toggleGroup}
            onChange={(_, value) => {
              if (value === 'fastest' && fastestRoute.name) {
                onRouteChange(fastestRoute.name);
                setSelectedRouteBadge('fastest');
              } else if (value === 'cheapest' && cheapestRoute.name) {
                onRouteChange(cheapestRoute.name);
                setSelectedRouteBadge('cheapest');
              }
            }}
          >
            <ToggleButton
              disableRipple
              value="fastest"
              disabled={!fastestRoute.name}
              sx={styles.toggleButton}
            >
              Fastest
            </ToggleButton>
            <ToggleButton
              disableRipple
              value="cheapest"
              disabled={!cheapestRoute.name}
              sx={styles.toggleButton}
            >
              Cheapest
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      );
    }

    return null;
  }, [
    fastestRoute.name,
    cheapestRoute.name,
    selectedRouteBadge,
    styles.toggleGroup,
    styles.toggleButton,
    onRouteChange,
  ]);

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
        <RoutesLoader />
      ) : (
        <>
          <Stack
            sx={{
              width: '100%',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                width: '100%',
                justifyContent: 'flex-start',
                alignItems: 'center',
              }}
            >
              {routeSelectionPills}
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <RoutesLink
                destChain={destChain}
                route={selectedRoute}
                sourceChain={sourceChain}
                onClick={handleToggleRoutes}
              />
              <Eta eta={selectedQuote?.eta} />
            </Box>
          </Stack>
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
