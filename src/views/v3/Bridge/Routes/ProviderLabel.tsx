import React from 'react';

import { getRouteProvider } from './utils';

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
    <div style={{ flexGrow: 1, whiteSpace: 'nowrap' }}>Routing via {via}</div>
  );
}

export default React.memo(ProviderLabel);
