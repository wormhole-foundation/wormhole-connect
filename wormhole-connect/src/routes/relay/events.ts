import { BigNumber } from 'ethers';
import { arrayify } from 'ethers/lib/utils.js';
import {
  ChainName,
  SuiContext,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { fromNormalizedDecimals } from 'utils/utils';
import { ParsedMessage, ParsedRelayerMessage, isEvmChain, wh } from 'utils/sdk';
import { CHAINS } from 'config';

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
