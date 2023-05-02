import { BigNumber } from 'ethers';
import {
  ChainId,
  ChainName,
  TokenId,
  EthContext,
  SuiContext,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { wh } from '../sdk';
import { fromNormalizedDecimals } from '.';
import { CHAINS } from '../config';
import { arrayify } from 'ethers/lib/utils.js';

export const fetchRedeemedEvent = async (
  destChainId: ChainId | ChainName,
  emitterChainId: ChainId,
  emitterAddress: string,
  sequence: string,
) => {
  if (destChainId === 'sui') {
    const context = wh.getContext(destChainId) as SuiContext<WormholeContext>;
    const { suiOriginalTokenBridgePackageId } =
      context.context.mustGetContracts('sui');
    if (!suiOriginalTokenBridgePackageId)
      throw new Error('suiOriginalTokenBridgePackageId not set');
    const provider = context.provider;
    // full nodes don't let us filter by `MoveEventField`
    const events = await provider.queryEvents({
      query: {
        MoveEventType: `${suiOriginalTokenBridgePackageId}::complete_transfer::TransferRedeemed`,
      },
    });
    for (const event of events.data) {
      if (
        `0x${Buffer.from(event.parsedJson?.emitter_address.value.data).toString(
          'hex',
        )}` === emitterAddress &&
        Number(event.parsedJson?.emitter_chain) === emitterChainId &&
        event.parsedJson?.sequence === sequence
      ) {
        return { transactionHash: event.id.txDigest };
      }
    }
    return null;
  } else {
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
  }
};

export const fetchSwapEvent = async (
  destChainId: ChainId | ChainName,
  recipient: string,
  tokenId: TokenId,
  amount: BigNumber,
  decimals: number,
) => {
  if (destChainId === 'sui') {
    const context = wh.getContext(destChainId) as SuiContext<WormholeContext>;
    const { suiRelayerPackageId } = context.context.mustGetContracts('sui');
    if (!suiRelayerPackageId) throw new Error('suiRelayerPackageId not set');
    const provider = context.provider;
    // full nodes don't let us query by `MoveEventField`
    const events = await provider.queryEvents({
      query: {
        MoveEventType: `${suiRelayerPackageId}::redeem::SwapExecuted`,
      },
    });
    const tokenContext = wh.getContext(tokenId.chain);
    const tokenAddress = arrayify(
      await tokenContext.formatAssetAddress(tokenId.address),
    );
    for (const event of events.data) {
      if (
        event.parsedJson?.recipient === recipient &&
        event.parsedJson?.coin_amount === amount.toString() &&
        event.parsedJson?.coin ===
          `0x${Buffer.from(tokenAddress).toString('hex')}`
      ) {
        return BigNumber.from(event.parsedJson?.sui_amount);
      }
    }
    return null;
  } else {
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
    return match ? match[0]?.args?.[4] : null;
  }
};
