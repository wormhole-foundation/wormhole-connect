import { ChainId } from '@wormhole-foundation/wormhole-connect-sdk';
import axios from 'axios';
import config from 'config';
import { hexlify } from 'ethers/lib/utils.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { formatAssetAddress } from 'utils/sdk';
import { RootState } from 'store';
import { getWrappedTokenId } from 'utils';

const REMAINING_NOTIONAL_TOLERANCE = 0.98;

const GOVERNOR_API_BASE_URLS = [
  // prefer to use the wormholescan api first
  config.wormholeApi,
  ...config.wormholeRpcHosts,
];

interface TokenListEntry {
  originAddress: string;
  originChainId: number;
  price: number;
}

interface TokenList {
  entries: TokenListEntry[];
}

interface AvailableNotionalByChainEntry {
  chainId: number;
  availableNotional: number;
  notionalLimit: number;
  maxTransactionSize: number;
}

interface AvailableNotionalByChain {
  data: AvailableNotionalByChainEntry[];
}

export interface ChainLimits {
  chainId: ChainId;
  chainNotionalLimit: number;
  chainRemainingAvailableNotional: number;
  chainBigTransactionSize: number;
  tokenPrice: number;
}

export interface IsTransferLimitedResult {
  isLimited: boolean;
  reason?:
    | 'EXCEEDS_REMAINING_NOTIONAL'
    | 'EXCEEDS_MAX_NOTIONAL'
    | 'EXCEEDS_LARGE_TRANSFER_LIMIT';
  limits?: ChainLimits;
}

const useIsTransferLimited = (): IsTransferLimitedResult => {
  const [tokenList, setTokenList] = useState<TokenList | null>(null);
  const [availableNotionalByChain, setAvailableNotionalByChain] =
    useState<AvailableNotionalByChain | null>(null);
  const [assetAddress, setAssetAddress] = useState<string | undefined>(
    undefined,
  );
  const [assetChain, setAssetChain] = useState<ChainId | undefined>(undefined);

  const { fromChain, token, amount } = useSelector(
    (state: RootState) => state.transferInput,
  );

  const fetchedTokenList = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const formatAddress = async () => {
      if (!token || !fromChain) {
        setAssetAddress(undefined);
        return;
      }
      try {
        const tokenConfig = config.tokens[token];
        const tokenId = getWrappedTokenId(tokenConfig);
        const tokenChain = config.wh.toChainId(tokenId.chain);
        const formatted = hexlify(
          await formatAssetAddress(tokenChain, tokenId.address),
        );
        if (!cancelled) {
          setAssetAddress(formatted);
          setAssetChain(tokenChain);
        }
      } catch (e) {
        if (!cancelled) {
          setAssetAddress(undefined);
        }
      }
    };
    formatAddress();
    return () => {
      cancelled = true;
    };
  }, [token, fromChain]);

  useEffect(() => {
    if (!fetchedTokenList.current) {
      let cancelled = false;
      (async () => {
        for (const rpcHost of GOVERNOR_API_BASE_URLS) {
          try {
            const baseUrl = `${rpcHost}${rpcHost.endsWith('/') ? '' : '/'}`;
            const [tokenListResponse, availableNotionalByChainResponse] =
              await Promise.all([
                axios.get<TokenList>(`${baseUrl}v1/governor/token_list`),
                axios.get<AvailableNotionalByChain>(
                  `${baseUrl}api/v1/governor/limit`,
                ),
              ]);
            if (!cancelled) {
              setTokenList(tokenListResponse?.data || null);
              setAvailableNotionalByChain(
                availableNotionalByChainResponse?.data || null,
              );
              break;
            }
          } catch (error) {
            console.error(error);
          }
          if (cancelled) {
            break;
          }
        }
        return () => {
          cancelled = true;
        };
      })();
      fetchedTokenList.current = true;
    }
  }, []);

  const result = useMemo<IsTransferLimitedResult>(() => {
    if (!fromChain || !token || !amount || !assetAddress || !assetChain)
      return { isLimited: false };

    const fromChainId = config.wh.toChainId(fromChain);

    if (token && fromChain && amount && tokenList && availableNotionalByChain) {
      const token = tokenList.entries.find(
        (entry) =>
          entry.originChainId === assetChain &&
          entry.originAddress === assetAddress,
      );
      if (token) {
        const chain = availableNotionalByChain.data.find(
          (entry) => entry.chainId === fromChainId,
        );
        if (chain) {
          const transferNotional = token.price * Number.parseFloat(amount);
          const isLimitedReason =
            transferNotional > chain.notionalLimit
              ? 'EXCEEDS_MAX_NOTIONAL'
              : transferNotional >
                chain.maxTransactionSize * REMAINING_NOTIONAL_TOLERANCE
              ? 'EXCEEDS_LARGE_TRANSFER_LIMIT'
              : transferNotional >
                chain.availableNotional * REMAINING_NOTIONAL_TOLERANCE
              ? 'EXCEEDS_REMAINING_NOTIONAL'
              : undefined;
          return {
            isLimited: !!isLimitedReason,
            reason: isLimitedReason,
            limits: {
              chainId: fromChainId,
              chainNotionalLimit: chain.notionalLimit,
              chainRemainingAvailableNotional: chain.availableNotional,
              chainBigTransactionSize: chain.maxTransactionSize,
              tokenPrice: token.price,
            },
          };
        }
      }
    }
    return {
      isLimited: false,
    };
  }, [
    fromChain,
    token,
    assetAddress,
    assetChain,
    amount,
    tokenList,
    availableNotionalByChain,
  ]);

  return result;
};

export default useIsTransferLimited;
