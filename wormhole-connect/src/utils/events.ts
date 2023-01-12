import { BigNumber } from 'ethers';
import {
  ChainId,
  ChainName,
  TokenId,
  EthContext,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { wh } from '../sdk';
import { fromNormalizedDecimals } from '.';
import { CHAINS } from '../config';

export const fetchRedeemedEvent = async (
  destChainId: ChainId | ChainName,
  emitterChainId: ChainId,
  emitterAddress: string,
  sequence: string,
) => {
  const provider = wh.mustGetProvider(destChainId);
  const context: any = wh.getContext(
    destChainId,
  ) as EthContext<WormholeContext>;
  const chainName = wh.toChainName(destChainId) as ChainName;
  const chainConfig = CHAINS[chainName]!;
  const relayer = context.contracts.mustGetTokenBridgeRelayer(destChainId);
  const eventFilter = relayer.filters.TransferRedeemed(
    emitterChainId,
    emitterAddress,
    sequence,
  );
  const currentBlock = await provider.getBlockNumber();
  const events = await relayer.queryFilter(
    eventFilter,
    currentBlock - chainConfig.maxBlockSearch,
  );
  return events ? events[0] : null;
};

export const fetchSwapEvent = async (
  destChainId: ChainId | ChainName,
  recipient: string,
  tokenId: TokenId,
  amount: BigNumber,
  decimals: number,
) => {
  const provider = wh.mustGetProvider(destChainId);
  const context: any = wh.getContext(destChainId);
  const chainName = wh.toChainName(destChainId) as ChainName;
  const chainConfig = CHAINS[chainName]!;
  const relayerContract =
    context.contracts.mustGetTokenBridgeRelayer(destChainId);
  const foreignAsset = await context.getForeignAsset(tokenId, destChainId);
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
  const match = events.filter((e: any) => {
    const normalized = fromNormalizedDecimals(amount, decimals);
    return normalized.eq(e.args[3]);
  });
  return match ? match[0] : null;
};
