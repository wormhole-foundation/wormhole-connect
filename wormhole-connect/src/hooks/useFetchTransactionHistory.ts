import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  amount as sdkAmount,
  chainIdToChain,
  resolveWrappedToken,
} from '@wormhole-foundation/sdk';

import config from 'config';

import type { RootState } from 'store';
import type { Chain } from '@wormhole-foundation/sdk';
import type { RelayerFee } from 'store/relay';
import { getTokenById, getTokenDecimals, getWrappedTokenId } from 'utils';

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
  tokenDecimals?: number;

  // Destination token
  receivedTokenKey?: string;
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

  const parseTokenBridgeTx = (tx) => {
    const { content = {}, data = {}, sourceChain = {}, targetChain = {} } = tx;
    const { standarizedProperties = {} } = content;

    const fromChain = chainIdToChain(sourceChain.chainId);

    const tokenConfig = getTokenById({
      chain: fromChain,
      address: standarizedProperties.tokenAddress,
    });

    // Skip if we don't have the source chain or token
    if (!fromChain || !tokenConfig) {
      return;
    }

    const toChain = targetChain?.chainId && chainIdToChain(targetChain.chainId);

    const [, wrappedToken] = resolveWrappedToken(
      config.v2Network,
      toChain,
      tokenConfig.tokenId,
    );

    const decimals = getTokenDecimals(
      fromChain,
      getWrappedTokenId(tokenConfig),
    );

    const sentAmountDisplay = sdkAmount.display(
      {
        amount: standarizedProperties.amount,
        decimals: Math.min(8, decimals),
      },
      0,
    );

    const receiveAmountDisplay = sdkAmount.display(
      {
        amount: (
          standarizedProperties.amount - standarizedProperties.fee
        ).toString(),
        decimals: Math.min(8, decimals),
      },
      0,
    );

    const feeAmountDisplay = sdkAmount.display(
      {
        amount: standarizedProperties.fee,
        decimals: Math.min(8, decimals),
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
      tokenKey: data.symbol,
      receivedTokenKey: getTokenById(wrappedToken)?.key,
      receiveAmount: receiveAmountDisplay,
      receiveNativeAmount: sourceChain.gasTokenNotional,
      relayerFee: {
        fee: Number(feeAmountDisplay),
        tokenKey: data.symbol,
      },
      tokenAddress: standarizedProperties.tokenAddress,
    };

    return txData;
  };

  const SUPPORTED_APPIDS = {
    PORTAL_TOKEN_BRIDGE: parseTokenBridgeTx,
  };

  const parseTransactions = useCallback((allTxs: Array<any>) => {
    const parsedTxs: Array<Transaction> = allTxs.map((tx) => {
      const { appIds = [] } = tx.content?.standarizedProperties;

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
          `${config.wormholeApi}api/v1/operations?address=${sendingWallet.address}`,
          { headers },
        );

        data = await res.json();
      } catch (error) {
        if (!cancelled) {
          setError(`Error fetching transaction history: ${error}`);
        }
      } finally {
        setIsFetching(false);
      }

      if (!cancelled && data?.operations?.length > 0) {
        setTransactions(parseTransactions(data.operations));
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
