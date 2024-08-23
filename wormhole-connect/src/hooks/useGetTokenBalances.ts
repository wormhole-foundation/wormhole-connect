import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store';
import { ChainName, TokenId } from '@wormhole-foundation/wormhole-connect-sdk';
import { useEffect, useState } from 'react';
import {
  accessBalance,
  Balances,
  formatBalance,
  updateBalances,
} from 'store/transferInput';
import config from 'config';
import { TokenConfig } from 'config/types';

const CHAIN_MAX_TOKENS_PER_REQ = {
  klaytn: 10,
} as Record<ChainName, number>;

const splitArrayInChunks = <T>(
  array: T[] = [],
  chunkSize: number = Infinity,
): T[][] =>
  array
    .map((_, i) =>
      i % chunkSize === 0 ? array.slice(i, i + chunkSize) : undefined,
    )
    .filter((c) => c !== undefined) as T[][];

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
      const balances: Balances = {};
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
          balances[token.key] = cachedBalance;
        } else {
          if (token.key === chainConfig.gasToken) {
            try {
              const balance = await config.wh.getNativeBalance(
                walletAddress,
                chain,
                token.key,
              );
              balances[token.key] = {
                balance: formatBalance(chain, token, balance),
                lastUpdated: now,
              };
              updateCache = true;
            } catch (e) {
              console.error('Failed to get native balance', e);
            }
          } else if (token.tokenId) {
            needsUpdate.push(token as TokenConfigWithId);
          }
        }
      }

      if (needsUpdate.length > 0) {
        const needsUpdateChunks = splitArrayInChunks(
          needsUpdate,
          CHAIN_MAX_TOKENS_PER_REQ[chain],
        );

        try {
          await Promise.all(
            needsUpdateChunks.map(async (needsUpdateChunk) => {
              const result = await config.wh.getTokenBalances(
                walletAddress,
                needsUpdateChunk.map((t) => t.tokenId),
                chain,
              );
              result.forEach((balance, i) => {
                const token = needsUpdateChunk[i];
                balances[token.key] = {
                  balance: formatBalance(chain, token, balance),
                  lastUpdated: now,
                };
              });
            }),
          );
          updateCache = true;
        } catch (e) {
          console.error('Failed to get token balances', e);
        }
      }
      if (isActive) {
        setIsFetching(false);
        setBalances(balances);
        if (updateCache) {
          dispatch(
            updateBalances({
              address: walletAddress,
              chain,
              balances,
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
