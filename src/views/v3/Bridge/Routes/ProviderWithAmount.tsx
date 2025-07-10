import { memo } from 'react';
import { getRouteProvider } from './utils';

interface ProviderWithAmountProps {
  destChain?: string;
  route?: string;
  sourceChain?: string;
  sourceTokenSymbol?: string;
  usdValue: string;
}

function ProviderWithAmount({
  destChain,
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
  );

  if (!via) {
    return usdValue;
  }

  return `${usdValue} via ${via}`;
}

export default memo(ProviderWithAmount);
