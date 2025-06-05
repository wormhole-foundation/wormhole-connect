import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store';
import { useEffect, useState, useRef } from 'react';
import { accessBalance, Balances, updateBalances } from 'store/transferInput';
import config, { getWormholeContextV2, WormholeConnectConfig } from 'config';
import { Token } from 'config/tokens';
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
): { isFetching: boolean; balances: Balances } => {
  const [isFetching, setIsFetching] = useState(false);
  const [balances, setBalances] = useState<Balances>({});
  const cachedBalances = useSelector(
    (state: RootState) => state.transferInput.balances,
  );
  const { getOrFetchToken } = useTokens();
  const dispatch = useDispatch();
  const isFetchingRef = useRef<boolean>(false);

  useEffect(() => {
    setIsFetching(true);
    setBalances({});

    // Don't run this more than once concurrently
    if (isFetchingRef.current) {
      setIsFetching(false);
      return;
    }

    if (
      !wallet ||
      !wallet.address ||
      !chain ||
      !config.chains[chain] ||
      tokens.length === 0
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

    const isActive = true;
    isFetchingRef.current = true;

    const getBalances = async () => {
      const updatedBalances: Balances = {};
      const needsUpdate: Token[] = [];
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      let updateCache = false;

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
        try {
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
            let optionalValue:
              | undefined
              | WormholeConnectConfig['evmIndexers'] = undefined;
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

                const { isNttToken } = await import('utils/tokens');

                // Sort tokens by balance (highest first)
                const sortedTokens = Object.entries(result)
                  .sort(([, a], [, b]) => {
                    const balanceA = a ?? 0n;
                    const balanceB = b ?? 0n;
                    return balanceA > balanceB
                      ? -1
                      : balanceA < balanceB
                      ? 1
                      : 0;
                  })
                  .filter(([_tokenAddress, bus]) => {
                    // Filter out dust
                    return bus !== null && bus > 1n;
                  });

                // Process tokens in batches with rate limiting
                const BATCH_SIZE = 10;
                const BATCH_DELAY_MS = 500;
                const MAX_TOKENS_TO_PROCESS = 20; // Limit total tokens processed
                let processedCount = 0;

                for (let i = 0; i < sortedTokens.length; i += BATCH_SIZE) {
                  if (!isActive) {
                    console.log('fuck!');
                    return;
                  }

                  if (processedCount >= MAX_TOKENS_TO_PROCESS) {
                    console.log(
                      `Reached max token limit (${MAX_TOKENS_TO_PROCESS}), skipping remaining ${
                        sortedTokens.length - i
                      } tokens`,
                    );
                    break;
                  }

                  const batch = sortedTokens.slice(i, i + BATCH_SIZE);

                  await Promise.all(
                    batch.map(async ([tokenAddress, bus]) => {
                      if (!isActive) return;

                      try {
                        console.log('Fetching', i, chain, tokenAddress);

                        const token = await getOrFetchToken(
                          Wormhole.tokenId(chain, tokenAddress),
                        );
                        if (!token) return;

                        // We show source tokens if they meet at least one of 3 criteria:
                        // 1. Coingecko recognizes them
                        // 2. We have an NTT config for them
                        // 3. They are a token bridge wrapped token
                        const tokenQualifiesToBeShown =
                          token.coingeckoWebId ||
                          token.isTokenBridgeWrappedToken ||
                          isNttToken(token);

                        console.log(token, tokenQualifiesToBeShown);

                        if (!tokenQualifiesToBeShown) {
                          console.warn(
                            `Filtering out possible scamtoken`,
                            token,
                          );
                          return false;
                        }

                        const balance = amount.fromBaseUnits(
                          bus ?? 0n,
                          token.decimals,
                        );

                        // Skip dust tokens (less than $0.01 worth)
                        const balanceNum = parseFloat(balance.toString());
                        if (balanceNum < 0.01 && processedCount > 10) {
                          console.log(
                            `Skipping dust token ${token.symbol} with balance ${balanceNum}`,
                          );
                          return;
                        }

                        updatedBalances[token.key] = {
                          balance,
                          lastUpdated: now,
                        };
                        processedCount++;
                      } catch (e) {
                        console.error(
                          `Failed to fetch token metadata for ${tokenAddress}:`,
                          e,
                        );
                      }
                    }),
                  );

                  if (!isActive) return;

                  // Add delay between batches to avoid rate limiting
                  if (
                    i + BATCH_SIZE < sortedTokens.length &&
                    processedCount < MAX_TOKENS_TO_PROCESS
                  ) {
                    console.log('Sleeping', BATCH_DELAY_MS);
                    await sleep(BATCH_DELAY_MS);
                  }
                }

                usedGetBalances = true;
              } catch (e) {
                console.error(`Error calling getBalances on ${chain}: ${e}`);
              }
            }
          }

          // Use fallback method if we couldn't use getBalances
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
        } catch (e) {
          console.error('Failed to get token balances', e);
        } finally {
          // There can be failures for some tokens,
          // but we'll still update the cache with latest balances
          updateCache = true;
        }
      }
      if (isActive) {
        setIsFetching(false);

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
      // Reset the fetching lock
      isFetchingRef.current = false;
    };

    getBalances();

    return () => {
      //isActive = false;
      //isFetchingRef.current = false;
    };
  }, [chain, tokens, wallet]);

  return { isFetching, balances };
};

export default useGetTokenBalances;
