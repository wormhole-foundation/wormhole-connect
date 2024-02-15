import { JsonRpcProvider, TransactionBlock } from '@mysten/sui.js';
import { BigNumber, BigNumberish } from 'ethers';
import { getObjectFields } from '@certusone/wormhole-sdk/lib/esm/sui';
import { TokenNotSupportedForRelayError } from '../../errors';

export interface TokenInfo {
  max_native_swap_amount: string;
  swap_enabled: boolean;
  swap_rate: string;
}

/**
 * @category Sui
 */
export class SuiRelayer {
  private fields: Record<string, any> | null = null;

  constructor(
    private provider: JsonRpcProvider,
    private objectId: string,
    private packageId: string,
  ) {}

  async getFields() {
    if (this.fields) {
      return this.fields;
    }
    const fields = await getObjectFields(this.provider, this.objectId);
    if (fields === null) {
      throw new Error('Unable to get relayer object fields');
    }
    this.fields = fields;
    return fields;
  }

  async getTokenInfo(coinType: string): Promise<TokenInfo | null> {
    const fields = await this.getFields();
    const registeredTokensObjectId = fields.registered_tokens.fields.id.id;
    try {
      // if the token isn't registered, then this will throw
      const tokenInfo = await this.provider.getDynamicFieldObject({
        parentId: registeredTokensObjectId,
        name: {
          type: `${this.packageId}::registered_tokens::Key<${coinType}>`,
          value: { dummy_field: false },
        },
      });
      if (tokenInfo.error) {
        console.error(tokenInfo.error);
        return null;
      }
      if (
        tokenInfo.data &&
        tokenInfo.data.content &&
        'fields' in tokenInfo.data.content
      ) {
        return tokenInfo.data.content.fields.value?.fields || null;
      }
      return null;
    } catch (e: any) {
      if (e?.code === -32000 && e.message?.includes('RPC Error')) {
        console.error(e);
        return null;
      }
      throw e;
    }
  }

  async isAcceptedToken(token: string): Promise<boolean> {
    try {
      const tokenInfo = await this.getTokenInfo(token);
      return tokenInfo !== null;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async calculateRelayerFee(
    targetChainId: BigNumberish,
    coinType: string,
    decimals: BigNumberish,
  ): Promise<BigNumber> {
    const tokenInfo = await this.getTokenInfo(coinType);
    if (tokenInfo === null) {
      throw new TokenNotSupportedForRelayError();
    }
    const relayerFees = await this.provider.getDynamicFieldObject({
      parentId: this.objectId,
      name: {
        type: 'vector<u8>',
        value: [...Buffer.from('relayer_fees')],
      },
    });
    if (
      relayerFees.data &&
      relayerFees.data.content &&
      'fields' in relayerFees.data.content
    ) {
      const entry = await this.provider.getDynamicFieldObject({
        parentId: relayerFees.data.content.fields!.id!.id,
        name: {
          type: 'u16',
          value: Number(targetChainId),
        },
      });
      if (entry.data && entry.data.content && 'fields' in entry.data.content) {
        const fields = await this.getFields();
        const relayerFeePrecision = BigNumber.from(
          fields.relayer_fee_precision,
        );
        const swapRatePrecision = BigNumber.from(fields.swap_rate_precision);
        const swapRate = BigNumber.from(tokenInfo.swap_rate);
        const fee = BigNumber.from(entry.data.content.fields.value);
        return BigNumber.from(10)
          .pow(decimals)
          .mul(fee)
          .mul(swapRatePrecision)
          .div(swapRate.mul(relayerFeePrecision));
      }
    }
    throw new Error('Unable to compute relayer fee');
  }

  async calculateMaxSwapAmountIn(
    senderAddress: string,
    coinType: string,
  ): Promise<BigNumber> {
    const metadata = await this.provider.getCoinMetadata({ coinType });
    if (!metadata) {
      throw new Error('metadata is null');
    }
    const tx = new TransactionBlock();
    tx.moveCall({
      // Calculates the max number of tokens the recipient can convert to native
      // Sui. The max amount of native assets the contract will swap with the
      // recipient is governed by the `max_native_swap_amount` variable.
      target: `${this.packageId}::redeem::calculate_max_swap_amount_in`,
      arguments: [tx.object(this.objectId), tx.pure(metadata.decimals)],
      typeArguments: [coinType],
    });
    const result = await this.provider.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: senderAddress,
    });
    const returnValues = result.results?.[0]?.returnValues;
    if (returnValues?.length != 1) {
      throw Error('swap rate not set');
    }
    const maxSwapAmountIn = Buffer.from(returnValues[0][0]).readBigUInt64LE();
    return BigNumber.from(maxSwapAmountIn);
  }

  async calculateNativeSwapAmountOut(
    senderAddress: string,
    coinType: string,
    toNativeAmount: BigNumberish,
  ): Promise<BigNumber> {
    const metadata = await this.provider.getCoinMetadata({ coinType });
    if (!metadata) {
      throw new Error('metadata is null');
    }
    const tx = new TransactionBlock();
    tx.moveCall({
      // Calculates the amount of native Sui that the recipient will receive
      // for swapping the `to_native_amount` of tokens.
      target: `${this.packageId}::redeem::calculate_native_swap_amount_out`,
      arguments: [
        tx.object(this.objectId),
        tx.pure(toNativeAmount),
        tx.pure(metadata.decimals),
      ],
      typeArguments: [coinType],
    });
    const result = await this.provider.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: senderAddress,
    });
    const returnValues = result.results?.[0]?.returnValues;
    if (returnValues?.length != 1) {
      throw Error('Unable to calculate nativeSwapAmountOut');
    }
    const nativeSwapAmountOut = Buffer.from(
      returnValues[0][0],
    ).readBigUInt64LE();
    return BigNumber.from(nativeSwapAmountOut);
  }
}
