import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { amount as sdkAmount, chainIdToChain } from '@wormhole-foundation/sdk';

import config from 'config';
import { getTokenById, getWrappedToken } from 'utils';

import type { RootState } from 'store';
import type { Chain } from '@wormhole-foundation/sdk';
import type { RelayerFee } from 'store/relay';

export interface Transaction {
  // Transaction hash
  txHash: string;

  // Stringified addresses
  sender?: string;
  recipient: string;

  amount: string;
  amountUsd: number;

  toChain: Chain;
  fromChain: Chain;

  // Source token address
  tokenAddress: string;
  tokenKey: string;
  tokenDecimals?: number;

  // Destination token
  receivedTokenKey?: string;
  receiveAmount?: string;
  relayerFee?: RelayerFee;

  // Amount of native gas being received, in destination gas token units
  // For example 1.0 is 1.0 ETH, not 1 wei
  receiveNativeAmount?: number;

  // Timestamps
  senderTimestamp?: string;
  receiverTimestamp?: string;
}

type Props = {
  page?: number;
  pageSize?: number;
};

const useFetchTransactionHistory = (
  props: Props,
): {
  transactions: Array<Transaction>;
  error: string;
  isFetching: boolean;
  hasMore: boolean;
} => {
  const [transactions, setTransactions] = useState<Array<Transaction>>([]);
  const [error, setError] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const { sending: sendingWallet } = useSelector(
    (state: RootState) => state.wallet,
  );

  const { page = 0, pageSize = 30 } = props;

  const parseTokenBridgeTx = (tx) => {
    const { content = {}, data = {}, sourceChain = {}, targetChain = {} } = tx;
    const { standarizedProperties = {} } = content;

    const fromChainId = standarizedProperties.fromChain || sourceChain?.chainId;
    const toChainId = standarizedProperties.toChain || targetChain?.chainId;

    const fromChain = chainIdToChain(fromChainId);

    // Skip if we don't have the source chain
    if (!fromChain) {
      return;
    }

    const tokenConfig = getTokenById({
      chain: fromChain,
      address: standarizedProperties.tokenAddress,
    });

    // Skip if we don't have the source token
    if (!tokenConfig) {
      return;
    }

    const toChain = chainIdToChain(toChainId) as Chain;
    const toChainConfig = config.chains[toChain]!;

    const receivedTokenKey =
      tokenConfig.nativeChain === toChain
        ? tokenConfig.key
        : getWrappedToken(tokenConfig)?.key;

    // Reverse engineering the conversion rate:
    //   data.tokenAmount is the actual value and standarizedProperties.amount is the denomination.
    //   There has been unexpected conversaion rates in API responses. Therefore we are
    //   sniffing out the decimals from the conversion rate of between these two values.
    const conversionRate =
      Number(standarizedProperties.amount) / Number(data.tokenAmount);
    const decimals = conversionRate.toString().length - 1;

    const sentAmountDisplay = sdkAmount.display(
      {
        amount: standarizedProperties.amount,
        decimals,
      },
      0,
    );

    const receiveAmountValue = Math.max(
      standarizedProperties.amount - standarizedProperties.fee,
      0,
    );
    const receiveAmountDisplay = sdkAmount.display(
      {
        amount: receiveAmountValue.toString(),
        decimals,
      },
      0,
    );

    const feeAmountDisplay = sdkAmount.display(
      {
        amount: standarizedProperties.fee,
        decimals,
      },
      0,
    );

    const txData: Transaction = {
      txHash: sourceChain.transaction?.txHash,
      sender: standarizedProperties.fromAddress || sourceChain.from,
      amount: sentAmountDisplay,
      amountUsd: data.usdAmount,
      recipient: standarizedProperties.toAddress,
      toChain,
      fromChain,
      tokenKey: tokenConfig.key,
      receivedTokenKey,
      receiveAmount: receiveAmountDisplay,
      relayerFee: {
        fee: Number(feeAmountDisplay),
        tokenKey: toChainConfig?.gasToken,
      },
      tokenAddress: standarizedProperties.tokenAddress,
      senderTimestamp: sourceChain?.timestamp,
      receiverTimestamp: targetChain?.timestamp,
    };

    return txData;
  };

  const SUPPORTED_APPIDS = {
    PORTAL_TOKEN_BRIDGE: parseTokenBridgeTx,
  };

  const parseTransactions = useCallback((allTxs: Array<any>) => {
    const parsedTxs: Array<Transaction> = allTxs.map((tx) => {
      const appIds = tx.content?.standarizedProperties?.appIds || [];

      let txParser;

      appIds.forEach((appId) => {
        if (typeof SUPPORTED_APPIDS[appId] === 'function') {
          txParser = SUPPORTED_APPIDS[appId];
        }
      });

      return txParser?.(tx);
    });

    return parsedTxs.filter((tx) => !!tx);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const headers = new Headers({
      accept: 'application/json',
    });

    const fetchTransactions = async () => {
      setIsFetching(true);
      let data;

      try {
        const res = await fetch(
          `${config.wormholeApi}api/v1/operations?address=${sendingWallet.address}&page=${page}&pageSize=${pageSize}`,
          { headers },
        );

        data = await res.json();
      } catch (error) {
        if (!cancelled) {
          setError(`Error fetching transaction history: ${error}`);
        }

        setIsFetching(false);
      }

      if (!cancelled) {
        if (data?.operations?.length > 0) {
          setTransactions((txs) => {
            const parsedTxs = parseTransactions(data.operations);
            if (txs?.length > 0) {
              return txs.concat(parsedTxs);
            }
            return parsedTxs;
          });
        }

        if (data?.operations?.length < pageSize) {
          setHasMore(false);
        }

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

export default useFetchTransactionHistory;
