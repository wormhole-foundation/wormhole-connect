import React from 'react';

import { getRouteProvider } from './utils';
import Typography from '@mui/material/Typography';

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
    <div style={{ flexGrow: 1, whiteSpace: 'nowrap' }}>
      <Typography variant={'body2'} fontWeight={500}>
        {' '}
        Routing via {via}{' '}
      </Typography>
    </div>
  );
}

export default React.memo(ProviderLabel);
