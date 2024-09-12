import { useCallback, useEffect, useState } from 'react';
import { ChainId, chainIdToChain } from '@wormhole-foundation/sdk';

import config from 'config';
import { getTokenById } from 'utils';

import type { Transaction } from 'config/types';

interface MayanTransaction {
  trader: string;
  sourceTxHash: string;
  sourceChain: ChainId;
  swapChain: string;
  destChain: ChainId;
  fromAmount: string;
  fromTokenChain: ChainId;
  fromTokenSymbol: string;
  fromTokenPrice: number;
  toTokenPrice: number;
  toTokenAddress: string;
  toTokenChain: ChainId;
  toTokenSymbol: string;
  status: string;
  clientStatus: string;
  initiatedAt: string;
  toAmount: string;
  statusUpdatedAt: string;
}

type Props = {
  address: string;
  page?: number;
  pageSize?: number;
};

const useTransactionHistoryMayan = (
  props: Props,
): {
  transactions: Array<Transaction> | undefined;
  error: string;
  isFetching: boolean;
  hasMore: boolean;
} => {
  const [transactions, setTransactions] = useState<
    Array<Transaction> | undefined
  >();
  const [error, setError] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const { address, page = 0, pageSize = 30 } = props;

  const parseSingleTx = (tx: MayanTransaction) => {
    const {
      fromAmount,
      sourceChain,
      destChain,
      fromTokenPrice,
      fromTokenSymbol,
      initiatedAt,
      toAmount,
      toTokenAddress,
      sourceTxHash,
      trader,
    } = tx;

    const fromChain = chainIdToChain(sourceChain);
    const toChain = chainIdToChain(destChain);

    if (!fromChain || !toChain) {
      return;
    }

    const fromTokenConfig = config.tokensArr.find(
      (t) => t.nativeChain === fromChain && t.symbol === fromTokenSymbol,
    );

    const toTokenConfig = getTokenById({
      chain: toChain,
      address: toTokenAddress,
    });

    if (!fromTokenConfig || !toTokenConfig) {
      return;
    }

    const txData: Transaction = {
      txHash: sourceTxHash,
      sender: trader,
      amount: fromAmount,
      amountUsd: Number(fromAmount) * fromTokenPrice,
      recipient: '',
      toChain,
      fromChain,
      tokenKey: fromTokenConfig?.key,
      receivedTokenKey: toTokenConfig?.key,
      receiveAmount: toAmount,
      tokenAddress: toTokenAddress,
      senderTimestamp: initiatedAt,
      explorerLink: `https://explorer.mayan.finance/swap/${sourceTxHash}`,
    };

    return txData;
  };

  const parseTransactions = useCallback(
    (allTxs: Array<MayanTransaction>) =>
      allTxs.map((tx) => parseSingleTx(tx)).filter((tx) => !!tx), // Filter out unsupported transactions
    [],
  );

  useEffect(() => {
    let cancelled = false;

    const fetchTransactions = async () => {
      setIsFetching(true);

      const limit = pageSize;
      const offset = limit * page;

      try {
        const res = await fetch(
          `${config.mayanApi}/v3/swaps?trader=${address}&offset=${offset}&limit=${limit}`,
        );

        const payload = await res.json();

        if (!cancelled) {
          if (payload?.data?.length > 0) {
            setTransactions((txs) => {
              const parsedTxs = parseTransactions(payload.data);
              if (txs && txs.length > 0) {
                const uniqList = {};
                txs.concat(parsedTxs).forEach((tx) => {
                  if (tx?.txHash) {
                    uniqList[tx.txHash] = tx;
                  }
                });

                return Object.values(uniqList);
              }
              return parsedTxs;
            });
          }

          if (payload?.data?.length < limit) {
            setHasMore(false);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setError(`Error fetching transaction history from Mayan: ${error}`);
        }
      } finally {
        setIsFetching(false);
      }
    };

    fetchTransactions();

    return () => {
      cancelled = true;
    };
  }, [page, pageSize]);

  return {
    transactions,
    error,
    isFetching,
    hasMore,
  };
};

export default useTransactionHistoryMayan;
