import React from 'react';
import { getRouteProvider } from './utils';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

interface ProviderLabelProps {
  destChain?: string;
  provider?: string;
  route?: string;
  sourceChain?: string;
  sourceTokenSymbol?: string;
}

function ProviderLabel({
  destChain,
  provider,
  route,
  sourceChain,
  sourceTokenSymbol,
}: ProviderLabelProps) {
  const via = getRouteProvider(
    destChain,
    route,
    sourceChain,
    sourceTokenSymbol,
    provider,
  );

  if (!via) {
    return 'Route';
  }

  return (
    <Stack direction="row" style={{ flexGrow: 1, whiteSpace: 'nowrap' }}>
      <Typography variant={'body2'} fontWeight={500}>
        Routing via {via}
      </Typography>
    </Stack>
  );
}

export default React.memo(ProviderLabel);
