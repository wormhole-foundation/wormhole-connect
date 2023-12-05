import {
  ChainName,
  EthContext,
  SolanaContext,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { CHAINS } from 'config';
import { Route } from 'config/types';
import { BigNumber } from 'ethers';
import { isEvmChain } from 'utils/sdk';
import { fromNormalizedDecimals } from '.';
import { SignedMessage } from '../routes';
import RouteOperator from '../routes/operator';
import { ParsedRelayerMessage, wh } from './sdk';
import { fetchGlobalTx, getEmitterAndSequence } from './vaa';

export const fetchRedeemTx = async (
  route: Route,
  txData: SignedMessage,
): Promise<{ transactionHash: string } | null> => {
  let transactionHash: string | undefined;
  if (txData.emitterAddress && txData.sequence) {
    try {
      transactionHash = await fetchGlobalTx(txData);
    } catch {}
  }

  transactionHash = await RouteOperator.tryFetchRedeemTx(route, txData);
  if (transactionHash) {
    return { transactionHash };
  }
  return null;
};

export const fetchRedeemedEvent = async (
  txData: SignedMessage,
): Promise<{ transactionHash: string } | null> => {
  const messageId = getEmitterAndSequence(txData);
  const { emitterChain, emitterAddress, sequence } = messageId;
  const emitter = `0x${emitterAddress}`;

  if (txData.toChain === 'solana') {
    const context = wh.getContext(
      txData.toChain,
    ) as SolanaContext<WormholeContext>;
    const signature = await context.fetchRedeemedSignature(
      emitterChain,
      emitterAddress,
      sequence,
    );
    return signature ? { transactionHash: signature } : null;
  } else {
    const provider = wh.mustGetProvider(txData.toChain);
    const context: any = wh.getContext(
      txData.toChain,
    ) as EthContext<WormholeContext>;
    const chainName = wh.toChainName(txData.toChain) as ChainName;
    const chainConfig = CHAINS[chainName]!;
    const relayer = context.contracts.mustGetTokenBridgeRelayer(txData.toChain);
    const eventFilter = relayer.filters.TransferRedeemed(
      emitterChain,
      emitter,
      sequence,
    );
    const currentBlock = await provider.getBlockNumber();
    const events = await relayer.queryFilter(
      eventFilter,
      currentBlock - chainConfig.maxBlockSearch,
    );
    return events ? events[0] : null;
  }
};

export const fetchSwapEvent = async (txData: ParsedRelayerMessage) => {
  const { tokenId, recipient, toNativeTokenAmount, tokenDecimals } = txData;
  if (txData.toChain === 'solana') {
    const context = wh.getContext(
      txData.toChain,
    ) as SolanaContext<WormholeContext>;
    const messageId = getEmitterAndSequence(txData);
    const { emitterChain, emitterAddress, sequence } = messageId;
    const signature = await context.fetchRedeemedSignature(
      emitterChain,
      emitterAddress,
      sequence,
    );
    if (signature) {
      const relayer = context.contracts.mustGetTokenBridgeRelayer(
        txData.toChain,
      );
      const swapEvent = await relayer.fetchSwapEvent(signature);
      return swapEvent ? BigNumber.from(swapEvent.nativeAmount) : null;
    }
  } else if (isEvmChain(wh.toChainId(txData.toChain))) {
    const provider = wh.mustGetProvider(txData.toChain);
    const context: any = wh.getContext(txData.toChain);
    const chainName = wh.toChainName(txData.toChain) as ChainName;
    const chainConfig = CHAINS[chainName]!;
    const relayerContract = context.contracts.mustGetTokenBridgeRelayer(
      txData.toChain,
    );
    const foreignAsset = await context.getForeignAsset(tokenId, txData.toChain);
    const eventFilter = relayerContract.filters.SwapExecuted(
      recipient,
      undefined,
      foreignAsset,
    );
    const currentBlock = await provider.getBlockNumber();
    const events = await relayerContract.queryFilter(
      eventFilter,
      currentBlock - chainConfig.maxBlockSearch,
    );
    const normalized = fromNormalizedDecimals(
      BigNumber.from(toNativeTokenAmount),
      tokenDecimals,
    );
    const matches = events
      .sort((a: any, b: any) => b.blockNumber - a.blockNumber)
      .filter((e: any) => {
        return normalized.eq(e.args[3]);
      });
    return matches ? matches[0]?.args?.[4] : null;
  }
  return null;
};
