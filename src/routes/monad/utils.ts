import type {
  TokenId,
  ChainContext,
} from '@wormhole-foundation/sdk-definitions';
import { isSameToken } from '@wormhole-foundation/sdk-definitions';
import { CONTRACTS, TOKEN_DENY_LIST, TOKEN_ALLOW_LIST } from './consts';
import type { Network } from '@wormhole-foundation/sdk-connect';

export function isTokenSupported<N extends Network>(
  sourceToken: TokenId,
  fromChain: ChainContext<N>,
): boolean {
  // For Mainnet, use allowlist - only allow tokens explicitly in the list
  if (fromChain.network === 'Mainnet') {
    const allowList = TOKEN_ALLOW_LIST[fromChain.network] || [];
    // If allowlist is empty, no tokens are supported on mainnet
    if (allowList.length === 0) {
      return false;
    }
    // Check if token is in the allowlist
    return allowList.some((t) => isSameToken(t, sourceToken));
  }

  // For other networks (e.g., Testnet), use the deny list
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
