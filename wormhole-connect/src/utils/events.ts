import { BigNumber } from 'ethers';
import { arrayify } from 'ethers/lib/utils.js';
import {
  ChainName,
  EthContext,
  SuiContext,
  SeiContext,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { ParsedMessage, ParsedRelayerMessage, wh } from './sdk';
import { fromNormalizedDecimals } from '.';
import { CHAINS } from 'config';
import { fetchGlobalTx, getEmitterAndSequence } from './vaa';
import { isEvmChain } from 'utils/sdk';
import RouteOperator from './routes/operator';
import { Route } from 'config/types';

export const fetchRedeemTx = async (
  route: Route,
  txData: ParsedMessage | ParsedRelayerMessage,
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
  txData: ParsedMessage | ParsedRelayerMessage,
): Promise<{ transactionHash: string } | null> => {
  const messageId = getEmitterAndSequence(txData);
  const { emitterChain, emitterAddress, sequence } = messageId;
  const emitter = `0x${emitterAddress}`;

  if (txData.toChain === 'sui') {
    const context = wh.getContext(
      txData.toChain,
    ) as SuiContext<WormholeContext>;
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
      order: 'descending',
    });
    for (const event of events.data) {
      if (
        `0x${Buffer.from(event.parsedJson?.emitter_address.value.data).toString(
          'hex',
        )}` === emitter &&
        Number(event.parsedJson?.emitter_chain) === emitterChain &&
        event.parsedJson?.sequence === sequence
      ) {
        return { transactionHash: event.id.txDigest };
      }
    }
    return null;
  } else if (txData.toChain === 'sei') {
    const context = wh.getContext(
      txData.toChain,
    ) as SeiContext<WormholeContext>;
    const transactionHash = await context.fetchRedeemedEvent(
      emitterChain,
      emitter,
      sequence,
    );
    return transactionHash ? { transactionHash } : null;
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

export const fetchSwapEvent = async (
  txData: ParsedMessage | ParsedRelayerMessage,
) => {
  const { tokenId, recipient, amount, tokenDecimals } = txData;
  if (txData.toChain === 'sui') {
    const context = wh.getContext(
      txData.toChain,
    ) as SuiContext<WormholeContext>;
    const { suiRelayerPackageId } = context.context.mustGetContracts('sui');
    if (!suiRelayerPackageId) throw new Error('suiRelayerPackageId not set');
    const provider = context.provider;
    // full nodes don't let us query by `MoveEventField`
    const events = await provider.queryEvents({
      query: {
        MoveEventType: `${suiRelayerPackageId}::redeem::SwapExecuted`,
      },
      order: 'descending',
    });
    const tokenContext = wh.getContext(tokenId.chain);
    const tokenAddress = arrayify(
      await tokenContext.formatAssetAddress(tokenId.address),
    );
    for (const event of events.data) {
      if (
        event.parsedJson?.recipient === recipient &&
        event.parsedJson?.coin_amount === amount &&
        event.parsedJson?.coin ===
          `0x${Buffer.from(tokenAddress).toString('hex')}`
      ) {
        return BigNumber.from(event.parsedJson?.sui_amount);
      }
    }
    return null;
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
    const match = events.filter((e: any) => {
      const normalized = fromNormalizedDecimals(
        BigNumber.from(amount),
        tokenDecimals,
      );
      return normalized.eq(e.args[3]);
    });
    return match ? match[0]?.args?.[4] : null;
  }
  return null;
};
