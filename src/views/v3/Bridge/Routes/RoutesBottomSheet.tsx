import React, { memo } from 'react';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import type { routes } from '@wormhole-foundation/sdk';

import Button from 'components/v3/Button';
import RoutesList from './RoutesList';

interface RoutesMobileProps {
  open: boolean;
  routesWithQuotes: string[];
  highlightedRoute?: string;
  quotes: Record<string, routes.QuoteResult<routes.Options> | undefined>;
  fastestRoute: { name: string; eta: number };
  cheapestRoute: { name: string; amountOut: bigint };
  selectButtonDisabled: boolean;
  isLoading?: boolean;
  onOpen: () => void;
  onClose: () => void;
  onGasChange: (value: number) => void;
  onRouteSelect: (route: string) => void;
  onRouteConfirm: () => void;
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
  selectButtonDisabled,
  isLoading,
  onRouteSelect,
  onGasChange,
  onRouteConfirm,
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

  // Select button - simple button, changes rarely, no need to memoize
  const selectRouteButton = (
    <Button
      variant="primary"
      styleOverrides={{
        padding: '16px 24px',
        height: '48px',
        borderRadius: '48px',
      }}
      onClick={onRouteConfirm}
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
        <RoutesList
          routesWithQuotes={routesWithQuotes}
          highlightedRoute={highlightedRoute}
          quotes={quotes}
          fastestRoute={fastestRoute}
          cheapestRoute={cheapestRoute}
          isLoading={isLoading}
          onRouteSelect={onRouteSelect}
          onGasChange={onGasChange}
        />
        {selectRouteButton}
      </Box>
    </SwipeableDrawer>
  );
}

export default memo(RoutesMobile);
