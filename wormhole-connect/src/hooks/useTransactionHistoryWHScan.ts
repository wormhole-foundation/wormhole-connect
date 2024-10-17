import { useCallback, useEffect, useState } from 'react';
import {
  amount as sdkAmount,
  chainIdToChain,
  toNative,
  Wormhole,
} from '@wormhole-foundation/sdk';

import config from 'config';
import { WORMSCAN } from 'config/constants';
import { getGasToken, getTokenById, getWrappedToken } from 'utils';

import type { Chain, ChainId } from '@wormhole-foundation/sdk';
import type { Transaction } from 'config/types';
import { getNativeVersionOfToken } from 'store/transferInput';
import { toFixedDecimals } from 'utils/balance';

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
      tokenChain: ChainId;
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

// TODO: SDKV2 route specific details don't belong here
interface WormholeScanPorticoParsedPayload {
  finalTokenAddress: string;
  flagSet: {
    flags: {
      shouldWrapNative: boolean;
      shouldUnwrapNative: boolean;
    };
  };
  minAmountFinish: string;
  recipientAddress: string;
  relayerFee: string;
}

type Props = {
  address: string;
  page?: number;
  pageSize?: number;
};

// Number of decimals from WHScan API results are fixed to 8
const DECIMALS = 8;

const useTransactionHistoryWHScan = (
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

  const parseSingleTx = (tx: WormholeScanTransaction) => {
    const { content, data, sourceChain, targetChain } = tx;
    const { tokenAmount, usdAmount } = data || {};
    const { standarizedProperties } = content || {};

    const fromChainId = standarizedProperties.fromChain || sourceChain?.chainId;
    const toChainId = standarizedProperties.toChain || targetChain?.chainId;
    const tokenChainId = standarizedProperties.tokenChain;

    const fromChain = chainIdToChain(fromChainId);

    // Skip if we don't have the source chain
    if (!fromChain) {
      return;
    }

    const tokenChain = chainIdToChain(tokenChainId);

    let tokenConfig = getTokenById({
      chain: tokenChain,
      address: standarizedProperties.tokenAddress,
    });

    if (!tokenConfig) {
      // IMPORTANT:
      // If we don't have the token config from the token address,
      // we can check if we can use the symbol to get it.
      // So far this case is only for SUI and APT
      if (data?.symbol && config.tokens[data.symbol]) {
        tokenConfig = config.tokens[data.symbol];
      } else {
        return;
      }
    }

    const toChain = chainIdToChain(toChainId) as Chain;

    // If the sent token is native to the destination chain, use sent token.
    // Otherwise get the wrapped token for the destination chain.
    const receivedTokenKey =
      tokenConfig.nativeChain === toChain
        ? tokenConfig.key
        : getWrappedToken(tokenConfig)?.key;

    // data.tokenAmount holds the normalized token amount value.
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
    // It's unlikely, but in case the above subtraction returns a non-positive number,
    // we should not show that at all.
    const receiveAmountDisplay =
      receiveAmountValue > 0
        ? sdkAmount.display(
            {
              amount: receiveAmountValue.toString(),
              decimals: DECIMALS,
            },
            0,
          )
        : '';

    const txHash = sourceChain.transaction?.txHash;

    // Transaction is in-progress when the below are both true:
    //   1- Source chain has confirmed
    //   2- Target has either not received, or received but not completed
    const inProgress =
      sourceChain?.status?.toLowerCase() === 'confirmed' &&
      targetChain?.status?.toLowerCase() !== 'completed';

    const txData: Transaction = {
      txHash,
      sender: standarizedProperties.fromAddress || sourceChain.from,
      recipient: standarizedProperties.toAddress,
      amount: sentAmountDisplay,
      amountUsd: usdAmount ? Number(usdAmount) : 0,
      receiveAmount: receiveAmountDisplay,
      fromChain,
      toChain,
      tokenKey: tokenConfig.key,
      tokenAddress: standarizedProperties.tokenAddress,
      receivedTokenKey,
      senderTimestamp: sourceChain?.timestamp,
      receiverTimestamp: targetChain?.timestamp,
      explorerLink: `${WORMSCAN}tx/${txHash}${
        config.isMainnet ? '' : '?network=TESTNET'
      }`,
      inProgress,
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

  // Parser for Portico transactions (appId === ETH_BRIDGE or USDT_BRIDGE)
  // IMPORTANT: This is where we can add any customizations specific to Portico data
  // that we have retrieved from WHScan API
  const parsePorticoTx = (tx: WormholeScanTransaction) => {
    const txData = parseSingleTx(tx);
    if (!txData) return;

    const payload = tx.content.payload
      .parsedPayload as unknown as WormholeScanPorticoParsedPayload;

    const {
      finalTokenAddress,
      flagSet,
      minAmountFinish,
      recipientAddress,
      relayerFee,
    } = payload;

    const nativeTokenKey = getNativeVersionOfToken(
      tx.data.symbol,
      txData.fromChain,
    );
    const nativeToken = config.tokens[nativeTokenKey];
    if (!nativeToken) return;

    const startToken = flagSet.flags.shouldWrapNative
      ? getGasToken(txData.fromChain)
      : nativeToken;

    const finalTokenConfig = config.sdkConverter.findTokenConfigV1(
      Wormhole.tokenId(
        txData.toChain,
        toNative(txData.toChain, finalTokenAddress).toString(),
      ),
      config.tokensArr,
    );
    if (!finalTokenConfig) return;

    const receiveAmount = BigInt(minAmountFinish) - BigInt(relayerFee);

    // Override with Portico specific data
    txData.tokenKey = startToken.key;
    txData.tokenAddress = startToken.tokenId?.address || 'native';
    txData.receivedTokenKey = flagSet.flags.shouldUnwrapNative
      ? getGasToken(txData.toChain).key
      : finalTokenConfig.key;
    txData.receiveAmount =
      receiveAmount > 0
        ? toFixedDecimals(
            sdkAmount.display(
              sdkAmount.fromBaseUnits(receiveAmount, finalTokenConfig.decimals),
              0,
            ),
            DECIMALS,
          )
        : '';
    txData.recipient = toNative(txData.toChain, recipientAddress).toString();

    return txData;
  };

  const PARSERS = {
    PORTAL_TOKEN_BRIDGE: parseTokenBridgeTx,
    NATIVE_TOKEN_TRANSFER: parseNTTTx,
    CCTP_WORMHOLE_INTEGRATION: parseCCTPTx,
    ETH_BRIDGE: parsePorticoTx,
    USDT_BRIDGE: parsePorticoTx,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parseTransactions = useCallback(
    (allTxs: Array<WormholeScanTransaction>) => {
      return allTxs
        .map((tx) => {
          // Locate the appIds
          const appIds: Array<string> =
            tx.content?.standarizedProperties?.appIds || [];

          // TODO: SDKV2
          // Some integrations may compose with multiple protocols and have multiple appIds
          // Choose a more specific parser if available
          if (appIds.includes('ETH_BRIDGE') || appIds.includes('USDT_BRIDGE')) {
            return parsePorticoTx(tx);
          }

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
          `${config.wormholeApi}api/v1/operations?address=${address}&page=${page}&pageSize=${pageSize}`,
          { headers },
        );

        // If the fetch was unsuccessful, return an empty set
        if (res.status !== 200) {
          setTransactions([]);
          setHasMore(false);
          setIsFetching(false);
        } else {
          const resPayload = await res.json();

          if (!cancelled) {
            const resData = resPayload?.operations;
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

            if (resData?.length < pageSize) {
              setHasMore(false);
            }
          }
        }
      } catch (error) {
        if (!cancelled) {
          setHasMore(false);
          setError(
            `Error fetching transaction history from WormholeScan: ${error}`,
          );
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

export default useTransactionHistoryWHScan;
