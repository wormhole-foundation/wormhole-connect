import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  chainIdToChain,
  amount as sdkAmount,
  resolveWrappedToken,
} from '@wormhole-foundation/sdk';

import config from 'config';

import type { RootState } from 'store';
import type { Chain } from '@wormhole-foundation/sdk';
import type { RelayerFee } from 'store/relay';
import { getTokenDecimals, getWrappedTokenId } from 'utils';

export interface Transaction {
  // Transaction hash
  txHash: string;

  // Stringified addresses
  sender?: string;
  recipient: string;

  amount: string;
  amountUsd: string;

  toChain: Chain;
  fromChain: Chain;

  // Source token address
  tokenAddress: string;
  tokenKey: string;
  tokenDecimals: number;

  // Destination token
  receivedTokenKey: string;
  receiveAmount?: string;
  relayerFee?: RelayerFee;

  // Amount of native gas being received, in destination gas token units
  // For example 1.0 is 1.0 ETH, not 1 wei
  receiveNativeAmount?: number;
}

const useFetchTransactionHistory = (): {
  transactions: Array<Transaction>;
  error: string;
  isFetching: boolean;
} => {
  const [transactions, setTransactions] = useState<Array<Transaction>>([]);
  const [error, setError] = useState('');
  const [isFetching, setIsFetching] = useState(false);

  const { sending: sendingWallet } = useSelector(
    (state: RootState) => state.wallet,
  );

  const parseTransactions = useCallback((allTxs: Array<any>) => {
    const connectTxs = allTxs.filter((tx) =>
      tx.content?.standarizedProperties?.appIds.includes('CONNECT'),
    );

    const parsedTxs: Array<Transaction> = connectTxs.map((tx) => {
      const {
        content = {},
        data = {},
        sourceChain = {},
        targetChain = {},
      } = tx;

      const { payload = {}, standarizedProperties = {} } = content;
      const { parsedPayload = {} } = payload;
      const { targetRelayerFee, toNativeAmount, toNativeTokenAmount } =
        parsedPayload;

      const fromChain = chainIdToChain(sourceChain.chainId);
      const toChain = chainIdToChain(targetChain.chainId);

      const tokenDecimals = getTokenDecimals(
        fromChain,
        getWrappedTokenId(config.tokens[data.symbol]),
      );

      const fee = standarizedProperties.fee ?? targetRelayerFee;

      const receiveAmount = sdkAmount.fromBaseUnits(
        BigInt(standarizedProperties.amount) - BigInt(fee),
        tokenDecimals,
      );

      const feeAmount = sdkAmount.fromBaseUnits(fee, tokenDecimals);

      const gasAmount = sdkAmount.fromBaseUnits(
        toNativeAmount ?? toNativeTokenAmount,
        tokenDecimals,
      );

      const txData: Transaction = {
        txHash: sourceChain.transaction?.txHash,
        sender: standarizedProperties.fromAddress,
        amount: data.tokenAmount,
        amountUsd: data.usdAmount,
        recipient: standarizedProperties.toAddress,
        toChain,
        fromChain,
        tokenKey: data.symbol,
        receivedTokenKey: '',
        receiveAmount: sdkAmount.whole(receiveAmount).toString(),
        receiveNativeAmount: sdkAmount.whole(gasAmount),
        relayerFee: {
          fee: sdkAmount.whole(feeAmount),
          tokenKey: data.symbol,
        },
        tokenAddress: standarizedProperties.tokenAddress,
        tokenDecimals,
      };

      return txData;
    });

    return parsedTxs;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const headers = new Headers({
      accept: 'application/json',
    });

    const fetchTransactions = async () => {
      setIsFetching(true);

      try {
        const res = await fetch(
          `${config.wormholeApi}api/v1/operations?address=${sendingWallet.address}`,
          { headers },
        );

        const data = await res.json();

        if (!cancelled && data?.operations?.length > 0) {
          setTransactions(parseTransactions(data.operations));
        }
      } catch (error) {
        if (!cancelled) {
          setError(`Error fetching transaction history: ${error}`);
        }
      } finally {
        setIsFetching(false);
      }
    };

    fetchTransactions();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    transactions,
    error,
    isFetching,
  };
};

export default useFetchTransactionHistory;
