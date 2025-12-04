import { useCallback, useEffect, useState } from 'react';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';
import type { Chain } from '@wormhole-foundation/sdk';
import type { ChainId as LifiChainId } from '@lifi/sdk';

import { useConfig } from 'contexts/ConfigContext';
import type { Transaction } from 'config/types';
import { lifiChainIdToChain } from 'routes/lifi/utils';
import { findToken } from 'utils/tokens';

interface LiFiToken {
  address: string;
  chainId: number;
  symbol: string;
  decimals: number;
  name: string;
  priceUSD?: string;
}

interface LiFiTransaction {
  transactionId: string;
  integrator: string;
  status: 'DONE' | 'PENDING' | 'FAILED';
  substatus: string;
  timestamp: string;
  sending: {
    txHash: string;
    txLink: string;
    amount: string;
    token: LiFiToken;
    chainId: number;
    gasPrice: string;
    gasUsed: string;
    gasToken: LiFiToken;
    gasAmountUSD: string;
    amountUSD: string;
    value: string;
    timestamp: string;
  };
  receiving?: {
    txHash: string;
    txLink: string;
    amount: string;
    token: LiFiToken;
    chainId: number;
    gasPrice: string;
    gasUsed: string;
    gasToken: LiFiToken;
    gasAmountUSD: string;
    amountUSD: string;
    value: string;
    timestamp: string;
  };
  fromAddress: string;
  toAddress: string;
  tool: string;
  bridge?: string;
}

type Props = {
  address: string;
  page?: number;
  pageSize?: number;
  chains?: Chain[];
};

const ONE_WEEK = 7 * 24 * 60 * 60; // 1 week per page in seconds
const ONE_YEAR = 365 * 24 * 60 * 60; // 1 year in seconds

const useTransactionHistoryLiFi = (
  props: Props,
): {
  transactions: Array<Transaction> | undefined;
  error: string;
  isFetching: boolean;
  hasMore: boolean;
} => {
  const config = useConfig();
  const [transactions, setTransactions] = useState<
    Array<Transaction> | undefined
  >();
  const [error, setError] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const { address, page = 0, pageSize = 30, chains } = props;

  const resetTransactions = () => {
    setTransactions((current) => (current?.length === 0 ? current : []));
  };

  const parseSingleTx = (tx: LiFiTransaction): Transaction | undefined => {
    try {
      const { sending, receiving, fromAddress, toAddress, status } = tx;

      const fromChain = lifiChainIdToChain(sending.chainId as LifiChainId);
      const toChain = receiving
        ? lifiChainIdToChain(receiving.chainId as LifiChainId)
        : undefined;

      if (!fromChain || !toChain) {
        return undefined;
      }

      const fromToken = findToken(
        fromChain,
        sending.token.address,
        sending.token.symbol,
      );

      const toToken = receiving
        ? findToken(toChain, receiving.token.address, receiving.token.symbol)
        : undefined;

      // Skip if we can't identify the tokens
      if (!fromToken || !toToken) {
        return undefined;
      }

      // Parse amounts
      let sentAmount: sdkAmount.Amount;
      let receivedAmount: sdkAmount.Amount | undefined;

      try {
        sentAmount = sdkAmount.fromBaseUnits(
          BigInt(sending.amount),
          fromToken.decimals,
        );
        receivedAmount = receiving?.amount
          ? sdkAmount.fromBaseUnits(BigInt(receiving.amount), toToken.decimals)
          : undefined;
      } catch (_e) {
        // Skip transaction if amounts cannot be parsed
        return undefined;
      }

      // Parse timestamps
      const sendingTs = parseInt(sending.timestamp, 10);
      const senderTime = isNaN(sendingTs)
        ? new Date()
        : new Date(sendingTs * 1000);

      const receivingTs = receiving?.timestamp
        ? parseInt(receiving.timestamp, 10)
        : undefined;
      const receiverTime =
        receivingTs && !isNaN(receivingTs)
          ? new Date(receivingTs * 1000)
          : undefined;

      const txData: Transaction = {
        txHash: sending.txHash,
        sender: fromAddress,
        recipient: toAddress,
        amount: sdkAmount.display(sentAmount),
        amountUsd: sending.amountUSD
          ? parseFloat(sending.amountUSD)
          : undefined,
        receiveAmount: receivedAmount
          ? sdkAmount.display(receivedAmount)
          : undefined,
        fromChain,
        fromToken,
        toChain,
        toToken,
        senderTimestamp: senderTime.toISOString(),
        receiverTimestamp: receiverTime?.toISOString(),
        explorerLink: `https://scan.li.fi/tx/${sending.txHash}`,
        inProgress: status === 'PENDING',
      };
      return txData;
    } catch (e) {
      console.error('Error parsing LiFi transaction:', e);
      return undefined;
    }
  };

  const parseTransactions = useCallback(
    (allTxs: Array<LiFiTransaction>) => {
      const parsed = allTxs.map((tx) => parseSingleTx(tx)).filter((tx) => !!tx);

      // NOTE: Ideally, filtering would be done at the API level,
      // but the LiFi API does not make this easy when multiple chains are involved.
      // For simplicity, we filter on the client side here.
      if (chains && chains.length > 0) {
        return parsed.filter((tx) => {
          if (!tx) return false;
          return chains.includes(tx.fromChain) || chains.includes(tx.toChain);
        });
      }

      return parsed;
    },
    [chains],
  );

  useEffect(() => {
    let cancelled = false;

    const fetchTransactions = async () => {
      // Don't fetch if we know there are no more results
      if (!hasMore && page > 0) {
        return;
      }

      setIsFetching(true);

      try {
        // LiFi API doesn't have traditional pagination,
        // but we can simulate it using timestamp filtering
        const now = Date.now() / 1000; // Current time in seconds

        const pageOffset = page * ONE_WEEK;

        const toTimestamp = now - pageOffset;
        const fromTimestamp = toTimestamp - ONE_WEEK;

        // Don't fetch if we've gone back more than 1 year
        if (fromTimestamp < now - ONE_YEAR) {
          setHasMore(false);
          return;
        }

        const params = new URLSearchParams({
          wallet: address,
          fromTimestamp: fromTimestamp.toString(),
          toTimestamp: toTimestamp.toString(),
          status: 'ALL',
        });

        const res = await fetch(
          `${config.lifiExplorerUrl}/v1/analytics/transfers?${params}`,
        );

        // Check for various HTTP error conditions
        if (!res.ok) {
          // Handle specific status codes with user-friendly messages
          if (res.status === 429) {
            setError('Rate limit exceeded. Please try again later.');
          } else if (res.status >= 500) {
            setError('LiFi service is temporarily unavailable.');
          } else if (res.status !== 404) {
            // 404 just means no transactions, not an error
            setError('Failed to fetch LiFi transactions.');
          }

          resetTransactions();
          setHasMore(false);
          return;
        }

        let resPayload;
        try {
          resPayload = await res.json();
        } catch (_e) {
          setError('Invalid response from LiFi service');
          resetTransactions();
          setHasMore(false);
          return;
        }

        if (!cancelled) {
          const resData = resPayload?.transfers || resPayload;

          if (Array.isArray(resData)) {
            setTransactions((txs) => {
              const parsedTxs = parseTransactions(resData);

              if (txs && txs.length > 0) {
                // We need to keep track of existing tx hashes to prevent duplicates
                const existingTxs = new Set<string>();
                txs.forEach((tx: Transaction) => {
                  if (tx?.txHash) {
                    existingTxs.add(tx.txHash);
                  }
                });

                // Add new transactions while filtering out duplicates
                return txs.concat(
                  parsedTxs.filter(
                    (tx: Transaction) => !existingTxs.has(tx.txHash),
                  ),
                );
              }
              return parsedTxs;
            });

            // If filtering by chain client-side, disable pagination since we can't
            // reliably determine if there are more matching transactions
            if (chains && chains.length > 0) {
              setHasMore(false);
            } else if (resData.length < pageSize) {
              // LiFi returns max 1000 results, if we get less than pageSize, no more data
              setHasMore(false);
            }
          } else {
            resetTransactions();
            setHasMore(false);
          }
        }
      } catch (error) {
        if (!cancelled) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          setHasMore(false);

          // User-friendly error message
          if (
            errorMessage.includes('NetworkError') ||
            errorMessage.includes('Failed to fetch')
          ) {
            setError('Unable to connect to LiFi service.');
          } else if (errorMessage.includes('timeout')) {
            setError('LiFi request timed out.');
          } else {
            setError('Failed to load LiFi transactions.');
          }
        }
      } finally {
        setIsFetching(false);
      }
    };

    fetchTransactions();

    return () => {
      cancelled = true;
    };
  }, [address, page, pageSize, chains, parseTransactions, hasMore, config]);

  return {
    transactions,
    error,
    isFetching,
    hasMore,
  };
};

export default useTransactionHistoryLiFi;
