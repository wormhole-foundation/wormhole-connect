import {
  JsonRpcProvider,
  SuiObjectResponse,
  TransactionBlock,
} from '@mysten/sui.js';
import { TokenBridgeRelayerInterface } from '../abstracts/contracts';
import { ethers } from 'ethers';

export class SuiRelayer implements TokenBridgeRelayerInterface {
  constructor(private provider: JsonRpcProvider, private address: string) {}

  async isAcceptedToken(token: string): Promise<boolean> {
    try {
      console.log(`isAcceptedToken - token: ${token}`);

      // Verify the relayer state.
      const state = await getObjectFields(this.provider, this.address);
      // expect(state!.registered_tokens.fields.num_tokens).equals('3');

      // Fetch the SUI `TokenInfo`.
      const tokenInfo = await getTokenInfo(this.provider, state, token);

      console.log(JSON.stringify(tokenInfo));
      return true;
    } catch (e) {
      console.error(`isAcceptedToken - error: ${e}`);
      return false;
    }

    //expect(tokenInfo.max_native_swap_amount).equals(suiMaxSwapAmount);
    //expect(tokenInfo.swap_enabled).is.false;
    //expect(tokenInfo.swap_rate).equals(suiSwapRate);
  }

  calculateRelayerFee(
    targetChainId: ethers.BigNumberish,
    token: string,
    decimals: ethers.BigNumberish,
  ): Promise<ethers.BigNumber> {
    try {
      // Cache precision variables.
      //   const relayerFeePrecision = 100000000;//parseInt(relayerState.relayer_fee_precision);
      //   const swapRatePrecision = 100000000; //parseInt(relayerState.swap_rate_precision);

      // Fetch the token info and save the swap rate.
      //const swapRate = await getTokenInfo(
      //  provider,
      //  relayerState,
      //  coinType,
      //).then((result) => result.swap_rate);

      //// Fetch usd denominated relayer fee.
      //const relayerFee = await getTableByName(
      //  provider,
      //  relayerState.id.id,
      //  'relayer_fees',
      //).then(
      //  (result) => result.filter((result) => result[0] == targetChain)[0][1],
      //);

      //return (
      //  (10 ** tokenDecimals * relayerFee * swapRatePrecision) /
      //  (swapRate * relayerFeePrecision)
      //);
      //console.log(`calculateRelayerFee`);
      //@ts-ignore
      //   return ethers.BigNumber.from(10);
      throw new Error('unable to get relayer fee');
    } catch (e) {
      console.error(`calculateRelayerFee - error ${e}`);
      throw e;
    }
  }

  async calculateMaxSwapAmountIn(
    senderAddress: string,
    // relayerState: any,
    // toNativeTokenAmount: string,
    // decimals: number,
    coinType: string,
  ): Promise<number> {
    const metadata = await this.provider.getCoinMetadata({ coinType });
    if (!metadata) throw new Error('metadata is null');

    // Fetch the swap quote by calling the contract.
    const tx = new TransactionBlock();
    // TODO: move to config
    const relayerPackageId =
      '0x683696ce7d22989c880452c93fc608e4decd1dcbe1e9e1960a142be0544c3ff1';

    tx.moveCall({
      target: `${relayerPackageId}::redeem::calculate_max_swap_amount_in`,
      arguments: [tx.object(this.address), tx.pure(metadata.decimals)],
      typeArguments: [coinType],
    });

    // Fetch the swap quote response.
    const response = await this.provider.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: senderAddress,
    });

    const result = response.results![0].returnValues!;

    if (result.length != 1) {
      throw Error('Invalid swap quote response');
    }

    // Store the swapQuote.
    const maxSwapAmountIn = Number(
      Buffer.from(result[0][0]).readBigUInt64LE(0),
    );

    console.log(
      `calculateMaxSwapAmountIn - maxSwapAmountIn: ${maxSwapAmountIn}`,
    );
    // return Math.min(maxSwapAmountIn, parseInt(toNativeTokenAmount));
    return maxSwapAmountIn;
  }
}

/*
export async function getWormholeFee(provider: JsonRpcProvider) {
  // Fetch the wormhole state fields.
  const fields = await getObjectFields(provider, WORMHOLE_STATE_ID);

  if (fields === null) {
    Promise.reject('State object not found.');
  }

  // Cache wormhole fee.
  return fields!.fee_collector.fields.fee_amount;
}
*/

interface TransferWithRelay {
  payloadType: number;
  targetRelayerFee: number;
  toNativeTokenAmount: number;
  recipient: string;
}

export function parseTransferWithRelay(payload: Buffer): TransferWithRelay {
  let relay: TransferWithRelay = {} as TransferWithRelay;

  // Parse the additional payload.
  relay.payloadType = payload.readUint8(133);
  relay.targetRelayerFee = Number(
    '0x' + payload.subarray(134, 166).toString('hex'),
  );
  relay.toNativeTokenAmount = Number(
    '0x' + payload.subarray(166, 198).toString('hex'),
  );
  relay.recipient = '0x' + payload.subarray(198, 231).toString('hex');
  return relay;
}

export function createTransferWithRelayPayload(
  targetRelayerFee: number,
  toNativeTokenAmount: number,
  recipient: string,
): string {
  const payloadType = '0x01';
  const encodedRelayerFee = ethers.utils
    .hexZeroPad(ethers.utils.hexlify(targetRelayerFee), 32)
    .substring(2);
  const encodedToNative = ethers.utils
    .hexZeroPad(ethers.utils.hexlify(toNativeTokenAmount), 32)
    .substring(2);

  if (recipient.substring(0, 2) != '0x' || recipient.length != 66) {
    throw Error('Invalid recipient parameter');
  }

  return (
    payloadType + encodedRelayerFee + encodedToNative + recipient.substring(2)
  );
}

export function getWormholeEvents(result: any) {
  if ('events' in result) {
    let wormholeEvents = [];
    for (const event of result.events!) {
      if (event.type.includes('WormholeMessage')) {
        wormholeEvents.push(event);
      }
    }
    return wormholeEvents;
  } else {
    return null;
  }
}

export function getSwapEvent(result: any) {
  if ('events' in result) {
    let swapEvent;
    for (const event of result.events!) {
      if (event.type.includes('SwapExecuted')) {
        swapEvent = event;
        break;
      }
    }
    return swapEvent;
  } else {
    return null;
  }
}

export async function getObjectFields(
  provider: JsonRpcProvider,
  objectId: string,
) {
  // Fetch object.
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

export async function getDynamicFieldsByType(
  provider: JsonRpcProvider,
  parentId: string,
  type: string,
) {
  // Fetch dynamic fields.
  const dynamicFields = await provider
    .getDynamicFields({ parentId: parentId })
    .then((result) => result.data);

  // Fetch the target field by type.
  const targetObject = dynamicFields.filter(
    (id) =>
      id.objectType.includes(type) || id.objectType.includes(type.substring(3)),
  );

  return targetObject;
}

export async function getDynamicObjectFields(
  provider: JsonRpcProvider,
  parentId: string,
  childName: any,
) {
  const dynamicObjectFieldInfo = await provider
    .getDynamicFieldObject({
      parentId: parentId,
      name: childName,
    })
    .then((result) => {
      if (
        typeof result.data!.content !== 'string' &&
        'content' in result.data! &&
        'fields' in result.data!.content!
      ) {
        return result.data?.content;
      } else {
        return null;
      }
    });

  if (dynamicObjectFieldInfo === null) {
    return Promise.reject('invalid dynamic object field');
  }

  return dynamicObjectFieldInfo;
}

export async function getTableFromDynamicObjectField(
  provider: JsonRpcProvider,
  parentId: string,
  childName: any,
) {
  const dynamicObjectInfo = await getDynamicObjectFields(
    provider,
    parentId,
    childName,
  );

  // Fetch the table's keys
  const keys = await provider
    .getDynamicFields({ parentId: dynamicObjectInfo!.fields.id.id })
    .then((result) => result.data);

  if (keys.length == 0) {
    return Promise.reject('dynamic field not found');
  }

  // Create array of key value pairs
  const tableTuples = await Promise.all(
    keys.map(async (key) => {
      // Fetch the value
      const valueObject = await getObjectFields(provider, key.objectId);
      return [key.name.value, valueObject!.value];
    }),
  );

  return tableTuples;
}

export async function getCoinWithHighestBalance(
  provider: JsonRpcProvider,
  walletAddress: string,
  coinType: string,
) {
  const coins = await provider
    .getCoins({
      owner: walletAddress,
      coinType: coinType,
    })
    .then((result) => result.data);

  if (coins.length == 0) {
    return Promise.reject('no coins with balance found');
  }

  let balanceMax = 0;
  let index = 0;

  // Find the coin with the highest balance.
  for (let i = 0; i < coins.length; i++) {
    let balance = parseInt(coins[i].balance);
    if (balance > balanceMax) {
      balanceMax = balance;
      index = i;
    }
  }

  return coins[index];
}

export async function getTableByName(
  provider: JsonRpcProvider,
  stateId: string,
  fieldName: string,
) {
  // Fetch relayer state dynamic fields.
  const dynamicField = await provider
    .getDynamicFields({ parentId: stateId })
    .then((result) =>
      result.data.filter((name) =>
        Buffer.from(name.name.value).toString().includes(fieldName),
      ),
    );

  if (dynamicField.length === null) {
    return Promise.reject('table not found');
  }

  // Fetch the `relayer_fee` dynamic field.
  const relayerFees = await getTableFromDynamicObjectField(
    provider,
    stateId,
    dynamicField[0].name!,
  );

  return relayerFees;
}

export async function getTokenInfo(
  provider: JsonRpcProvider,
  state: any,
  coinType: string,
) {
  const targetDynamicField = await getDynamicFieldsByType(
    provider,
    state!.registered_tokens.fields.id.id,
    coinType,
  );

  if (targetDynamicField.length != 1) {
    return Promise.reject('Token info not found');
  }

  // Fetch the `TokenInfo` dynamic field.
  const tokenInfo = await getObjectFields(
    provider,
    targetDynamicField[0].objectId, // Coin 10 ID.
  ).then((result) => result!.value.fields);

  return tokenInfo;
}

export function tokenBridgeNormalizeAmount(
  amount: number,
  decimals: number,
): number {
  if (decimals > 8) {
    amount = amount / 10 ** (decimals - 8);
  }
  return Math.floor(amount);
}

export function tokenBridgeDenormalizeAmount(
  amount: number,
  decimals: number,
): number {
  if (decimals > 8) {
    amount = amount * 10 ** (decimals - 8);
  }
  return Math.floor(amount);
}

export function tokenBridgeTransform(amount: number, decimals: number): number {
  return tokenBridgeDenormalizeAmount(
    tokenBridgeNormalizeAmount(amount, decimals),
    decimals,
  );
}

export async function getTokenRelayerFee(
  provider: JsonRpcProvider,
  relayerState: any,
  targetChain: number,
  tokenDecimals: number,
  coinType: string,
) {
  // Cache precision variables.
  const relayerFeePrecision = parseInt(relayerState.relayer_fee_precision);
  const swapRatePrecision = parseInt(relayerState.swap_rate_precision);

  // Fetch the token info and save the swap rate.
  const swapRate = await getTokenInfo(provider, relayerState, coinType).then(
    (result) => result.swap_rate,
  );

  // Fetch usd denominated relayer fee.
  const relayerFee = await getTableByName(
    provider,
    relayerState.id.id,
    'relayer_fees',
  ).then((result) => result.filter((result) => result[0] == targetChain)[0][1]);

  return (
    (10 ** tokenDecimals * relayerFee * swapRatePrecision) /
    (swapRate * relayerFeePrecision)
  );
}

/*
export async function getSwapQuote(
  provider: JsonRpcProvider,
  wallet: string,
  relayerState: any,
  toNativeTokenAmount: string,
  decimals: number,
  coinType: string,
): Promise<number> {
  // Fetch the swap quote by calling the contract.
  const tx = new TransactionBlock();

  tx.moveCall({
    target: `${RELAYER_ID}::redeem::calculate_native_swap_amount_out`,
    arguments: [
      tx.object(relayerState!.id.id),
      tx.pure(toNativeTokenAmount),
      tx.pure(decimals),
    ],
    typeArguments: [coinType],
  });

  // Fetch the swap quote response.
  const swapQuoteResponse = await provider.devInspectTransactionBlock({
    transactionBlock: tx,
    sender: wallet,
  });

  const result = swapQuoteResponse.results![0].returnValues!;

  if (result.length != 1) {
    throw Error('Invalid swap quote response');
  }

  // Store the swapQuote.
  const swapQuote = Number(Buffer.from(result[0][0]).readBigUInt64LE(0));

  // Fetch the maxNativeSwapAmount.
  const maxNativeSwapAmount = await getTokenInfo(
    provider,
    relayerState,
    coinType,
  ).then((result) => result.max_native_swap_amount);

  return Math.min(swapQuote, parseInt(maxNativeSwapAmount));
}
*/

/*
export async function getSwapAmountIn(
  provider: JsonRpcProvider,
  wallet: string,
  relayerState: any,
  toNativeTokenAmount: string,
  decimals: number,
  coinType: string,
): Promise<number> {
  // Fetch the swap quote by calling the contract.
  const tx = new TransactionBlock();

  tx.moveCall({
    target: `${RELAYER_ID}::redeem::calculate_max_swap_amount_in`,
    arguments: [tx.object(relayerState.id.id), tx.pure(decimals)],
    typeArguments: [coinType],
  });

  // Fetch the swap quote response.
  const response = await provider.devInspectTransactionBlock({
    transactionBlock: tx,
    sender: wallet,
  });

  const result = response.results![0].returnValues!;

  if (result.length != 1) {
    throw Error('Invalid swap quote response');
  }

  // Store the swapQuote.
  const maxSwapAmountIn = Number(Buffer.from(result[0][0]).readBigUInt64LE(0));

  return Math.min(maxSwapAmountIn, parseInt(toNativeTokenAmount));
}
*/

export function getBalanceChangeFromTransaction(
  wallet: string,
  coinType: string,
  balanceChanges: any,
): number {
  const result = balanceChanges.filter(
    (result: any) =>
      result.owner.AddressOwner == wallet &&
      (result.coinType == coinType ||
        result.coinType.includes(coinType.substring(3))),
  );

  if (result.length != 1) {
    throw Error('could not find balance');
  }

  return Math.abs(parseInt(result[0].amount));
}

/*
/////////////// DELETE THESE ONCE THE SDK IS DONE ///////////////////////
export const getTableKeyType = (tableType: string): string | null => {
  if (!tableType) return null;
  const match = tableType.match(/0x2::table::Table<(.*)>/);
  if (!match) return null;
  const [keyType] = match[1].split(',');
  if (!isValidSuiType(keyType)) return null;
  return keyType;
};
/*/

/**
 * This method validates any Sui address, even if it's not 32 bytes long, i.e.
 * "0x2". This differs from Mysten's implementation, which requires that the
 * given address is 32 bytes long.
 * @param address Address to check
 * @returns If given address is a valid Sui address or not
 */
// export const isValidSuiAddress = (address: string): boolean =>
//   isValidFullSuiAddress(normalizeSuiAddress(address));

//export const isValidSuiType = (type: string): boolean => {
//  const tokens = type.split('::');
//  if (tokens.length !== 3) {
//    return false;
//  }
//
//  return isValidSuiAddress(tokens[0]) && !!tokens[1] && !!tokens[2];
//};

/*
export async function getIsTransferCompletedSui(
  provider: JsonRpcProvider,
  tokenBridgeStateObjectId: string,
  transferVAA: Uint8Array,
): Promise<boolean> {
  const tokenBridgeStateFields = await getObjectFields(
    provider,
    tokenBridgeStateObjectId,
  );
  if (!tokenBridgeStateFields) {
    throw new Error('Unable to fetch object fields from token bridge state');
  }
  const hashes = tokenBridgeStateFields.consumed_vaas?.fields?.hashes;
  const tableObjectId = hashes?.fields?.items?.fields?.id?.id;
  if (!tableObjectId) {
    throw new Error('Unable to fetch consumed VAAs table');
  }
  const keyType = getTableKeyType(hashes?.fields?.items?.type);
  if (!keyType) {
    throw new Error('Unable to get key type');
  }
  const hash = getSignedVAAHash(transferVAA);
  try {
    // This call throws if the VAA doesn't exist in ConsumedVAAs
    await provider.getDynamicFieldObject({
      parentId: tableObjectId,
      name: {
        type: keyType,
        value: {
          data: [...Buffer.from(hash.slice(2), 'hex')],
        },
      },
    });
    return true;
  } catch (e: any) {
    if (e.code === -32000 && e.message?.includes('RPC Error')) {
      return false;
    }
    throw e;
  }
}
*/

export const getFieldsFromObjectResponse = (object: SuiObjectResponse) => {
  const content = object.data?.content;
  return content && content.dataType === 'moveObject' ? content.fields : null;
};

/*
export const getTokenCoinType = async (
  provider: JsonRpcProvider,
  tokenBridgeStateObjectId: string,
  tokenAddress: Uint8Array,
  tokenChain: number,
): Promise<string | null> => {
  const tokenBridgeStateFields = await getObjectFields(
    provider,
    tokenBridgeStateObjectId,
  );
  if (!tokenBridgeStateFields) {
    throw new Error('Unable to fetch object fields from token bridge state');
  }
  const coinTypes = tokenBridgeStateFields?.token_registry?.fields?.coin_types;
  const coinTypesObjectId = coinTypes?.fields?.id?.id;
  if (!coinTypesObjectId) {
    throw new Error('Unable to fetch coin types');
  }
  const keyType = getTableKeyType(coinTypes?.type);
  if (!keyType) {
    throw new Error('Unable to get key type');
  }
  try {
    // This call throws if the key doesn't exist in CoinTypes
    const coinTypeValue = await provider.getDynamicFieldObject({
      parentId: coinTypesObjectId,
      name: {
        type: keyType,
        value: {
          addr: [...tokenAddress],
          chain: tokenChain,
        },
      },
    });
    const fields = getFieldsFromObjectResponse(coinTypeValue);
    return fields?.value ? ensureHexPrefix(fields.value) : null;
  } catch (e: any) {
    if (e.code === -32000 && e.message?.includes('RPC Error')) {
      return null;
    }
    throw e;
  }
};
*/
