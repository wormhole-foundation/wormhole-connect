import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { amount as sdkAmount, chainIdToChain } from '@wormhole-foundation/sdk';

import config from 'config';
import { getTokenById, getWrappedToken } from 'utils';

import type { RootState } from 'store';
import type { Chain, ChainId } from '@wormhole-foundation/sdk';
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

interface WormholeScanTransaction {
  id: string;
  content: {
    payload: {
      amount: string;
      callerAppId: string;
      fromAddress: string;
      parsedPayload: {
        feeAmount: string;
        recipientWallet: string;
        toNativeAmount: string;
      };
      toAddress: string;
      toChain: number;
      tokenAddress: string;
      tokenChain: number;
    };
    standarizedProperties: {
      appIds: Array<string>;
      fromChain: ChainId;
      fromAddress: string;
      toChain: ChainId;
      toAddress: string;
      tokenChain: number;
      tokenAddress: string;
      amount: string;
      feeAddress: string;
      feeChain: number;
      fee: string;
    };
  };
  sourceChain: {
    chainId: number;
    timestamp: string;
    transaction: {
      txHash: string;
    };
    from: string;
    status: string;
    fee: string;
    gasTokenNotional: string;
    feeUSD: string;
  };
  targetChain?: {
    chainId: 6;
    timestamp: string;
    transaction: {
      txHash: string;
    };
    status: string;
    from: string;
    to: string;
    fee: string;
    gasTokenNotional: string;
    feeUSD: string;
  };
  data: {
    symbol: string;
    tokenAmount: string;
    usdAmount: string;
  };
}

type Props = {
  page?: number;
  pageSize?: number;
};

// Number of decimals from WHScan API results are fixed to 8
const DECIMALS = 8;

const useFetchTransactionHistory = (
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

  const { sending: sendingWallet } = useSelector(
    (state: RootState) => state.wallet,
  );

  const { page = 0, pageSize = 30 } = props;

  const parseSingleTx = (tx: WormholeScanTransaction) => {
    const { content, data, sourceChain, targetChain } = tx;
    const { tokenAmount, usdAmount } = data || {};
    const { standarizedProperties } = content || {};

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
    const toChainConfig = config.chains[toChain];

    // If the sent token is native to the destination chain, use sent token.
    // Otherwise get the wrapepd token for the destination chain.
    const receivedTokenKey =
      tokenConfig.nativeChain === toChain
        ? tokenConfig.key
        : getWrappedToken(tokenConfig)?.key;

    // data.tokenAmount holds the normalized token ammount value.
    // Otherwise we need to format standarizedProperties.amount using decimals
    const sentAmountDisplay =
      tokenAmount ??
      sdkAmount.display(
        {
          amount: standarizedProperties.amount,
          decimals: DECIMALS,
        },
        0,
      );

    const receiveAmountValue =
      BigInt(standarizedProperties.amount) - BigInt(standarizedProperties.fee);
    const receiveAmountDisplay = sdkAmount.display(
      {
        amount: receiveAmountValue.toString(),
        decimals: DECIMALS,
      },
      0,
    );

    const feeAmountDisplay = sdkAmount.display(
      {
        amount: standarizedProperties.fee,
        decimals: DECIMALS,
      },
      0,
    );

    const txData: Transaction = {
      txHash: sourceChain.transaction?.txHash,
      sender: standarizedProperties.fromAddress || sourceChain.from,
      amount: sentAmountDisplay,
      amountUsd: usdAmount ? Number(usdAmount) : 0,
      recipient: standarizedProperties.toAddress,
      toChain,
      fromChain,
      tokenKey: tokenConfig.key,
      receivedTokenKey,
      receiveAmount: receiveAmountDisplay,
      relayerFee: {
        fee: Number(feeAmountDisplay),
        tokenKey: toChainConfig?.gasToken || '',
      },
      tokenAddress: standarizedProperties.tokenAddress,
      senderTimestamp: sourceChain?.timestamp,
      receiverTimestamp: targetChain?.timestamp,
    };

    return txData;
  };

  // Parser for Portal Token Bridge transactions (appId === PORTAL_TOKEN_BRIDGE)
  // IMPORTANT: This is where we can add any customizations specific to Token Bridge data
  // that we have retrieved from WHScan API
  const parseTokenBridgeTx = (tx: WormholeScanTransaction) => {
    return parseSingleTx(tx);
  };

  // Parser for NTT transactions (appId === NATIVE_TOKEN_TRANSFER)
  // IMPORTANT: This is where we can add any customizations specific to NTT data
  // that we have retrieved from WHScan API
  const parseNTTTx = (tx: WormholeScanTransaction) => {
    return parseSingleTx(tx);
  };

  // Parser for CCTP transactions (appId === CCTP_WORMHOLE_INTEGRATION)
  // IMPORTANT: This is where we can add any customizations specific to CCTP data
  // that we have retrieved from WHScan API
  const parseCCTPTx = (tx: WormholeScanTransaction) => {
    return parseSingleTx(tx);
  };

  const PARSERS = {
    PORTAL_TOKEN_BRIDGE: parseTokenBridgeTx,
    NATIVE_TOKEN_TRANSFER: parseNTTTx,
    CCTP_WORMHOLE_INTEGRATION: parseCCTPTx,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parseTransactions = useCallback(
    (allTxs: Array<WormholeScanTransaction>) => {
      return allTxs
        .map((tx) => {
          // Locate the appIds
          const appIds: Array<string> =
            tx.content?.standarizedProperties?.appIds || [];

          for (const appId of appIds) {
            // Retrieve the parser for an appId
            const parser = PARSERS[appId];

            // If no parsers specified for the given appIds, we'll skip this transaction
            if (parser) {
              return parser(tx);
            }
          }
        })
        .filter((tx) => !!tx); // Filter out unsupported transactions
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    const headers = new Headers({
      accept: 'application/json',
    });

    const fetchTransactions = async () => {
      setIsFetching(true);

      try {
        const res = await fetch(
          `${config.wormholeApi}api/v1/operations?address=${sendingWallet.address}&page=${page}&pageSize=${pageSize}`,
          { headers },
        );

        const data = await res.json();

        if (!cancelled) {
          if (data?.operations?.length > 0) {
            setTransactions((txs) => {
              const parsedTxs = parseTransactions(data.operations);
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

          if (data?.operations?.length < pageSize) {
            setHasMore(false);
          }
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
  }, [page, pageSize]);

  return {
    transactions,
    error,
    isFetching,
    hasMore,
  };
};

export default useFetchTransactionHistory;
