import { memo } from 'react';
import { getRouteProvider } from './utils';

interface ProviderWithAmountProps {
  destChain?: string;
  provider?: string;
  route?: string;
  sourceChain?: string;
  sourceTokenSymbol?: string;
  usdValue: string;
}

function ProviderWithAmount({
  destChain,
  provider,
  route,
  sourceChain,
  sourceTokenSymbol,
  usdValue,
}: ProviderWithAmountProps) {
  const via = getRouteProvider(
    destChain,
    route,
    sourceChain,
    sourceTokenSymbol,
    provider,
  );

  if (!via) {
    return usdValue;
  }

  return `${usdValue} via ${via}`;
}

export default memo(ProviderWithAmount);
