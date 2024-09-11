import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store';
import { TokenId } from 'sdklegacy';
import { useEffect, useState } from 'react';
import {
  accessBalance,
  Balances,
  formatBalance,
  updateBalances,
} from 'store/transferInput';
import config, { getWormholeContextV2 } from 'config';
import { TokenConfig } from 'config/types';
import { chainToPlatform } from '@wormhole-foundation/sdk-base';
import { getTokenBridgeWrappedTokenAddress } from 'utils/sdkv2';
import { Chain, TokenAddress } from '@wormhole-foundation/sdk';

// TODO: This hook shouldn't format amounts
// Instead the view should format and render accordingly
const useGetTokenBalances = (
  walletAddress: string,
  chain: Chain | undefined,
  tokens: TokenConfig[],
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
      !walletAddress ||
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

    let isActive = true;

    const getBalances = async () => {
      const updatedBalances: Balances = {};
      type TokenConfigWithId = TokenConfig & { tokenId: TokenId };
      const needsUpdate: TokenConfigWithId[] = [];
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      let updateCache = false;

      for (const token of tokens) {
        const cachedBalance = accessBalance(
          cachedBalances,
          walletAddress,
          chain,
          token.key,
        );

        if (cachedBalance && cachedBalance.lastUpdated > fiveMinutesAgo) {
          updatedBalances[token.key] = cachedBalance;
        } else {
          needsUpdate.push(token as TokenConfigWithId);
        }
      }

      if (needsUpdate.length > 0) {
        try {
          const wh = await getWormholeContextV2();
          const platform = wh.getPlatform(chainToPlatform(chain));
          const rpc = platform.getRpc(chain);
          const tokenIdMapping: Record<string, TokenConfig> = {};
          const tokenAddresses: string[] = [];
          for (const tokenConfig of needsUpdate) {
            updatedBalances[tokenConfig.key] = {
              balance: '0',
              lastUpdated: now,
            };

            try {
              let address: string | null = null;

              if (
                tokenConfig.nativeChain === chain &&
                tokenConfig.tokenId === undefined
              ) {
                tokenAddresses.push('native');
                tokenIdMapping['native'] = tokenConfig;
              } else {
                const foreignAddress = await getTokenBridgeWrappedTokenAddress(
                  tokenConfig,
                  chain,
                );

                if (foreignAddress) {
                  address = foreignAddress.toString();
                } else {
                  console.warn(
                    `No foreign address for ${tokenConfig.key} on chain ${chain}`,
                  );
                  continue;
                }
                tokenIdMapping[address] = tokenConfig;
                tokenAddresses.push(address);
              }
            } catch (e) {
              console.error(e);
            }
          }

          if (tokenAddresses.length === 0) {
            return;
          }

          const result = await platform
            .utils()
            .getBalances(
              chain,
              rpc,
              walletAddress,
              tokenAddresses as TokenAddress<typeof chain>[],
            );

          for (const tokenAddress in result) {
            const tokenConfig = tokenIdMapping[tokenAddress];
            const balance = result[tokenAddress];
            let formatted: string | null = null;
            if (balance !== null) {
              formatted = formatBalance(chain, tokenConfig, BigInt(balance));
            }
            updatedBalances[tokenConfig.key] = {
              balance: formatted,
              lastUpdated: now,
            };
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
              address: walletAddress,
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
  }, [cachedBalances, walletAddress, chain, tokens]);

  return { isFetching, balances };
};

export default useGetTokenBalances;
