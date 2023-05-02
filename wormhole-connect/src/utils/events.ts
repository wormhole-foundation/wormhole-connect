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

// TODO: sui support

export const fetchRedeemedEvent = async (
  destChainId: ChainId | ChainName,
  emitterChainId: ChainId,
  emitterAddress: string,
  sequence: string,
) => {
  // TODO: put in context
  if (destChainId === 'sui') {
    console.log('querying events');
    const context = wh.getContext(destChainId) as SuiContext<WormholeContext>;
    const { suiOriginalTokenBridgePackageId } =
      context.context.mustGetContracts('sui');
    if (!suiOriginalTokenBridgePackageId)
      throw new Error('suiOriginalTokenBridgePackageId not set');
    const provider = context.provider;
    // full nodes don't let us filter by `MoveEventField`, so we have to search for our event
    const events = await provider.queryEvents({
      query: {
        MoveEventType: `${suiOriginalTokenBridgePackageId}::complete_transfer::TransferRedeemed`,
      },
    });
    console.log(emitterAddress);
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
  console.log(destChainId, recipient, tokenId, amount, decimals);
  // TODO: put in context
  if (destChainId === 'sui') {
    //const context = wh.getContext(destChainId) as SuiContext<WormholeContext>;
    //const provider = context.provider;
    //const maxAttempts = 3;
    //let attempts = 0;
    //let nextCursor: any = null;
    //do {
    //  // full nodes don't let us query by `MoveEventField`, so we have to search for our event
    //  const events = await provider.queryEvents({
    //    query: {
    //      MoveEventType:
    //        // TODO: put original package ID in consts file
    //        '0x683696ce7d22989c880452c93fc608e4decd1dcbe1e9e1960a142be0544c3ff1::complete_transfer::TransferRedeemed',
    //    },
    //    cursor: nextCursor,
    //  });
    //  for (const event of events.data) {
    //    `
    //    "parsedJson": {
    //      "coin": "0x000000000000000000000000f1277d1ed8ad466beddf92ef448a132661956621",
    //      "coin_amount": "50000000",
    //      "recipient": "0xdc5e03aa07e2a8576ead32c2e060bb79529d55ad8a63338444cbe834ee240440",
    //      "relayer": "0x0c15ca93dbe1f92189ce4ce5caa5e718bdcc0e4080dd43bc255d7f30ebed64f0",
    //      "sui_amount": "250000000"
    //    },
    //    `;
    //    if (true) {
    //      return { transactionHash: event.id.txDigest };
    //    }
    //  }
    //  nextCursor = events.hasNextPage ? events.nextCursor : null;
    //  attempts += 1;
    //} while (nextCursor != null && attempts < maxAttempts);
    //return null;
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
    return match ? match[0] : null;
  }
};
