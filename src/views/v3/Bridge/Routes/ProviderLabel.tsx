import React from 'react';
import { getRouteProvider } from './utils';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { useTheme } from '@mui/material/styles';
interface ProviderLabelProps {
  destChain?: string;
  provider?: string;
  route?: string;
  sourceChain?: string;
  sourceTokenSymbol?: string;
  onClick?: () => void;
  enableRouteSelector: boolean;
}

function ProviderLabel({
  destChain,
  provider,
  route,
  sourceChain,
  sourceTokenSymbol,
  onClick,
  enableRouteSelector,
}: ProviderLabelProps) {
  const via = getRouteProvider(
    destChain,
    route,
    sourceChain,
    sourceTokenSymbol,
    provider,
  );

  const theme = useTheme();

  return (
    <Stack
      direction="row"
      sx={{
        flexGrow: 1,
        whiteSpace: 'nowrap',
        cursor: enableRouteSelector ? 'pointer' : 'auto',
        alignItems: 'center',
        transition: '0.3s',
        color: theme.palette.text.tertiary,
        '&:hover': {
          color: enableRouteSelector ? theme.palette.text.accent : 'none',
          opacity: 1,
        },
      }}
      onClick={enableRouteSelector ? onClick : undefined}
    >
      <Typography variant="body2" fontWeight={500}>
        Routing via {via ?? 'route'}
      </Typography>
      {enableRouteSelector && (
        <ChevronRight
          sx={{
            width: 16,
            height: 16,
          }}
        />
      )}
    </Stack>
  );
}

export default React.memo(ProviderLabel);
