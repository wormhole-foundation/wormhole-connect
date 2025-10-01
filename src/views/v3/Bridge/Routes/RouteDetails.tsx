import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import ProviderLabel from './ProviderLabel';
import Eta from './Eta';
import { Typography } from '@mui/material';
import RoutesLink from './RoutesLink';
import { useTheme } from '@mui/material/styles';
import Collapse from '@mui/material/Collapse';
import React, { useCallback, useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

export interface RouteDetailsProps {
  destChain?: string;
  provider?: string;
  eta?: number;
  selectedRoute?: string;
  sourceChain?: string;
  handleToggleRoutes: () => void;
  quoteSlippageBps: number;
  minReceived: number;
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
  const [isShowingDetails, setShowingDetails] = useState(false);
  const handleChevronClick = useCallback(() => {
    setShowingDetails((prev) => !prev);
  }, [setShowingDetails]);
  return (
    <Stack direction={'column'} spacing={0.5} useFlexGap sx={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 18px',
          width: '100%',
          height: '18px',
        }}
      >
        <ProviderLabel
          destChain={destChain}
          provider={provider}
          route={selectedRoute}
          sourceChain={sourceChain}
        />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'end',
            paddingLeft: '8px',
            width: '100%',
            height: '18px',
            gap: '12px',
          }}
        >
          <Eta eta={eta} />
        </Box>
        {isShowingDetails ? (
          <ExpandLessIcon
            sx={{ cursor: 'pointer' }}
            onClick={handleChevronClick}
          />
        ) : (
          <ExpandMoreIcon
            sx={{ cursor: 'pointer' }}
            onClick={handleChevronClick}
          />
        )}
      </Box>
      <Collapse in={isShowingDetails} timeout={500}>
        {/* Max Slippage Row */}
        <Box
          sx={{
            display: 'flex',
            marginTop: '0px',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            paddingLeft: theme.spacing(3),
            paddingRight: theme.spacing(5),
          }}
        >
          <Typography
            variant="body2"
            fontWeight={500}
            fontSize={12}
            color={theme.palette.text.primary}
            sx={{ display: 'block' }}
          >
            Max slippage
          </Typography>
          <Typography
            variant="body2"
            fontSize={12}
            fontWeight={600}
            color={theme.palette.text.primary}
            sx={{ display: 'block' }}
          >
            {/* Convert bps to percentage */}
            <div>{quoteSlippageBps ? `${quoteSlippageBps / 100}%` : null}</div>
          </Typography>
        </Box>

        {/* Min Output row */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            paddingLeft: theme.spacing(3),
            paddingRight: theme.spacing(5),
          }}
        >
          <Typography
            variant="body2"
            fontSize={12}
            fontWeight={500}
            color={theme.palette.text.primary}
            sx={{ display: 'block' }}
          >
            Minimum output
          </Typography>
          <Typography
            variant="body2"
            fontSize={12}
            fontWeight={600}
            color={theme.palette.text.primary}
            sx={{ display: 'block' }}
          >
            {minReceived ? `${minReceived} ${outputToken}` : null}
          </Typography>
        </Box>
      </Collapse>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'end',
          padding: '0 8px',
          paddingRight: theme.spacing(3),
          marginTop: theme.spacing(2),
          marginBottom: theme.spacing(4),
          width: '100%',
          height: '18px',
        }}
      >
        <RoutesLink onClick={handleToggleRoutes} />
      </Box>
    </Stack>
  );
}
