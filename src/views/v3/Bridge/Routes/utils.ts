import config from 'config';

function getRouteProvider(
  destChain: string | undefined,
  route: string | undefined,
  sourceChain: string | undefined,
  sourceTokenSymbol: string | undefined,
  quoteProvider?: string,
) {
  // If a provider is explicitly passed from the quote, use it
  if (quoteProvider) {
    return quoteProvider;
  }

  const isLidoNttSpecialCase =
    route === 'AutomaticNtt' &&
    sourceTokenSymbol === 'wstETH' &&
    ((sourceChain === 'Ethereum' && destChain === 'Bsc') ||
      (sourceChain === 'Bsc' && destChain === 'Ethereum'));

  const isSameChain = route === 'MayanSwapMONOCHAIN';

  const isSameChainSolana =
    isSameChain && sourceChain === 'Solana' && destChain === 'Solana';

  let providerString = '';

  if (isLidoNttSpecialCase) {
    providerString = 'NTT: Wormhole + Axelar';
  } else if (isSameChainSolana) {
    providerString = 'Jupiter';
  } else if (isSameChain) {
    providerString = 'Mayan'; // Needs to eventually call out the evm route
  } else if (route) {
    const provider = config.routes.get(route)?.rc.meta.provider;
    providerString = provider || '';
  }

  return providerString;
}

export { getRouteProvider };
