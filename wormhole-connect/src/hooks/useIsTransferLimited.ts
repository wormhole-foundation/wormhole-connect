import { ChainId } from '@wormhole-foundation/wormhole-connect-sdk';
import axios from 'axios';
import { TOKENS, WORMHOLE_API } from 'config';
import { hexlify } from 'ethers/lib/utils.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { formatAssetAddress, wh } from 'utils/sdk';
import { RootState } from 'store';
import { getWrappedTokenId } from 'utils';
import { WORMHOLE_RPC_HOSTS } from 'config';

const REMAINING_NOTIONAL_TOLERANCE = 0.98;

const GOVERNOR_API_BASE_URLS = [
  // prefer to use the wormholescan api first
  WORMHOLE_API,
  ...WORMHOLE_RPC_HOSTS,
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
  remainingAvailableNotional: number;
  notionalLimit: number;
  bigTransactionSize: number;
}

interface AvailableNotionalByChain {
  entries: AvailableNotionalByChainEntry[];
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
        const tokenConfig = TOKENS[token];
        const tokenId = getWrappedTokenId(tokenConfig);
        const tokenChain = wh.toChainId(tokenId.chain);
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
            const baseUrl = `${rpcHost}${
              rpcHost.endsWith('/') ? '' : '/'
            }v1/governor`;
            const [tokenListResponse, availableNotionalByChainResponse] =
              await Promise.all([
                axios.get<TokenList>(`${baseUrl}/token_list`),
                axios.get<AvailableNotionalByChain>(
                  `${baseUrl}/available_notional_by_chain`,
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

    const fromChainId = wh.toChainId(fromChain);

    if (token && fromChain && amount && tokenList && availableNotionalByChain) {
      const token = tokenList.entries.find(
        (entry) =>
          entry.originChainId === assetChain &&
          entry.originAddress === assetAddress,
      );
      if (token) {
        const chain = availableNotionalByChain.entries.find(
          (entry) => entry.chainId === fromChainId,
        );
        if (chain) {
          const transferNotional = token.price * Number.parseFloat(amount);
          const isLimitedReason =
            transferNotional > chain.notionalLimit
              ? 'EXCEEDS_MAX_NOTIONAL'
              : transferNotional >
                chain.bigTransactionSize * REMAINING_NOTIONAL_TOLERANCE
              ? 'EXCEEDS_LARGE_TRANSFER_LIMIT'
              : transferNotional >
                chain.remainingAvailableNotional * REMAINING_NOTIONAL_TOLERANCE
              ? 'EXCEEDS_REMAINING_NOTIONAL'
              : undefined;
          return {
            isLimited: !!isLimitedReason,
            reason: isLimitedReason,
            limits: {
              chainId: fromChainId,
              chainNotionalLimit: chain.notionalLimit,
              chainRemainingAvailableNotional: chain.remainingAvailableNotional,
              chainBigTransactionSize: chain.bigTransactionSize,
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
