import { useCallback, useEffect, useState } from 'react';
import { ChainId, chainIdToChain } from '@wormhole-foundation/sdk';

import config from 'config';

import type { Transaction } from 'config/types';

interface MayanTransaction {
  trader: string;
  destAddress: string;
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
      toTokenSymbol,
      sourceTxHash,
      trader,
      destAddress,
      clientStatus,
    } = tx;

    const fromChain = chainIdToChain(sourceChain);
    const toChain = chainIdToChain(destChain);

    // Skip this transaction if we don't have source or destination chains
    if (!fromChain || !toChain) {
      return;
    }

    const fromTokenConfig = config.tokensArr.find(
      (t) =>
        t.symbol === fromTokenSymbol &&
        (t.nativeChain === fromChain || t.tokenId?.chain === fromChain),
    );

    const toTokenConfig = config.tokensArr.find(
      (t) =>
        t.symbol === toTokenSymbol &&
        (t.nativeChain === toChain || t.tokenId?.chain === toChain),
    );

    // Skip this transaction if we can't find source or destination token configs
    if (!fromTokenConfig || !toTokenConfig) {
      return;
    }

    // Transaction is in progress when it's not completed or refunded
    const clientStatusLC = clientStatus?.toLowerCase();
    const inProgress =
      clientStatusLC !== 'completed' && clientStatusLC !== 'refunded';

    const txData: Transaction = {
      txHash: sourceTxHash,
      sender: trader,
      amount: fromAmount,
      amountUsd: Number(fromAmount) * fromTokenPrice,
      recipient: destAddress,
      toChain,
      fromChain,
      tokenKey: fromTokenConfig?.key,
      receivedTokenKey: toTokenConfig?.key,
      receiveAmount: toAmount,
      tokenAddress: toTokenAddress,
      senderTimestamp: initiatedAt,
      explorerLink: `https://explorer.mayan.finance/swap/${sourceTxHash}`,
      inProgress,
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

        // If the fetch was unsuccessful, return an empty set
        if (res.status !== 200) {
          setIsFetching(false);
          setTransactions([]);
        } else {
          const resPayload = await res.json();

          if (!cancelled) {
            const resData = resPayload?.data;

            if (resData) {
              setTransactions((txs) => {
                const parsedTxs = parseTransactions(resData);

                if (txs && txs.length > 0) {
                  // We need to keep track of existing tx hashes to prevent duplicates in the final list
                  const existingTxs = new Set<string>();
                  txs.forEach((tx: Transaction) => {
                    if (tx?.txHash) {
                      existingTxs.add(tx.txHash);
                    }
                  });

                  // Add the new set transactions while filtering out duplicates
                  return txs.concat(
                    parsedTxs.filter(
                      (tx: Transaction) => !existingTxs.has(tx.txHash),
                    ),
                  );
                }
                return parsedTxs;
              });
            }

            if (resData?.length < limit) {
              setHasMore(false);
            }
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
