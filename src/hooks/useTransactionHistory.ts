import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import useTransactionHistoryWHScan from 'hooks/useTransactionHistoryWHScan';
import useTransactionHistoryMayan from 'hooks/useTransactionHistoryMayan';
import useTransactionHistoryLiFi from 'hooks/useTransactionHistoryLiFi';

import config from 'config';
import type { Transaction } from 'config/types';
import type { RootState } from 'store';
import { sortByTime } from 'utils/sort';

type Props = {
  page?: number;
  pageSize?: number;
};

const useTransactionHistory = (
  props?: Props,
): {
  transactions: Array<Transaction> | undefined;
  error: Array<string>;
  isFetching: boolean;
  hasMore: boolean;
} => {
  const { page = 0, pageSize = 30 } = props || {};

  // Keeping separate indexes to track the last rendered item in respective transaction sets
  const [mayanIndex, setMayanIndex] = useState(0);
  const [whScanIndex, setWHScanIndex] = useState(0);
  const [lifiIndex, setLiFiIndex] = useState(0);

  // We need to keep the last fetched pages from each APIs
  // as the number of items in a page from each API can be different when sorted by time.
  const [mayanPage, setMayanPage] = useState(page);
  const [whScanPage, setWHScanPage] = useState(page);
  const [lifiPage, setLiFiPage] = useState(page);

  const [transactions, setTransactions] = useState<Array<Transaction>>();

  const { address } = useSelector((state: RootState) => state.wallet.sending);

  const {
    transactions: whScanTxs,
    isFetching: isFetchingWHScan,
    hasMore: hasMoreWHScan,
    error: errorWHScan,
  } = useTransactionHistoryWHScan({
    address,
    page: whScanPage,
    pageSize,
    chains: config.ui.transactionHistoryChains,
  });

  const {
    transactions: mayanTxs,
    isFetching: isFetchingMayan,
    hasMore: hasMoreMayan,
    error: errorMayan,
  } = useTransactionHistoryMayan({
    address,
    page: mayanPage,
    pageSize,
    chains: config.ui.transactionHistoryChains,
  });

  const {
    transactions: lifiTxs,
    isFetching: isFetchingLiFi,
    hasMore: hasMoreLiFi,
    error: errorLiFi,
  } = useTransactionHistoryLiFi({
    address,
    page: lifiPage,
    pageSize,
    chains: config.ui.transactionHistoryChains,
  });

  const appendTxs = useCallback(
    (prevTxs: Array<Transaction> | undefined, nextTxs: Array<Transaction>) => {
      if (!prevTxs) {
        return nextTxs;
      }

      return prevTxs.concat(nextTxs);
    },
    [],
  );

  // Updates the index tracker for transactions from WHScan
  const updateWHScanIndex = useCallback(
    (indexValue: number) => {
      if (!whScanTxs || indexValue <= whScanTxs?.length) {
        setWHScanIndex(indexValue);
      }
    },
    [whScanTxs],
  );

  // Updates the index tracker for transactions from Mayan
  const updateMayanIndex = useCallback(
    (indexValue: number) => {
      if (!mayanTxs || indexValue <= mayanTxs?.length) {
        setMayanIndex(indexValue);
      }
    },
    [mayanTxs],
  );

  // Updates the index tracker for transactions from LiFi
  const updateLiFiIndex = useCallback(
    (indexValue: number) => {
      if (!lifiTxs || indexValue <= lifiTxs?.length) {
        setLiFiIndex(indexValue);
      }
    },
    [lifiTxs],
  );

  // Sets the page for each API hook,
  // only when there are more items in the respective data sources.
  useEffect(() => {
    if (hasMoreMayan && mayanPage !== page) {
      setMayanPage(page);
    }

    if (hasMoreWHScan && whScanPage !== page) {
      setWHScanPage(page);
    }

    if (hasMoreLiFi && lifiPage !== page) {
      setLiFiPage(page);
    }
  }, [
    hasMoreMayan,
    hasMoreWHScan,
    hasMoreLiFi,
    mayanPage,
    page,
    whScanPage,
    lifiPage,
  ]);

  // Side-effect to merge transactions in time-order whenever there is new data
  useEffect(() => {
    // Skip only if ALL sources have no data
    if (!whScanTxs?.length && !mayanTxs?.length && !lifiTxs?.length) {
      return;
    }

    // Initialize with empty arrays if a source has no data
    const whScanTransactions = whScanTxs || [];
    const mayanTransactions = mayanTxs || [];
    const lifiTransactions = lifiTxs || [];

    const mergedTxs: Array<Transaction> = [];

    // We need to update the indexes locally until the merge is completed
    let whScanLocalIdx = whScanIndex;
    let mayanLocalIdx = mayanIndex;
    let lifiLocalIdx = lifiIndex;

    for (let i = 0; i < pageSize; i++) {
      if (
        (whScanLocalIdx === whScanTransactions.length && hasMoreWHScan) ||
        (mayanLocalIdx === mayanTransactions.length && hasMoreMayan) ||
        (lifiLocalIdx === lifiTransactions.length && hasMoreLiFi)
      ) {
        // This case happens when we reach the last item of a transactions list
        // where it still has more in the API. Therefore we can't continue
        // to merge until we have the next set of transactions from that API.
        // We'll finish merging and wait for user to request the next page.

        // Update the indexes to the next item in respective data sources
        updateWHScanIndex(whScanLocalIdx);
        updateMayanIndex(mayanLocalIdx);
        updateLiFiIndex(lifiLocalIdx);

        // Append the merged transactions and exit
        const newTxs = appendTxs(transactions, mergedTxs);
        setTransactions(newTxs);
        return;
      }

      const whScanItem = whScanTransactions[whScanLocalIdx];
      const mayanItem = mayanTransactions[mayanLocalIdx];
      const lifiItem = lifiTransactions[lifiLocalIdx];

      if (!whScanItem && !mayanItem && !lifiItem) {
        // This case happens when we reach to the end of all resources at the same time.
        // We'll finish merging and wait for user to request the next page.

        // Update the indexes to the next item in respective data sources
        updateWHScanIndex(whScanLocalIdx);
        updateMayanIndex(mayanLocalIdx);
        updateLiFiIndex(lifiLocalIdx);
        // Append the merged transactions and exit
        const newTxs = appendTxs(transactions, mergedTxs);
        setTransactions(newTxs);
        return;
      }

      // Find the most recent transaction among the three sources
      const items: Array<{
        item: Transaction;
        source: 'whscan' | 'mayan' | 'lifi';
        time: Date;
      }> = [];

      if (whScanItem) {
        items.push({
          item: whScanItem,
          source: 'whscan',
          time: new Date(whScanItem.senderTimestamp),
        });
      }
      if (mayanItem) {
        items.push({
          item: mayanItem,
          source: 'mayan',
          time: new Date(mayanItem.senderTimestamp),
        });
      }
      if (lifiItem) {
        items.push({
          item: lifiItem,
          source: 'lifi',
          time: new Date(lifiItem.senderTimestamp),
        });
      }

      // Sort by time (most recent first)
      const sortedItems = sortByTime(items);

      // Push the most recent transaction
      const mostRecent = sortedItems[0];
      if (mostRecent.item) {
        mergedTxs.push(mostRecent.item);
      }

      // Update the appropriate index
      if (mostRecent.source === 'whscan') {
        whScanLocalIdx += 1;
      } else if (mostRecent.source === 'mayan') {
        mayanLocalIdx += 1;
      } else if (mostRecent.source === 'lifi') {
        lifiLocalIdx += 1;
      }
    }

    // This case happens when there are sufficient number of transactions from both APIs
    // in a single round of data fetching. Therefore the merger didn't reach
    // to the end of the either transaction list before the pageSize.
    // We'll finish merging and wait for user to request the next page.

    // Update the indexes to the next item in respective data sources
    updateWHScanIndex(whScanLocalIdx);
    updateMayanIndex(mayanLocalIdx);
    updateLiFiIndex(lifiLocalIdx);

    // Check duplicates in merged transactions
    const mergedTxsSet = new Set<string>();
    const uniqMergedTxs = appendTxs(transactions, mergedTxs).filter((tx) => {
      if (tx.txHash && mergedTxsSet.has(tx.txHash)) {
        return false;
      }
      mergedTxsSet.add(tx.txHash);
      return true;
    });

    setTransactions(uniqMergedTxs);
    // We only need to re-run this side-effect when any of the transaction data changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whScanTxs, mayanTxs, lifiTxs]);

  return {
    transactions,
    error: [errorWHScan, errorMayan, errorLiFi],
    isFetching: isFetchingWHScan || isFetchingMayan || isFetchingLiFi,
    hasMore: hasMoreWHScan || hasMoreMayan || hasMoreLiFi,
  };
};

export default useTransactionHistory;
