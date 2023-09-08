/* eslint-disable */
import { Coin } from 'cosmjs-types/cosmos/base/v1beta1/coin';
import { Long, isSet, DeepPartial, Exact } from '../../../helpers';
import * as _m0 from 'protobufjs/minimal';
export const protobufPackage = 'osmosis.tokenfactory.v1beta1';
/** Params defines the parameters for the tokenfactory module. */
export interface Params {
  denomCreationFee: Coin[];
  /**
   * if denom_creation_fee is an empty array, then this field is used to add more gas consumption
   * to the base cost.
   * https://github.com/CosmWasm/token-factory/issues/11
   */
  denomCreationGasConsume: Long;
}
function createBaseParams(): Params {
  return {
    denomCreationFee: [],
    /* @ts-ignore */
    denomCreationGasConsume: undefined,
  };
}
export const Params = {
  encode(
    message: Params,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    for (const v of message.denomCreationFee) {
      Coin.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.denomCreationGasConsume !== undefined) {
      writer.uint32(16).uint64(message.denomCreationGasConsume);
    }
    return writer;
  },
  decode(input: _m0.Reader | Uint8Array, length?: number): Params {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseParams();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.denomCreationFee.push(Coin.decode(reader, reader.uint32()));
          break;
        case 2:
          message.denomCreationGasConsume = reader.uint64() as Long;
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },
  fromJSON(object: any): Params {
    return {
      denomCreationFee: Array.isArray(object?.denomCreationFee)
        ? object.denomCreationFee.map((e: any) => Coin.fromJSON(e))
        : [],
      /* @ts-ignore */
      denomCreationGasConsume: isSet(object.denomCreationGasConsume)
        ? Long.fromValue(object.denomCreationGasConsume)
        : undefined,
    };
  },
  toJSON(message: Params): unknown {
    const obj: any = {};
    if (message.denomCreationFee) {
      obj.denomCreationFee = message.denomCreationFee.map((e) =>
        e ? Coin.toJSON(e) : undefined,
      );
    } else {
      obj.denomCreationFee = [];
    }
    message.denomCreationGasConsume !== undefined &&
      (obj.denomCreationGasConsume = (
        message.denomCreationGasConsume || undefined
      ).toString());
    return obj;
  },
  fromPartial<I extends Exact<DeepPartial<Params>, I>>(object: I): Params {
    const message = createBaseParams();
    message.denomCreationFee =
      /* @ts-ignore */
      object.denomCreationFee?.map((e) => Coin.fromPartial(e)) || [];
    /* @ts-ignore */
    message.denomCreationGasConsume =
      object.denomCreationGasConsume !== undefined &&
      object.denomCreationGasConsume !== null
        ? Long.fromValue(object.denomCreationGasConsume)
        : undefined;
    return message;
  },
};
