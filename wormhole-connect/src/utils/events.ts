import { BigNumber } from 'ethers';
import { arrayify } from 'ethers/lib/utils.js';
import {
  ChainName,
  EthContext,
  SuiContext,
  SeiContext,
  SolanaContext,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { ParsedRelayerMessage, wh } from './sdk';
import { fromNormalizedDecimals } from '.';
import { CHAINS } from 'config';
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
  } else if (txData.toChain === 'sui') {
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

export const fetchRedeemedEventSender = async (
  txData: SignedMessage,
): Promise<string | null> => {
  const redeemedEvent = await fetchRedeemedEvent(txData);
  if (!redeemedEvent) {
    return null;
  }
  if (txData.toChain === 'solana') {
    const context = wh.getContext(
      txData.toChain,
    ) as SolanaContext<WormholeContext>;
    const tx = await context.connection?.getParsedTransaction(
      redeemedEvent.transactionHash,
      {
        maxSupportedTransactionVersion: 0,
      },
    );
    const accounts = tx?.transaction.message.accountKeys;
    return accounts ? accounts[0].pubkey.toBase58() : null;
  } else if (txData.toChain === 'sui') {
    const context = wh.getContext(
      txData.toChain,
    ) as SuiContext<WormholeContext>;
    const tx = await context.provider.getTransactionBlock({
      digest: redeemedEvent.transactionHash,
    });
    return tx.transaction?.data.sender || null;
  } else if (isEvmChain(wh.toChainId(txData.toChain))) {
    const context = wh.getContext(
      txData.toChain,
    ) as EthContext<WormholeContext>;
    const tx = await context.getReceipt(
      redeemedEvent.transactionHash,
      txData.toChain,
    );
    return tx.from;
  }

  return null;
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
  } else if (txData.toChain === 'sui') {
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
        event.parsedJson?.coin_amount === toNativeTokenAmount &&
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
