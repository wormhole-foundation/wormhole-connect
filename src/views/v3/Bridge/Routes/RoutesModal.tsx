import React, { memo } from 'react';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import type { routes } from '@wormhole-foundation/sdk';

import Button from 'components/v3/Button';
import RoutesList from './RoutesList';

interface RoutesDesktopProps {
  open: boolean;
  routesWithQuotes: string[];
  highlightedRoute?: string;
  quotes: Record<string, routes.QuoteResult<routes.Options> | undefined>;
  fastestRoute: { name: string; eta: number };
  cheapestRoute: { name: string; amountOut: bigint };
  selectButtonDisabled: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onGasChange: (value: number) => void;
  onRouteSelect: (route: string) => void;
  onRouteConfirm: () => void;
}

function RoutesDesktop({
  open,
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
}: RoutesDesktopProps) {
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
      <IconButton
        sx={{ opacity: 0.5, padding: 0 }}
        onClick={onClose}
        aria-label="Close routes"
        data-testid="routes-close-button"
      >
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
      aria-label="Select route"
      data-testid="select-route-button"
      fullWidth
    >
      <Typography fontSize="16px" fontWeight={600} textTransform="none">
        Select Route
      </Typography>
    </Button>
  );

  return (
    <Modal
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      open={open}
      onClose={onClose}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)', // Safari support
          },
        },
      }}
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
    </Modal>
  );
}

export default memo(RoutesDesktop);
