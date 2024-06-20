import { BigNumber } from 'ethers';
import { arrayify } from 'ethers/lib/utils.js';
import {
  ChainName,
  SuiContext,
  SolanaContext,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { ParsedRelayerMessage } from './sdk';
import { fromNormalizedDecimals } from '.';
import config from 'config';
import { fetchGlobalTx, getEmitterAndSequence } from './vaa';
import { isEvmChain } from 'utils/sdk';
import RouteOperator from '../routes/operator';
import { Route } from 'config/types';
import { SignedMessage } from '../routes';

export const fetchRedeemTx = async (
  route: Route,
  txData: SignedMessage,
): Promise<{ transactionHash: string } | null> => {
  let transactionHash: string | undefined;
  if (txData.emitterAddress && txData.sequence) {
    try {
      transactionHash = await fetchGlobalTx(txData);
    } catch (e) {
      console.error(e);
    }
  }

  transactionHash = await RouteOperator.tryFetchRedeemTx(route, txData);
  if (transactionHash) {
    return { transactionHash };
  }
  return null;
};

export const fetchSwapEvent = async (txData: ParsedRelayerMessage) => {
  const { tokenId, recipient, toNativeTokenAmount, tokenDecimals } = txData;
  if (txData.toChain === 'solana') {
    const context = config.wh.getContext(
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
  } else if (txData.toChain === 'sui') {
    const context = config.wh.getContext(
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
    const tokenContext = config.wh.getContext(tokenId.chain);
    const tokenAddress = arrayify(
      await tokenContext.formatAssetAddress(tokenId.address),
    );
    for (const event of events.data) {
      if (
        event.parsedJson?.recipient === recipient &&
        event.parsedJson?.coin_amount === toNativeTokenAmount &&
        event.parsedJson?.coin ===
          `0x${Buffer.from(tokenAddress).toString('hex')}`
      ) {
        return BigNumber.from(event.parsedJson?.sui_amount);
      }
    }
    return null;
  } else if (isEvmChain(config.wh.toChainId(txData.toChain))) {
    const provider = config.wh.mustGetProvider(txData.toChain);
    const context: any = config.wh.getContext(txData.toChain);
    const chainName = config.wh.toChainName(txData.toChain) as ChainName;
    const chainConfig = config.chains[chainName]!;
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
