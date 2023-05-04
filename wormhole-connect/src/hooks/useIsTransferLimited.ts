import axios from 'axios';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChainId } from '@certusone/wormhole-sdk';
import { useSelector } from 'react-redux';
import { RootState } from 'store';
import { wh } from 'sdk';
import { TOKENS } from 'config';

const REMAINING_NOTIONAL_TOLERANCE = 0.98;
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

const CLUSTER = 'mainnet';
export const WORMHOLE_RPC_HOSTS =
  CLUSTER === 'mainnet'
    ? [
        'https://wormhole-v2-mainnet-api.certus.one',
        'https://wormhole.inotel.ro',
        'https://wormhole-v2-mainnet-api.mcf.rocks',
        'https://wormhole-v2-mainnet-api.chainlayer.network',
        'https://wormhole-v2-mainnet-api.staking.fund',
        'https://wormhole-v2-mainnet.01node.com',
      ]
    : CLUSTER === 'testnet'
    ? ['https://wormhole-v2-testnet-api.certus.one']
    : ['http://localhost:7071'];

export const useIsTransferLimited = (): IsTransferLimitedResult => {
  const [tokenList, setTokenList] = useState<TokenList | null>(null);
  const [availableNotionalByChain, setAvailableNotionalByChain] =
    useState<AvailableNotionalByChain | null>(null);

  const { fromNetwork, toNetwork, token, amount } = useSelector(
    (state: RootState) => state.transfer,
  );
  if (!fromNetwork || !toNetwork || !token || !amount)
    return { isLimited: false };

  const fromChainId = wh.toChainId(fromNetwork);
  const tokenConfig = TOKENS[token]!;

  const effectTriggered = useRef(false);

  useEffect(() => {
    if (!effectTriggered.current && amount) {
      let cancelled = false;
      (async () => {
        for (const rpcHost of WORMHOLE_RPC_HOSTS) {
          try {
            const baseUrl = `${rpcHost}/v1/governor`;
            const [tokenListResponse, availableNotionalByChainResponse] =
              await Promise.all([
                axios.get<TokenList>(`${baseUrl}/token_list`),
                axios.get<AvailableNotionalByChain>(
                  `${baseUrl}/available_notional_by_chain`,
                ),
              ]);
            if (!cancelled) {
              setTokenList(tokenListResponse.data);
              setAvailableNotionalByChain(
                availableNotionalByChainResponse.data,
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
      effectTriggered.current = true;
    }
  }, [amount]);

  const result = useMemo<IsTransferLimitedResult>(() => {
    if (
      token &&
      fromNetwork &&
      amount &&
      tokenList &&
      availableNotionalByChain
    ) {
      const token = tokenList.entries.find(
        (entry) =>
          entry.originChainId === fromChainId &&
          entry.originAddress === tokenConfig.tokenId?.address,
      );
      if (token) {
        const chain = availableNotionalByChain.entries.find(
          (entry) => entry.chainId === fromChainId,
        );
        if (chain) {
          const transferNotional = token.price * amount;
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
    fromNetwork,
    token,
    toNetwork,
    amount,
    tokenList,
    availableNotionalByChain,
  ]);

  return result;
};

export default useIsTransferLimited;
