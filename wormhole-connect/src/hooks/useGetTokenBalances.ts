import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store';
import { ChainName, TokenId } from 'sdklegacy';
import { useEffect, useState } from 'react';
import { BigNumber } from 'ethers';
import {
  accessBalance,
  Balances,
  formatBalance,
  updateBalances,
} from 'store/transferInput';
import config, { getWormholeContextV2 } from 'config';
import { TokenConfig } from 'config/types';
import { chainToPlatform } from '@wormhole-foundation/sdk-base';
import { getForeignTokenAddress } from 'utils/sdkv2';
import { TokenAddress } from '@wormhole-foundation/sdk';

const useGetTokenBalances = (
  walletAddress: string,
  chain: ChainName | undefined,
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
          const chainV2 = config.sdkConverter.toChainV2(chain);
          const platform = wh.getPlatform(chainToPlatform(chainV2));
          const rpc = platform.getRpc(chainV2);
          const tokenIdMapping: Record<string, TokenConfig> = {};
          const tokenAddresses = [];
          for (const tokenConfig of needsUpdate) {
            updatedBalances[tokenConfig.key] = {
              balance: '0',
              lastUpdated: now,
            };

            try {
              let address: string | null = null;

              const foreignAddress = await getForeignTokenAddress(
                config.sdkConverter.toTokenIdV2(tokenConfig),
                chainV2,
              );

              if (foreignAddress) {
                address = foreignAddress.toString();
              } else {
                console.error('no fa', tokenConfig);
                continue;
              }
              tokenIdMapping[address] = tokenConfig;
              tokenAddresses.push(address);
            } catch (e) {
              // TODO SDKV2 SUI ISNT WORKING
              console.error(e);
            }
          }

          if (tokenAddresses.length === 0) {
            return;
          }

          const result = await platform
            .utils()
            .getBalances(
              chainV2,
              rpc,
              walletAddress,
              tokenAddresses as TokenAddress<typeof chainV2>[],
            );

          for (const tokenAddress in result) {
            const tokenConfig = tokenIdMapping[tokenAddress];
            const balance = result[tokenAddress];
            let formatted: string | null = null;
            if (balance !== null) {
              formatted = formatBalance(
                chain,
                tokenConfig,
                BigNumber.from(balance),
              );
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
