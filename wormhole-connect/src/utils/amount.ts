import { getTokenDecimals } from 'utils';
import { amount, Chain } from '@wormhole-foundation/sdk';
import { TokenConfig } from 'config/types';

export const formatAmount = (
  chain: Chain,
  token: TokenConfig,
  val: string | bigint | null,
  truncate?: number,
): string | null => {
  if (!val) {
    return null;
  }

  const decimals = getTokenDecimals(chain, token.tokenId);

  let balanceAmount = amount.fromBaseUnits(BigInt(val), decimals);

  if (truncate) {
    balanceAmount = amount.truncate(balanceAmount, truncate);
  }

  return amount.display(balanceAmount);
};
