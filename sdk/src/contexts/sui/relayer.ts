import { JsonRpcProvider, TransactionBlock } from '@mysten/sui.js';
import { BigNumber, ethers } from 'ethers';
import { getObjectFields } from '@certusone/wormhole-sdk/lib/cjs/sui';

export interface TokenInfo {
  max_native_swap_amount: string;
  swap_enabled: boolean;
  swap_rate: string;
}

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
        console.log(tokenInfo.data.content.fields.value?.fields);
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
      console.log(`isAcceptedToken - token: ${token}`);
      const tokenInfo = await this.getTokenInfo(token);
      console.log(tokenInfo);
      return tokenInfo !== null;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  calculateRelayerFee(
    targetChainId: ethers.BigNumberish,
    coinType: string,
    decimals: ethers.BigNumberish,
  ): Promise<ethers.BigNumber> {
    try {
      // TODO: implement
      throw new Error('unable to get relayer fee');
    } catch (e) {
      console.error(`calculateRelayerFee - error ${e}`);
      throw e;
    }
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
      throw Error('Unable to calculate maxSwapAmountIn');
    }
    const maxSwapAmountIn = Buffer.from(returnValues[0][0]).readBigUInt64LE();
    console.log(
      `calculateMaxSwapAmountIn - maxSwapAmountIn: ${maxSwapAmountIn}`,
    );
    return BigNumber.from(maxSwapAmountIn);
  }

  async calculateNativeSwapAmountOut(
    senderAddress: string,
    coinType: string,
    toNativeAmount: ethers.BigNumberish,
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

    const nativeSwapAmountOut = Buffer.from(returnValues[0][0]).readBigUInt64LE(
      0,
    );
    console.log(
      `calculateNativeSwapAmountOut - nativeSwapAmountOut: ${nativeSwapAmountOut}`,
    );
    return BigNumber.from(nativeSwapAmountOut);
  }
}
