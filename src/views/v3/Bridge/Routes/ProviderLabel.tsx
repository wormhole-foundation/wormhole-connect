import React from 'react';
import { getRouteProvider } from './utils';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';

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
    <Button
      onClick={enableRouteSelector ? onClick : undefined}
      disableRipple
      variant="text"
      sx={{
        minWidth: 0,
        padding: 0,
        justifyContent: 'flex-start',
        textTransform: 'none',
        color: theme.palette.text.secondary,
        cursor: enableRouteSelector ? 'pointer' : 'default',
        '&:hover': {
          backgroundColor: 'transparent',
          color: enableRouteSelector ? theme.palette.text.accent : 'none',
        },
      }}
    >
      <Stack
        direction="row"
        sx={{
          flexGrow: 1,
          whiteSpace: 'nowrap',
          alignItems: 'center',
          transition: '0.3s',
        }}
      >
        <Typography variant="body2" fontWeight={500}>
          {via ? `Routing via ${via}` : `Route`}
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
    </Button>
  );
}

export default React.memo(ProviderLabel);
