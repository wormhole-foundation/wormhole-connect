import {
  ChainId,
  ChainName,
  coalesceChainId,
  createNonce,
} from '@certusone/wormhole-sdk';
import {
  JsonRpcProvider,
  SUI_CLOCK_OBJECT_ID,
  SUI_TYPE_ARG,
  TransactionBlock,
} from '@mysten/sui.js';

export async function getObjectFields(
  provider: JsonRpcProvider,
  objectId: string,
) {
  const result = await provider.getObject({
    id: objectId,
    options: { showContent: true },
  });

  if (
    typeof result.data!.content !== 'string' &&
    'fields' in result.data!.content!
  ) {
    return result.data!.content.fields;
  } else {
    return null;
  }
}

export async function getWormholeFee(
  provider: JsonRpcProvider,
  coreStateObjectId: string,
) {
  const fields = await getObjectFields(provider, coreStateObjectId);
  if (fields === null) {
    throw new Error('core state object fields not found');
  }
  return fields.fee_collector.fields.fee_amount;
}

export type SuiCoinObject = {
  coinType: string;
  coinObjectId: string;
};

export const getPackageId = async (
  provider: JsonRpcProvider,
  objectId: string,
): Promise<string> => {
  const fields = await getObjectFields(provider, objectId);
  if (fields && 'upgrade_cap' in fields) {
    return fields.upgrade_cap.fields.package;
  }
  throw new Error('upgrade_cap not found');
};

export async function transferFromSui(
  provider: JsonRpcProvider,
  coreBridgeStateObjectId: string,
  tokenBridgeStateObjectId: string,
  coins: SuiCoinObject[],
  coinType: string,
  amount: bigint,
  recipientChain: ChainId | ChainName,
  recipient: Uint8Array,
  feeAmount: bigint = BigInt(0),
  relayerFee: bigint = BigInt(0),
  payload: Uint8Array | null = null,
) {
  if (payload !== null) {
    throw new Error('Sui transfer with payload not implemented');
  }
  const [primaryCoin, ...mergeCoins] = coins.filter(
    (coin) => coin.coinType === coinType,
  );
  if (primaryCoin === undefined) {
    throw new Error(
      `Coins array doesn't contain any coins of type ${coinType}`,
    );
  }
  const coreBridgePackageId = await getPackageId(
    provider,
    coreBridgeStateObjectId,
  );
  const tokenBridgePackageId = await getPackageId(
    provider,
    tokenBridgeStateObjectId,
  );
  const tx = new TransactionBlock();
  const [transferCoin] = (() => {
    if (coinType === SUI_TYPE_ARG) {
      return tx.splitCoins(tx.gas, [tx.pure(amount)]);
    } else {
      const primaryCoinInput = tx.object(primaryCoin.coinObjectId);
      if (mergeCoins.length) {
        tx.mergeCoins(
          primaryCoinInput,
          mergeCoins.map((coin) => tx.object(coin.coinObjectId)),
        );
      }
      return tx.splitCoins(primaryCoinInput, [tx.pure(amount)]);
    }
  })();
  const [feeCoin] = tx.splitCoins(tx.gas, [tx.pure(feeAmount)]);
  const [assetInfo] = tx.moveCall({
    target: `${tokenBridgePackageId}::state::verified_asset`,
    arguments: [tx.object(tokenBridgeStateObjectId)],
    typeArguments: [coinType],
  });
  const [transferTicket, dust] = tx.moveCall({
    target: `${tokenBridgePackageId}::transfer_tokens::prepare_transfer`,
    arguments: [
      assetInfo,
      transferCoin,
      tx.pure(coalesceChainId(recipientChain)),
      tx.pure([...recipient]),
      tx.pure(relayerFee),
      tx.pure(createNonce().readUInt32LE()),
    ],
    typeArguments: [coinType],
  });
  tx.moveCall({
    target: `${tokenBridgePackageId}::coin_utils::return_nonzero`,
    arguments: [dust],
    typeArguments: [coinType],
  });
  const [messageTicket] = tx.moveCall({
    target: `${tokenBridgePackageId}::transfer_tokens::transfer_tokens`,
    arguments: [tx.object(tokenBridgeStateObjectId), transferTicket],
    typeArguments: [coinType],
  });
  tx.moveCall({
    target: `${coreBridgePackageId}::publish_message::publish_message`,
    arguments: [
      tx.object(coreBridgeStateObjectId),
      feeCoin,
      messageTicket,
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });
  return tx;
}
