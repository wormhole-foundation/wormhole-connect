import { useEffect, useState, useRef, useMemo } from 'react';
import { Balances } from 'store/transferInput';
import config, { getWormholeContextV2, WormholeConnectConfig } from 'config';
import { Token, tokenKey } from 'config/tokens';
import { chainToPlatform } from '@wormhole-foundation/sdk-base';
import {
  Chain,
  TokenAddress,
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

const useGetTokenBalancesByChain = (
  requests: ChainBalanceRequest[],
): {
  isFetching: boolean;
  balances: BalanceMap;
  fetchTokensProgress: Record<string, number | null>;
} => {
  const [isFetching, setIsFetching] = useState(false);
  const [balances, setBalances] = useState<BalanceMap>({});
  const [fetchTokensProgress, setFetchTokensProgress] = useState<
    Record<string, number | null>
  >({});

  const { getOrFetchToken } = useTokens();

  const isFetchingRef = useRef<boolean>(false);
  const failedTokens = useRef<Set<string>>(new Set());
  const isActiveRef = useRef<boolean>(false);

  // Simple in-memory cache for balances
  const balanceCacheRef = useRef<{
    [key: string]: { balance: any; lastUpdated: number };
  }>({});

  // Create a stable key for each request
  const getRequestKey = (chain: Chain, wallet: WalletData) =>
    `${chain}-${wallet.address}`;

  // Create stable keys for deduplication
  const requestKeys = useMemo(() => {
    return requests.map((r) => ({
      key: getRequestKey(r.chain, r.wallet),
      tokenKeys: r.tokens
        .map((t) => t.key)
        .sort()
        .join(','),
    }));
  }, [requests]);

  const currentKey = requestKeys
    .map((r) => `${r.key}:${r.tokenKeys}`)
    .join('|');
  const currentKeyRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    // Don't run this more than once concurrently for the same combination
    if (isFetchingRef.current && currentKeyRef.current === currentKey) {
      return;
    }

    // Set up the refs for this execution
    isFetchingRef.current = true;
    currentKeyRef.current = currentKey;
    isActiveRef.current = true;
    setIsFetching(true);

    const fetchBalancesForChain = async (
      chain: Chain,
      wallet: WalletData,
      tokens: Token[],
    ): Promise<Balances> => {
      console.log('fetching for chain', chain, wallet);
      const chainConfig = config.chains[chain];
      if (!chainConfig) return {};

      if (chainToPlatform(chainConfig.sdkName) !== wallet.type) {
        return {};
      }

      const updatedBalances: Balances = {};
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      const cacheKey = (token: Token) =>
        `${chain}-${wallet.address}-${token.key}`;

      if (tokens.length === 0) {
        return updatedBalances;
      }

      // Check cache first
      const tokensToFetch: Token[] = [];
      for (const token of tokens) {
        const cached = balanceCacheRef.current[cacheKey(token)];
        if (cached && cached.lastUpdated > fiveMinutesAgo) {
          updatedBalances[token.key] = cached;
        } else {
          tokensToFetch.push(token);
        }
      }

      if (tokensToFetch.length === 0) {
        return updatedBalances;
      }

      try {
        const wh = await getWormholeContextV2();
        const platformName = chainToPlatform(chain);
        const platform = wh.getPlatform(platformName);
        const rpc = platform.getRpc(chain);
        const tokenAddresses: TokenAddress<Chain>[] = [];

        // Default to 0 in case the RPC call fails
        for (const token of tokensToFetch) {
          updatedBalances[token.key] = {
            balance: amount.fromBaseUnits(0n, token.decimals),
            lastUpdated: now,
          };
          tokenAddresses.push(token.address);
        }

        const platformUtils = platform.utils();
        let usedGetBalances = false;

        if (supportsIndexerUtils(platformUtils)) {
          let optionalValue: undefined | WormholeConnectConfig['evmIndexers'] =
            undefined;
          let canUseGetBalances = false;

          if (platformName === 'Evm') {
            if (
              config.evmIndexers &&
              (config.evmIndexers.alchemy || config.evmIndexers.goldRush)
            ) {
              optionalValue = config.evmIndexers;
              canUseGetBalances = true;
            }
          } else {
            canUseGetBalances = true;
          }

          if (canUseGetBalances) {
            try {
              const result = await platformUtils.getBalances(
                config.network,
                chain,
                rpc,
                wallet.address,
                optionalValue,
              );

              // Sort tokens by balance (highest first)
              const sortedTokens = Object.entries(result)
                .sort(([, a], [, b]) => {
                  const balanceA = a ?? 0n;
                  const balanceB = b ?? 0n;
                  return balanceA > balanceB ? -1 : balanceA < balanceB ? 1 : 0;
                })
                .filter(([_tokenAddress, bus]) => {
                  // Filter out dust
                  return bus !== null && bus > 1n;
                });

              const unknownTokens: [string, bigint][] = [];

              for (const [address, bus] of sortedTokens) {
                const key = tokenKey(chain, address);

                if (bus === null) continue;

                if (failedTokens.current.has(key)) {
                  continue;
                }

                const token = config.tokens.get(chain, address);
                if (token) {
                  const balance = amount.fromBaseUnits(
                    bus ?? 0n,
                    token.decimals,
                  );

                  const balanceData = {
                    balance,
                    lastUpdated: now,
                  };
                  updatedBalances[token.key] = balanceData;
                  balanceCacheRef.current[cacheKey(token)] = balanceData;
                } else {
                  unknownTokens.push([address, bus]);
                }
              }

              usedGetBalances = true;

              if (unknownTokens.length > 0 && isActiveRef.current) {
                const requestKey = getRequestKey(chain, wallet);
                setFetchTokensProgress((prev) => ({
                  ...prev,
                  [requestKey]: 0.0,
                }));

                // Process tokens in batches with rate limiting
                const BATCH_SIZE = 5;
                const BATCH_DELAY_MS = 250;
                const MAX_TOKENS_TO_PROCESS = 50;
                let processedCount = 0;

                for (let i = 0; i < unknownTokens.length; i += BATCH_SIZE) {
                  if (!isActiveRef.current) {
                    return updatedBalances;
                  }

                  if (processedCount >= MAX_TOKENS_TO_PROCESS) {
                    break;
                  }

                  const batch = unknownTokens.slice(i, i + BATCH_SIZE);

                  await Promise.all(
                    batch.map(async ([tokenAddress, bus]) => {
                      try {
                        const token = await getOrFetchToken(
                          Wormhole.tokenId(chain, tokenAddress),
                        );
                        if (!token) {
                          failedTokens.current.add(
                            tokenKey(chain, tokenAddress),
                          );
                          return;
                        }

                        const balance = amount.fromBaseUnits(
                          bus ?? 0n,
                          token.decimals,
                        );

                        const balanceData = {
                          balance,
                          lastUpdated: now,
                        };
                        updatedBalances[token.key] = balanceData;
                        // Cache using chain-wallet-token key
                        const key = `${chain}-${wallet.address}-${token.key}`;
                        balanceCacheRef.current[key] = balanceData;
                      } catch (e) {
                        console.error(
                          `Failed to fetch token metadata for ${tokenAddress}:`,
                          e,
                        );
                        failedTokens.current.add(tokenKey(chain, tokenAddress));
                      } finally {
                        processedCount++;
                      }
                    }),
                  );

                  setFetchTokensProgress((prev) => ({
                    ...prev,
                    [requestKey]: i / unknownTokens.length,
                  }));

                  if (
                    i + BATCH_SIZE < unknownTokens.length &&
                    processedCount < MAX_TOKENS_TO_PROCESS
                  ) {
                    await sleep(BATCH_DELAY_MS);
                  }
                }

                setFetchTokensProgress((prev) => ({
                  ...prev,
                  [requestKey]: null,
                }));
              }
            } catch (e) {
              console.error(`Error calling getBalances on ${chain}: ${e}`);
            }
          }
        }

        // Use fallback method if we couldn't use getBalances
        if (!usedGetBalances) {
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
                const balanceData = {
                  balance,
                  lastUpdated: now,
                };
                updatedBalances[token.key] = balanceData;
                balanceCacheRef.current[cacheKey(token)] = balanceData;
              } catch (e) {
                console.error(
                  `Failed to fetch balance for token ${token.key}`,
                  e,
                );
              }
            }),
          );
        }
      } catch (e) {
        console.error('Failed to get token balances', e);
      }

      console.log('fetched for chain', chain, wallet, updatedBalances);
      return updatedBalances;
    };

    const fetchAllBalances = async () => {
      const results = await Promise.all(
        requests.map(async (request) => {
          const balances = await fetchBalancesForChain(
            request.chain,
            request.wallet,
            request.tokens,
          );
          return {
            key: getRequestKey(request.chain, request.wallet),
            balances,
          };
        }),
      );

      if (isActiveRef.current) {
        const newBalances: BalanceMap = {};
        for (const result of results) {
          newBalances[result.key] = result.balances;
        }

        setBalances(newBalances);
        setIsFetching(false);
      }

      isFetchingRef.current = false;
    };

    fetchAllBalances();

    return () => {
      isActiveRef.current = false;
      if (currentKeyRef.current === currentKey) {
        isFetchingRef.current = false;
        currentKeyRef.current = undefined;
      }
    };
  }, [currentKey, getOrFetchToken]);

  return { isFetching, balances, fetchTokensProgress };
};

export default useGetTokenBalancesByChain;
