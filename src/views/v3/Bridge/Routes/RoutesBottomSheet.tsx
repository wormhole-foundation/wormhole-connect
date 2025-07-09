import React, { memo, useMemo } from 'react';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import { routes } from '@wormhole-foundation/sdk';

import Button from 'components/v3/Button';
import SingleRoute from 'views/v3/Bridge/Routes/SingleRoute';

interface RoutesMobileProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  routesWithQuotes: string[];
  highlightedRoute?: string;
  quotes: Record<string, routes.QuoteResult<routes.Options> | undefined>;
  fastestRoute: { name: string; eta: number };
  cheapestRoute: { name: string; amountOut: bigint };
  onRouteSelect: (route: string) => void;
  onGasChange: (value: number) => void;
  onSelectRoute: () => void;
  selectButtonDisabled: boolean;
}

function RoutesMobile({
  open,
  onOpen,
  onClose,
  routesWithQuotes,
  highlightedRoute,
  quotes,
  fastestRoute,
  cheapestRoute,
  onRouteSelect,
  onGasChange,
  onSelectRoute,
  selectButtonDisabled,
}: RoutesMobileProps) {
  const theme = useTheme();

  // Header section - static content, no need to memoize
  const routesHeader = (
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
      <IconButton sx={{ opacity: 0.5, padding: 0 }} onClick={onClose}>
        <CloseIcon sx={{ height: '24px', width: '24px' }} />
      </IconButton>
    </Box>
  );

  // List section - memoize because it involves expensive map operation
  const routesList = useMemo(
    () => (
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
              onSelect={onRouteSelect}
              onGasChange={onGasChange}
              quote={quote}
            />
          );
        })}
      </Stack>
    ),
    [
      routesWithQuotes,
      highlightedRoute,
      quotes,
      fastestRoute.name,
      cheapestRoute.name,
      onRouteSelect,
      onGasChange,
    ],
  );

  // Select button - simple button, changes rarely, no need to memoize
  const selectRoute = (
    <Button
      variant="primary"
      styleOverrides={{
        padding: '16px 24px',
        height: '48px',
        borderRadius: '48px',
      }}
      onClick={onSelectRoute}
      disabled={selectButtonDisabled}
      data-testid="select-route-button"
      fullWidth
    >
      <Typography fontSize="16px" fontWeight={600} textTransform="none">
        Select
      </Typography>
    </Button>
  );

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
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
      onOpen={onOpen}
      onClose={onClose}
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
        {routesHeader}
        {routesList}
        {selectRoute}
      </Box>
    </SwipeableDrawer>
  );
}

export default memo(RoutesMobile);
