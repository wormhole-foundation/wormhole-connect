import React from 'react';
import { getRouteProvider } from './utils';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import RouteSwitchIcon from 'icons/RouteSwitch';

interface ProviderLabelProps {
  destChain?: string;
  provider?: string;
  route?: string;
  sourceChain?: string;
  sourceTokenSymbol?: string;
  onClick?: () => void;
}

function ProviderLabel({
  destChain,
  provider,
  route,
  sourceChain,
  sourceTokenSymbol,
  onClick,
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
      onClick={onClick}
      disableRipple
      variant="text"
      sx={{
        minWidth: 0,
        padding: 0,
        justifyContent: 'flex-start',
        textTransform: 'none',
        color: theme.palette.text.secondary,
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'transparent',
          color: theme.palette.text.accent,
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
        <RouteSwitchIcon
          sx={{
            width: 12,
            height: 12,
            marginLeft: theme.spacing(0.5),
          }}
        />
      </Stack>
    </Button>
  );
}

export default React.memo(ProviderLabel);
