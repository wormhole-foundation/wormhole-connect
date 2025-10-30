import type {
  TokenId,
  ChainContext,
} from '@wormhole-foundation/sdk-definitions';
import { isSameToken } from '@wormhole-foundation/sdk-definitions';
import { CONTRACTS, TOKEN_DENY_LIST } from './consts';
import type { Network } from '@wormhole-foundation/sdk-connect';

export function isTokenSupported<N extends Network>(
  sourceToken: TokenId,
  fromChain: ChainContext<N>,
): boolean {
  const denyList = TOKEN_DENY_LIST[fromChain.network] || [];
  if (denyList.some((t) => isSameToken(t, sourceToken))) {
    return false;
  }
  return true;
}

export function getContractsForNetwork(network: Network) {
  const contracts = CONTRACTS[network];
  if (!contracts) {
    throw new Error(`No Monad NTT contracts configured for network ${network}`);
  }
  return contracts;
}
