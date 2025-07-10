import React from 'react';

interface ProviderProps {
  destChain: string;
  provider: string | undefined;
  route: string;
  sourceChain: string | undefined;
  sourceTokenSymbol: string | undefined;
  usdValue: string;
}

function Provider({
  destChain,
  provider,
  route,
  sourceChain,
  sourceTokenSymbol,
  usdValue,
}: ProviderProps) {
  if (!sourceTokenSymbol) {
    return usdValue;
  }

  const isLidoNttSpecialCase =
    route === 'AutomaticNtt' &&
    sourceTokenSymbol === 'wstETH' &&
    ((sourceChain === 'Ethereum' && destChain === 'Bsc') ||
      (sourceChain === 'Bsc' && destChain === 'Ethereum'));

  const isSameChain = route === 'MayanSwapMONOCHAIN';

  const isSameChainSolana =
    isSameChain && sourceChain === 'Solana' && destChain === 'Solana';

  let suffix = '';

  if (isLidoNttSpecialCase) {
    suffix = 'via NTT: Wormhole + Axelar';
  } else if (isSameChainSolana) {
    suffix = 'via Jupiter';
  } else if (isSameChain) {
    suffix = 'via Mayan'; // Needs to eventually call out the evm route
  } else if (provider) {
    suffix = `via ${provider}`;
  }

  return `${usdValue} ${suffix}`;
}

export default React.memo(Provider);
