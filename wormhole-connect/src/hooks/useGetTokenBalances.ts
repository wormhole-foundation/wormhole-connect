import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store';
import { useEffect, useState, useRef, useMemo } from 'react';
import { accessBalance, Balances, updateBalances } from 'store/transferInput';
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

const useGetTokenBalances = (
  wallet: WalletData | undefined,
  chain: Chain | undefined,
  tokens: Token[],
): {
  isFetching: boolean;
  balances: Balances;
  fetchTokensProgress: number | null;
} => {
  const [isFetching, setIsFetching] = useState(false);
  const [balances, setBalances] = useState<Balances>({});
  const cachedBalances = useSelector(
    (state: RootState) => state.transferInput.balances,
  );
  const { getOrFetchToken } = useTokens();
  const dispatch = useDispatch();
  const isFetchingRef = useRef<boolean>(false);
  const failedTokens = useRef<Set<string>>(new Set());
  const isActiveRef = useRef<boolean>(false);
  const currentKeyRef = useRef<string | undefined>(undefined);

  const [fetchTokensProgress, setFetchTokensProgress] = useState<null | number>(
    null,
  );

  // Create a stable key for the current wallet/chain combination
  const currentKey = wallet && chain ? `${wallet.address}-${chain}` : undefined;

  // Create a stable token keys string to detect actual token changes
  const tokenKeys = useMemo(
    () =>
      tokens
        .map((t) => t.key)
        .sort()
        .join(','),
    [tokens],
  );

  useEffect(() => {
    // Don't run this more than once concurrently for the same wallet/chain
    if (isFetchingRef.current && currentKeyRef.current === currentKey) {
      return;
    }

    if (
      !wallet ||
      !wallet.address ||
      !chain ||
      !config.chains[chain] ||
      tokens.length === 0 ||
      !currentKey
    ) {
      setIsFetching(false);
      return;
    }
    const chainConfig = config.chains[chain];
    if (!chainConfig) {
      setIsFetching(false);
      return;
    }
    if (chainToPlatform(chainConfig.sdkName) !== wallet.type) {
      // Invalid wallet
      setIsFetching(false);
      return;
    }

    // Set up the refs for this execution
    isFetchingRef.current = true;
    currentKeyRef.current = currentKey;
    isActiveRef.current = true;
    setIsFetching(true);

    const getBalances = async () => {
      const updatedBalances: Balances = {};
      const needsUpdate: Token[] = [];
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      const updateCache = false;

      for (const token of tokens) {
        const cachedBalance = accessBalance(
          cachedBalances,
          wallet.address,
          chain,
          token,
        );

        if (cachedBalance && cachedBalance.lastUpdated > fiveMinutesAgo) {
          updatedBalances[token.key] = cachedBalance;
        } else {
          needsUpdate.push(token);
        }
      }

      if (needsUpdate.length > 0) {
        const wh = await getWormholeContextV2();
        const platformName = chainToPlatform(chain);
        const platform = wh.getPlatform(platformName);
        const rpc = platform.getRpc(chain);
        const tokenAddresses: TokenAddress<Chain>[] = [];

        // Default it to 0 in case the RPC call fails
        for (const token of needsUpdate) {
          updatedBalances[token.key] = {
            balance: amount.fromBaseUnits(0n, token.decimals),
            lastUpdated: now,
          };

          tokenAddresses.push(token.address);
        }

        if (tokenAddresses.length === 0) {
          return;
        }

        const platformUtils = platform.utils();

        // There are two methods for fetching all token balances: a preferred method and a fallback.
        // The preferred method calls getBalances (if available) which fetches all token balances held
        // by that address. This might include tokens Connect is not aware of yet, hence the call to
        // getOrFetchToken.
        //
        // If getBalances is not available, we call getBalance for each token Connect is already aware of.
        // This is just the fallback method, because it's way less efficient (makes one network call per token)
        // and misses tokens we don't already know about. It's objectively worse.
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

          // If canUseGetBalances is true that means we have what we need to call getBalances
          // (for EVM, if the integrator didn't provide an Alchemy or GoldRush key, we can't use getBalances)

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
                  // Already failed to fetch metadata on this token. Skip.
                  continue;
                }

                const token = config.tokens.get(chain, address);
                if (token) {
                  // Known token; immediately update its balances
                  const balance = amount.fromBaseUnits(
                    bus ?? 0n,
                    token.decimals,
                  );

                  updatedBalances[token.key] = {
                    balance,
                    lastUpdated: now,
                  };
                } else {
                  // Put into queue for batch job that fetches token metadata
                  unknownTokens.push([address, bus]);
                }
              }

              usedGetBalances = true;

              setBalances(updatedBalances);
              if (updateCache) {
                dispatch(
                  updateBalances({
                    address: wallet.address,
                    chain,
                    balances: updatedBalances,
                  }),
                );
              }

              console.debug(
                `[${currentKey}] processing unknownTokens`,
                unknownTokens.length,
                'tokens',
              );

              if (unknownTokens.length > 0) {
                setFetchTokensProgress(0.0);

                // Process tokens in batches with rate limiting
                const BATCH_SIZE = 5;
                const BATCH_DELAY_MS = 250;
                const MAX_TOKENS_TO_PROCESS = 50; // Limit total tokens processed
                let processedCount = 0;

                for (let i = 0; i < unknownTokens.length; i += BATCH_SIZE) {
                  if (!isActiveRef.current) {
                    return;
                  }

                  if (processedCount >= MAX_TOKENS_TO_PROCESS) {
                    console.debug(
                      `Reached max token limit (${MAX_TOKENS_TO_PROCESS}), skipping remaining ${
                        sortedTokens.length - i
                      } tokens`,
                    );
                    break;
                  }

                  console.log(sortedTokens, unknownTokens);

                  const batch = unknownTokens.slice(i, i + BATCH_SIZE);

                  await Promise.all(
                    batch.map(async ([tokenAddress, bus]) => {
                      try {
                        // Token unrecognized; kick off a fetch request
                        console.log('calling getorfetch', chain, tokenAddress);
                        const token = await getOrFetchToken(
                          Wormhole.tokenId(chain, tokenAddress),
                        );
                        if (!token) {
                          console.error(
                            `Failed to fetch token metadata for ${tokenAddress}:`,
                          );
                          failedTokens.current.add(
                            tokenKey(chain, tokenAddress),
                          );
                          return;
                        }

                        const balance = amount.fromBaseUnits(
                          bus ?? 0n,
                          token.decimals,
                        );

                        updatedBalances[token.key] = {
                          balance,
                          lastUpdated: now,
                        };
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

                  setFetchTokensProgress(i / unknownTokens.length);

                  setBalances(updatedBalances);
                  if (updateCache) {
                    dispatch(
                      updateBalances({
                        address: wallet.address,
                        chain,
                        balances: updatedBalances,
                      }),
                    );
                  }

                  // Add delay between batches to avoid rate limiting
                  if (
                    i + BATCH_SIZE < unknownTokens.length &&
                    processedCount < MAX_TOKENS_TO_PROCESS
                  ) {
                    console.debug('Sleeping', BATCH_DELAY_MS);
                    await sleep(BATCH_DELAY_MS);
                  }
                }
              }
            } catch (e) {
              console.error(e);
            } finally {
              setFetchTokensProgress(null);
            }
          }

          // Use fallback method if we couldn't use getBalances
          console.log(usedGetBalances);
          if (!usedGetBalances) {
            await Promise.all(
              needsUpdate.map(async (token) => {
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
                    lastUpdated: now,
                  };
                } catch (e) {
                  // If fetching balance fails, keep the default 0 balance
                  console.error(
                    `Failed to fetch balance for token ${token.key}`,
                    e,
                  );
                }
              }),
            );
          }

          setBalances(updatedBalances);

          if (updateCache) {
            dispatch(
              updateBalances({
                address: wallet.address,
                chain,
                balances: updatedBalances,
              }),
            );
          }
        }
      }

      if (isActiveRef.current) {
        setIsFetching(false);
      }
      // Reset the fetching lock
      isFetchingRef.current = false;
    };

    getBalances();

    return () => {
      isActiveRef.current = false;
      if (currentKeyRef.current === currentKey) {
        isFetchingRef.current = false;
        currentKeyRef.current = undefined;
      }
    };
  }, [
    chain,
    tokenKeys,
    wallet,
    currentKey,
    cachedBalances,
    dispatch,
    getOrFetchToken,
  ]);

  return { isFetching, balances, fetchTokensProgress };
};

export default useGetTokenBalances;
