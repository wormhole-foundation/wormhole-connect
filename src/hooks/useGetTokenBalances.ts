import { useEffect, useState, useRef, useCallback } from 'react';
import { Balances } from 'utils/wallet/types';
import config, { getWormholeContextV2 } from 'config';
import { Token, tokenKey } from 'config/tokens';
import { chainToPlatform } from '@wormhole-foundation/sdk-base';
import {
  Chain,
  Wormhole,
  amount,
  supportsIndexerUtils,
} from '@wormhole-foundation/sdk';
import { WalletData } from 'store/wallet';
import { useTokens } from 'contexts/TokensContext';
import { sleep } from 'utils';

export interface ChainBalanceRequest {
  chain: Chain;
  wallet: WalletData;
  tokens: Token[];
}

// Map of chain+wallet -> balances
type BalanceMap = Record<string, Balances>;

interface BalanceCache {
  balance: amount.Amount;
  lastUpdated: number;
}

// Constants
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 250;
const MAX_TOKENS_TO_PROCESS = 100;

// Helper to create request key
const getRequestKey = (chain: Chain, wallet: WalletData) =>
  `${chain}-${wallet.address}`;

// Custom hook for balance cache
const useBalanceCache = () => {
  const cacheRef = useRef<Record<string, BalanceCache>>({});
  const failedTokensRef = useRef<Set<string>>(new Set());

  const getCached = useCallback(
    (chain: Chain, wallet: WalletData, token: Token) => {
      const key = `${chain}-${wallet.address}-${token.key}`;
      const cached = cacheRef.current[key];
      const now = Date.now();

      if (cached && cached.lastUpdated > now - CACHE_DURATION_MS) {
        return cached;
      }
      return null;
    },
    [],
  );

  const setCached = useCallback(
    (
      chain: Chain,
      wallet: WalletData,
      token: Token,
      balance: amount.Amount,
    ) => {
      const key = `${chain}-${wallet.address}-${token.key}`;
      cacheRef.current[key] = {
        balance,
        lastUpdated: Date.now(),
      };
    },
    [],
  );

  const markFailed = useCallback((chain: Chain, address: string) => {
    failedTokensRef.current.add(tokenKey(chain, address));
  }, []);

  const isFailed = useCallback((chain: Chain, address: string) => {
    return failedTokensRef.current.has(tokenKey(chain, address));
  }, []);

  // Cleanup old cache entries periodically
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      const cache = cacheRef.current;
      for (const key in cache) {
        if (cache[key].lastUpdated < now - CACHE_DURATION_MS * 2) {
          delete cache[key];
        }
      }
    };

    const interval = setInterval(cleanup, CACHE_DURATION_MS);
    return () => clearInterval(interval);
  }, []);

  return { getCached, setCached, markFailed, isFailed };
};

interface UseGetTokenBalancesParams {
  source?: ChainBalanceRequest;
  destination?: ChainBalanceRequest;
}

interface ChainBalanceResult {
  balances: Balances;
}

interface UseGetTokenBalancesResult {
  isFetching: boolean;
  source: ChainBalanceResult;
  destination: ChainBalanceResult;
}

const useGetTokenBalances = ({
  source,
  destination,
}: UseGetTokenBalancesParams): UseGetTokenBalancesResult => {
  const [balances, setBalances] = useState<BalanceMap>({});
  const [fetchingKeys, setFetchingKeys] = useState<Set<string>>(new Set());

  const { getOrFetchToken } = useTokens();
  const { getCached, setCached, markFailed, isFailed } = useBalanceCache();

  // Keep track of current request keys to avoid stale updates
  const currentRequestKeysRef = useRef<Set<string>>(new Set());

  // Process results from indexer
  const processIndexerResults = useCallback(
    async (
      result: Record<string, bigint | null>,
      chain: Chain,
      wallet: WalletData,
      updatedBalances: Balances,
    ) => {
      // Sort tokens by balance units to prioritize tokens that are likely higher value
      const sortedTokens = Object.entries(result)
        .filter(([_, bus]) => bus !== null && bus > 1n)
        .sort(([, a], [, b]) => {
          const balanceA = a ?? 0n;
          const balanceB = b ?? 0n;
          return balanceA > balanceB ? -1 : balanceA < balanceB ? 1 : 0;
        });

      const unknownTokens: Array<[string, bigint]> = [];

      // Process known tokens
      for (const [address, bus] of sortedTokens) {
        if (bus === null) continue;

        const token = config.tokens.get(chain, address);
        if (token) {
          const balance = amount.fromBaseUnits(bus, token.decimals);
          const balanceData = {
            balance,
            lastUpdated: Date.now(),
          };
          updatedBalances[token.key] = balanceData;
          setCached(chain, wallet, token, balance);
        } else if (!isFailed(chain, address)) {
          unknownTokens.push([address, bus]);
        }
      }

      // Process unknown tokens in batches
      if (unknownTokens.length > 0) {
        for (
          let i = 0;
          i < Math.min(unknownTokens.length, MAX_TOKENS_TO_PROCESS);
          i += BATCH_SIZE
        ) {
          const batch = unknownTokens.slice(i, i + BATCH_SIZE);

          await Promise.all(
            batch.map(async ([tokenAddress, bus]) => {
              try {
                const token = await getOrFetchToken(
                  Wormhole.tokenId(chain, tokenAddress),
                );
                if (token) {
                  const balance = amount.fromBaseUnits(bus, token.decimals);
                  const balanceData = {
                    balance,
                    lastUpdated: Date.now(),
                  };
                  updatedBalances[token.key] = balanceData;
                  setCached(chain, wallet, token, balance);
                } else {
                  markFailed(chain, tokenAddress);
                }
              } catch (e) {
                console.error(
                  `Failed to fetch token metadata for ${tokenAddress}:`,
                  e,
                );
                markFailed(chain, tokenAddress);
              }
            }),
          );

          if (
            i + BATCH_SIZE <
            Math.min(unknownTokens.length, MAX_TOKENS_TO_PROCESS)
          ) {
            await sleep(BATCH_DELAY_MS);
          }
        }
      }
    },
    [getOrFetchToken, setCached, isFailed, markFailed],
  );

  // Fetch balances for a single chain
  const fetchBalancesForChain = useCallback(
    async (
      chain: Chain,
      wallet: WalletData,
      tokens: Token[],
    ): Promise<Balances> => {
      const chainConfig = config.chains[chain];
      if (
        !chainConfig ||
        chainToPlatform(chainConfig.sdkName) !== wallet.type
      ) {
        return {};
      }

      const updatedBalances: Balances = {};

      // Check cache first
      const tokensToFetch: Token[] = [];
      for (const token of tokens) {
        const cached = getCached(chain, wallet, token);
        if (cached) {
          updatedBalances[token.key] = cached;
        } else {
          tokensToFetch.push(token);
        }
      }

      if (tokensToFetch.length === 0) {
        return updatedBalances;
      }

      // Fetch balances
      const wh = await getWormholeContextV2();
      const platformName = chainToPlatform(chain);
      const platform = wh.getPlatform(platformName);
      const rpc = platform.getRpc(chain);
      const platformUtils = platform.utils();

      // Try indexed balance fetching first
      if (supportsIndexerUtils(platformUtils)) {
        const canUseIndexer =
          platformName !== 'Evm' ||
          (config.evmIndexers &&
            (config.evmIndexers.alchemy || config.evmIndexers.goldRush));

        if (canUseIndexer) {
          try {
            const result = await platformUtils.getBalances(
              config.network,
              chain,
              rpc,
              wallet.address,
              platformName === 'Evm' ? config.evmIndexers : undefined,
            );

            await processIndexerResults(result, chain, wallet, updatedBalances);
            return updatedBalances;
          } catch (e) {
            console.error(`Error calling getBalances on ${chain}:`, e);
            // Fall through to individual fetching
          }
        }
      }

      // Fallback to individual token fetching
      await Promise.all(
        tokensToFetch.map(async (token) => {
          try {
            const balanceValue = await platformUtils.getBalance(
              config.network,
              chain,
              rpc,
              wallet.address,
              token.address,
            );
            const balance = amount.fromBaseUnits(
              balanceValue ?? 0n,
              token.decimals,
            );
            updatedBalances[token.key] = {
              balance,
              lastUpdated: Date.now(),
            };
            setCached(chain, wallet, token, balance);
          } catch (e) {
            console.error(`Failed to fetch balance for token ${token.key}`, e);
          }
        }),
      );

      return updatedBalances;
    },
    [getCached, setCached, processIndexerResults],
  );

  // Effect to fetch balances
  useEffect(() => {
    // Build current request keys
    const newRequestKeys = new Set<string>();
    if (source) {
      newRequestKeys.add(getRequestKey(source.chain, source.wallet));
    }
    if (destination) {
      newRequestKeys.add(getRequestKey(destination.chain, destination.wallet));
    }

    // Update current keys ref
    currentRequestKeysRef.current = newRequestKeys;

    // Clear fetching states for removed keys
    setFetchingKeys((prev) => {
      const updated = new Set(prev);
      for (const key of prev) {
        if (!newRequestKeys.has(key)) {
          updated.delete(key);
        }
      }
      return updated;
    });

    if (newRequestKeys.size === 0) {
      return;
    }

    // Fetch balances for each request
    const fetchAll = async () => {
      const requests: ChainBalanceRequest[] = [];
      if (source) requests.push(source);
      if (destination) requests.push(destination);

      // Mark as fetching
      setFetchingKeys(new Set(newRequestKeys));

      try {
        const results = await Promise.all(
          requests.map(async (request) => {
            const key = getRequestKey(request.chain, request.wallet);

            // Check if this key is still current
            if (!currentRequestKeysRef.current.has(key)) {
              return { key, balances: {} };
            }

            const balances = await fetchBalancesForChain(
              request.chain,
              request.wallet,
              request.tokens,
            );
            return { key, balances };
          }),
        );

        // Update balances only for current requests
        setBalances((prevBalances) => {
          const newBalances: BalanceMap = { ...prevBalances };

          for (const { key, balances } of results) {
            if (
              currentRequestKeysRef.current.has(key) &&
              Object.keys(balances).length > 0
            ) {
              newBalances[key] = balances;
            }
          }

          // Remove balances for keys that are no longer current
          for (const key in newBalances) {
            if (!currentRequestKeysRef.current.has(key)) {
              delete newBalances[key];
            }
          }

          return newBalances;
        });
      } finally {
        // Clear fetching state
        setFetchingKeys((prev) => {
          const updated = new Set(prev);
          for (const key of newRequestKeys) {
            updated.delete(key);
          }
          return updated;
        });
      }
    };

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    source?.chain,
    source?.wallet?.address,
    destination?.chain,
    destination?.wallet?.address,
    fetchBalancesForChain,
  ]);

  // Extract results for source and destination
  const sourceKey = source ? getRequestKey(source.chain, source.wallet) : null;
  const destKey = destination
    ? getRequestKey(destination.chain, destination.wallet)
    : null;

  const sourceResult: ChainBalanceResult = {
    balances: sourceKey ? balances[sourceKey] || {} : {},
  };

  const destinationResult: ChainBalanceResult = {
    balances: destKey ? balances[destKey] || {} : {},
  };

  const isFetching = fetchingKeys.size > 0;

  return {
    isFetching,
    source: sourceResult,
    destination: destinationResult,
  };
};

export default useGetTokenBalances;
