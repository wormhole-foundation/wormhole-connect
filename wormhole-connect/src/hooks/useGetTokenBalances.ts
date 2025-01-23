import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  type Chain,
  type TokenAddress,
  amount,
} from '@wormhole-foundation/sdk';
import { chainToPlatform } from '@wormhole-foundation/sdk-base';

import config, { getWormholeContextV2 } from 'config';
import { accessBalance, Balances, updateBalances } from 'store/transferInput';

import type { WalletData } from 'store/wallet';
import type { Token } from 'config/tokens';
import type { ChainConfig, NonSDKChain } from 'config/types';
import type { RootState } from 'store';

const useGetTokenBalances = (
  wallet: WalletData | undefined,
  chainConfig: ChainConfig | undefined,
  tokens: Token[],
): { isFetching: boolean; balances: Balances } => {
  const [isFetching, setIsFetching] = useState(false);
  const [balances, setBalances] = useState<Balances>({});
  const cachedBalances = useSelector(
    (state: RootState) => state.transferInput.balances,
  );
  const dispatch = useDispatch();

  useEffect(() => {
    // Skip balance update if selected chain is a non-SDK type
    if (config.nonSDKChains?.[chainConfig?.displayName as NonSDKChain]) {
      return;
    }

    setIsFetching(true);
    setBalances({});
    if (!wallet || !wallet.address || !chainConfig || tokens.length === 0) {
      setIsFetching(false);
      return;
    }

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
          chainConfig.key,
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
          const platform = wh.getPlatform(chainToPlatform(chainConfig.key));
          const rpc = platform.getRpc(chainConfig.key);
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
              chainConfig.key,
              rpc,
              wallet.address,
              tokenAddresses.map((addr) => addr.toString()) as TokenAddress<
                typeof chainConfig.key
              >[],
            );

          for (const tokenAddress in result) {
            const token = config.tokens.get(chainConfig.key, tokenAddress);

            if (token) {
              const bus = result[tokenAddress];
              const balance = amount.fromBaseUnits(bus ?? 0n, token.decimals);

              updatedBalances[token.key] = {
                balance,
                lastUpdated: now,
              };
            }
          }

          updateCache = true;
        } catch (e) {
          console.error('Failed to get token balances', e);
        }
      }
      if (isActive) {
        setIsFetching(false);

        setBalances(updatedBalances);
        if (updateCache) {
          dispatch(
            updateBalances({
              address: wallet.address,
              chain: chainConfig.key,
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
  }, [cachedBalances, chainConfig, dispatch, tokens, wallet]);

  return { isFetching, balances };
};

export default useGetTokenBalances;
