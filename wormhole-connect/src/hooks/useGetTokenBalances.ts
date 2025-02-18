import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store';
import { useEffect, useState } from 'react';
import { accessBalance, Balances, updateBalances } from 'store/transferInput';
import config, { getWormholeContextV2 } from 'config';
import { Token } from 'config/tokens';
import { chainToPlatform } from '@wormhole-foundation/sdk-base';
import { Chain, TokenAddress, amount } from '@wormhole-foundation/sdk';
import { WalletData } from 'store/wallet';

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
    if (chainConfig.context !== wallet.type) {
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
          const platform = wh.getPlatform(chainToPlatform(chain));
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

          const result = await platform
            .utils()
            .getBalances(
              chain,
              rpc,
              wallet.address,
              tokenAddresses.map((addr) => addr.toString()) as TokenAddress<
                typeof chain
              >[],
            );

          for (const tokenAddress in result) {
            const token = config.tokens.get(chain, tokenAddress);

            if (token) {
              const bus = result[tokenAddress];
              const balance = amount.fromBaseUnits(bus ?? 0n, token.decimals);

              updatedBalances[token.key] = {
                balance,
                lastUpdated: now,
              };
            }
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
