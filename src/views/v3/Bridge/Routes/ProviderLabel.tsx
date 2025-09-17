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
    <span style={{ fontWeight: 600 }}>
      Routing <span style={{ fontWeight: 400 }}>via {via}</span>
    </span>
  );
}

export default React.memo(ProviderLabel);
