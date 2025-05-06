import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store';
import { useEffect, useState } from 'react';
import { accessBalance, Balances, updateBalances } from 'store/transferInput';
import config, { getWormholeContextV2 } from 'config';
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

  useEffect(() => {
    setIsFetching(true);
    setBalances({});
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

    let isActive = true;

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
            let optionalValue: any = undefined;
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
              let result = await platformUtils.getBalances(
                config.network,
                chain,
                rpc,
                wallet.address,
                optionalValue,
              );

              await Promise.all(
                Object.entries(result).map(async ([tokenAddress, bus]) => {
                  const token = await getOrFetchToken(
                    Wormhole.tokenId(chain, tokenAddress),
                    { requireCoingeckoListing: true },
                  );
                  if (!token) return;

                  const balance = amount.fromBaseUnits(
                    bus ?? 0n,
                    token.decimals,
                  );
                  updatedBalances[token.key] = {
                    balance,
                    lastUpdated: now,
                  };
                }),
              );

              usedGetBalances = true;
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
    };

    getBalances();

    return () => {
      isActive = false;
    };
  }, [cachedBalances, chain, dispatch, tokens, wallet]);

  return { isFetching, balances };
};

export default useGetTokenBalances;
