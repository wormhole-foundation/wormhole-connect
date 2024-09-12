import { useEffect, useState } from 'react';
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

  const [mayanIndex, setMayanIndex] = useState(0);
  const [whScanIndex, setWHScanIndex] = useState(0);

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

  useEffect(() => {
    if (hasMoreMayan && mayanPage !== page) {
      setMayanPage(page);
    }

    if (hasMoreWHScan && whScanPage !== page) {
      setWHScanPage(page);
    }
  }, [hasMoreMayan, hasMoreWHScan, page]);

  useEffect(() => {
    if (!whScanTxs || !mayanTxs) {
      return;
    }

    const mergedTxs: Array<Transaction> = [];

    let whScanLocalIdx = whScanIndex;
    let mayanLocalIdx = mayanIndex;

    for (let i = 0; i < pageSize; i++) {
      if (
        whScanLocalIdx === whScanTxs.length - 1 ||
        mayanLocalIdx === mayanTxs.length - 1
      ) {
        setWHScanIndex(whScanLocalIdx + 1);
        setMayanIndex(mayanLocalIdx + 1);
        setTransactions((txs) => {
          if (!txs) {
            return mergedTxs;
          }

          return txs.concat(mergedTxs);
        });
        return;
      }

      const whScanItem = whScanTxs[whScanLocalIdx];
      const mayanItem = mayanTxs[mayanLocalIdx];

      const whScanTime = new Date(whScanItem.senderTimestamp);
      const mayanTime = new Date(mayanItem.senderTimestamp);

      if (whScanTime > mayanTime) {
        mergedTxs.push(whScanItem);
        if (whScanLocalIdx < whScanTxs.length - 1) {
          whScanLocalIdx += 1;
        }
      } else {
        mergedTxs.push(mayanItem);
        if (mayanLocalIdx < mayanTxs.length - 1) {
          mayanLocalIdx += 1;
        }
      }
    }

    setWHScanIndex(whScanLocalIdx + 1);
    setMayanIndex(mayanLocalIdx + 1);
    setTransactions(mergedTxs);
  }, [whScanTxs, mayanTxs]);

  return {
    transactions,
    error: [errorWHScan, errorMayan],
    isFetching: isFetchingWHScan || isFetchingMayan,
    hasMore: hasMoreWHScan || hasMoreMayan,
  };
};

export default useTransactionHistory;
