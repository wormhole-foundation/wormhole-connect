import config from 'config';

import { TokenDetails } from './types';

export function getTokenDetails(token: string): TokenDetails {
  const tokenConfig = config.tokens[token]!;
  const { symbol, tokenId } = tokenConfig;

  return {
    symbol,
    tokenId: tokenId ?? 'native',
  };
}
