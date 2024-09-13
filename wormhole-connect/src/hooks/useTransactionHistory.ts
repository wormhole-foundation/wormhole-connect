import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import useTransactionHistoryWHScan from 'hooks/useTransactionHistoryWHScan';
import useTransactionHistoryMayan from 'hooks/useTransactionHistoryMayan';

import type { Transaction } from 'config/types';
import type { RootState } from 'store';

type Props = {
  page?: number;
  pageSize?: number;
};

const useTransactionHistory = (
  props: Props,
): {
  transactions: Array<Transaction> | undefined;
  error: Array<string>;
  isFetching: boolean;
  hasMore: boolean;
} => {
  const { page = 0, pageSize = 30 } = props;

  // Keeping separate indexes to track the last rendered item in respective transaction sets
  const [mayanIndex, setMayanIndex] = useState(0);
  const [whScanIndex, setWHScanIndex] = useState(0);

  // We need to keep the last fetched pages from each APIs
  // as the number of items in a page from each API can be different when sorted by time.
  const [mayanPage, setMayanPage] = useState(page);
  const [whScanPage, setWHScanPage] = useState(page);

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
      if (whScanTxs && indexValue <= whScanTxs?.length) {
        setWHScanIndex(indexValue);
      }
    },
    [whScanTxs],
  );

  // Updates the index tracker for transactions from Mayan
  const updateMayanIndex = useCallback(
    (indexValue: number) => {
      if (mayanTxs && indexValue <= mayanTxs?.length) {
        setMayanIndex(indexValue);
      }
    },
    [mayanTxs],
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
  }, [hasMoreMayan, hasMoreWHScan, page]);

  // Side-effect to merge transactions in time-order whenever there is new data
  useEffect(() => {
    if (!whScanTxs || !mayanTxs) {
      return;
    }

    const mergedTxs: Array<Transaction> = [];

    // We need to update the indexes locally until the merge is completed
    let whScanLocalIdx = whScanIndex;
    let mayanLocalIdx = mayanIndex;

    for (let i = 0; i < pageSize; i++) {
      if (
        (whScanLocalIdx === whScanTxs.length && hasMoreWHScan) ||
        (mayanLocalIdx === mayanTxs.length && hasMoreMayan)
      ) {
        // This case happens when we reach the last item of a transactions list
        // where it still has more in the API. Therefore we can't continue
        // to merge until we have the next set of transactions from that API.
        // We'll finish merging and wait for user to request the next page.

        // Update the indexes to the next item in respective data sources
        updateWHScanIndex(whScanLocalIdx);
        updateMayanIndex(mayanLocalIdx);

        // Append the merged transactions and exit
        setTransactions((txs) => appendTxs(txs, mergedTxs));
        return;
      }

      const whScanItem = whScanTxs[whScanLocalIdx];
      const mayanItem = mayanTxs[mayanLocalIdx];

      if (!whScanItem && !mayanItem) {
        // This case happens when we reach to the end of each resources at the same time.
        // We'll finish merging and wait for user to request the next page.

        // Update the indexes to the next item in respective data sources
        updateWHScanIndex(whScanLocalIdx);
        updateMayanIndex(mayanLocalIdx);
        // Append the merged transactions and exit
        setTransactions((txs) => appendTxs(txs, mergedTxs));
        return;
      }

      if (!mayanItem) {
        // No item left in Mayan transactions
        mergedTxs.push(whScanItem);
        whScanLocalIdx += 1;
      } else if (!whScanItem) {
        // No item left in WHScan transactions
        mergedTxs.push(mayanItem);
        mayanLocalIdx += 1;
      } else {
        // We have both WHScan and Mayan transactions
        // This is the main scenario where we compare the timestamps and push the most recent
        const whScanTime = new Date(whScanItem.senderTimestamp);
        const mayanTime = new Date(mayanItem.senderTimestamp);

        if (whScanTime > mayanTime) {
          mergedTxs.push(whScanItem);
          whScanLocalIdx += 1;
        } else {
          mergedTxs.push(mayanItem);
          mayanLocalIdx += 1;
        }
      }
    }

    // This case happens when there are sufficient number of transactions from both APIs
    // in a single round of data fetching. Therefore the merger didn't reach
    // to the end of the either transaction list before the pageSize.
    // We'll finish merging and wait for user to request the next page.

    // Update the indexes to the next item in respective data sources
    updateWHScanIndex(whScanLocalIdx);
    updateMayanIndex(mayanLocalIdx);
    // Append the merged transactions and exit
    setTransactions((txs) => appendTxs(txs, mergedTxs));
  }, [whScanTxs, mayanTxs]);

  return {
    transactions,
    error: [errorWHScan, errorMayan],
    isFetching: isFetchingWHScan || isFetchingMayan,
    hasMore: hasMoreWHScan || hasMoreMayan,
  };
};

export default useTransactionHistory;
