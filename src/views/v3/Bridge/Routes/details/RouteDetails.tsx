import Stack from '@mui/material/Stack';
import ProviderLabel from '../ProviderLabel';
import Eta from '../Eta';
import RoutesLink from '../RoutesLink';
import { useTheme } from '@mui/material/styles';
import Collapse from '@mui/material/Collapse';
import React, { useMemo } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import MaxSlippage from './MaxSlippage';
import MinOutput from './MinOutput';
import { useToggle } from 'usehooks-ts';

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
}: RouteDetailsProps) {
  const theme = useTheme();
  const [isShowingDetails, handleChevronClick] = useToggle(false);
  const hasAnyDetails = useMemo(() => {
    return minReceived || quoteSlippageBps;
  }, [minReceived, quoteSlippageBps]);
  return (
    <Stack direction={'column'} spacing={0.5} useFlexGap sx={{ width: '100%' }}>
      <Stack
        direction={'row'}
        sx={{ padding: '0 18px' }}
        height={18}
        alignItems={'center'}
      >
        <ProviderLabel
          destChain={destChain}
          provider={provider}
          route={selectedRoute}
          sourceChain={sourceChain}
        />
        <Stack
          direction={'row'}
          gap={theme.spacing(2)}
          height={18}
          alignItems={'center'}
          sx={{
            paddingLeft: '8px',
          }}
        >
          <Eta eta={eta} />
        </Stack>
        {isShowingDetails ? (
          <ExpandLessIcon
            sx={{ cursor: 'pointer', opacity: 0.5 }}
            onClick={handleChevronClick}
          />
        ) : (
          <ExpandMoreIcon
            sx={{ cursor: 'pointer', opacity: 0.5 }}
            onClick={handleChevronClick}
          />
        )}
      </Stack>
      {hasAnyDetails && (
        <Collapse in={isShowingDetails} timeout={500}>
          <MaxSlippage slippage={quoteSlippageBps} />
          <MinOutput minOutput={minReceived} outputToken={outputToken} />
        </Collapse>
      )}
      <Stack
        direction={'row'}
        justifyContent={'end'}
        height={18}
        sx={{
          padding: '0 8px',
          paddingRight: theme.spacing(3),
          marginTop: theme.spacing(2),
          marginBottom: theme.spacing(4),
        }}
      >
        <RoutesLink onClick={handleToggleRoutes} />
      </Stack>
    </Stack>
  );
}
