import Stack from '@mui/material/Stack';
import ProviderLabel from '../ProviderLabel';
import Eta from '../Eta';
import { useTheme } from '@mui/material/styles';
import Collapse from '@mui/material/Collapse';
import React from 'react';
import MaxSlippage from './MaxSlippage';
import MinOutput from './MinOutput';
import { useToggle } from 'usehooks-ts';
import Typography from '@mui/material/Typography';
import { ChevronToggle } from './index';

export interface RouteDetailsProps {
  destChain?: string;
  provider?: string;
  eta?: number;
  selectedRoute?: string;
  sourceChain?: string;
  handleToggleRoutes: () => void;
  quoteSlippageBps?: number;
  minReceived?: number;
  outputToken?: string;
  enableRouteSelector?: boolean;
}

export default function RouteDetails({
  destChain,
  provider,
  eta,
  selectedRoute,
  handleToggleRoutes,
  sourceChain,
  quoteSlippageBps,
  minReceived,
  outputToken,
  enableRouteSelector,
}: RouteDetailsProps) {
  const theme = useTheme();
  const [isShowingDetails, handleChevronClick] = useToggle(false);
  const hasAnyDetails = minReceived || quoteSlippageBps;
  const hasIndicators = !!eta; // Add Fee component here when ready.
  return (
    <Stack direction="column" spacing={0.5} useFlexGap sx={{ width: '100%' }}>
      <Stack
        direction="row"
        sx={{
          paddingLeft: theme.spacing(0.5),
          paddingRight: theme.spacing(0.5),
        }}
        height={18}
        alignItems="center"
        justifyContent="space-between"
      >
        <ProviderLabel
          destChain={destChain}
          provider={provider}
          route={selectedRoute}
          sourceChain={sourceChain}
          onClick={enableRouteSelector ? handleToggleRoutes : undefined}
          enableRouteSelector={enableRouteSelector ?? false}
        />
        <Stack
          direction="row"
          gap={theme.spacing(2)}
          height={18}
          alignItems="center"
          sx={{
            paddingLeft: '8px',
            '&:hover': {
              opacity: 1,
            },
          }}
        >
          <Eta eta={eta} />
        </Stack>

        <Stack
          direction="row"
          sx={{
            transition: '0.3s',
            color: !hasIndicators
              ? theme.palette.text.tertiary
              : theme.palette.text.primary,
            '&:hover': {
              color: theme.palette.text.accent,
            },
          }}
        >
          {!hasIndicators && (
            <Typography
              variant={'body2'}
              sx={{
                fontWeight: 500,
                cursor: 'pointer',
              }}
              onClick={handleChevronClick}
            >
              Details
            </Typography>
          )}
          {hasAnyDetails && (
            <ChevronToggle
              expanded={isShowingDetails}
              onToggle={handleChevronClick}
            />
          )}
        </Stack>
      </Stack>
      {hasAnyDetails && (
        <Collapse in={isShowingDetails} timeout={500}>
          <MaxSlippage slippage={quoteSlippageBps} />
          <MinOutput minOutput={minReceived} outputToken={outputToken} />
        </Collapse>
      )}
    </Stack>
  );
}
