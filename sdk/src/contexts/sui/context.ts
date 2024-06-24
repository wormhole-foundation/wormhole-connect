import {
  Connection,
  JsonRpcProvider,
  PaginatedCoins,
  SUI_CLOCK_OBJECT_ID,
  SUI_TYPE_ARG,
  TransactionBlock,
  getTotalGasUsed,
  getTransactionSender,
  isValidSuiAddress,
} from '@mysten/sui.js';
import { BigNumber, BigNumberish } from 'ethers';

import {
  ensureHexPrefix,
  getForeignAssetSui,
  getIsTransferCompletedSui,
  getOriginalAssetSui,
} from '@certusone/wormhole-sdk';
import {
  getFieldsFromObjectResponse,
  getObjectFields,
  getPackageId,
  getTableKeyType,
  getTokenCoinType,
  trimSuiType,
  uint8ArrayToBCS,
} from '@certusone/wormhole-sdk/lib/esm/sui';
import { arrayify, hexlify } from 'ethers/lib/utils';
import {
  ChainId,
  ChainName,
  Context,
  NATIVE,
  ParsedMessage,
  ParsedRelayerMessage,
  TokenId,
} from '../../types';
import { parseTokenTransferPayload } from '../../vaa';
import { WormholeContext } from '../../wormhole';
import { RelayerAbstract } from '../abstracts/relayer';
import { SuiContracts } from './contracts';
import { SuiRelayer } from './relayer';
import { ForeignAssetCache } from '../../utils';

export class SuiContext<
  T extends WormholeContext,
> extends RelayerAbstract<TransactionBlock> {
  readonly type = Context.SUI;
  protected contracts: SuiContracts<T>;
  readonly context: T;
  readonly provider: JsonRpcProvider;
  private foreignAssetCache: ForeignAssetCache;

  constructor(context: T, foreignAssetCache: ForeignAssetCache) {
    super();
    this.context = context;
    const connection = context.conf.rpcs.sui;
    if (connection === undefined) throw new Error('no connection');
    this.provider = new JsonRpcProvider(
      new Connection({ fullnode: connection }),
    );
    this.contracts = new SuiContracts(context, this.provider);
    this.foreignAssetCache = foreignAssetCache;
  }

  async getCoins(coinType: string, owner: string) {
    let coins: { coinType: string; coinObjectId: string }[] = [];
    let cursor: string | null = null;
    do {
      const result: PaginatedCoins = await this.provider.getCoins({
        owner,
        coinType,
        cursor,
      });
      coins = [...coins, ...result.data];
      cursor = result.hasNextPage ? result.nextCursor : null;
    } while (cursor);
    return coins;
  }

  formatAddress(address: string): Uint8Array {
    if (!isValidSuiAddress(address)) {
      throw new Error(`can't format an invalid sui address: ${address}`);
    }
    // valid sui addresses are already 32 bytes, hex prefixed
    return arrayify(address);
  }

  parseAddress(address: string): string {
    if (!isValidSuiAddress(address)) {
      throw new Error(`can't parse an invalid sui address: ${address}`);
    }
    // valid sui addresses are already 32 bytes, hex prefixed
    return address;
  }

  /**
   * @param address The asset's address (the Sui `CoinType`)
   * @returns The external address associated with the asset address
   */
  async formatAssetAddress(address: string): Promise<Uint8Array> {
    try {
      const { token_bridge } = this.contracts.mustGetContracts('sui');
      if (!token_bridge) throw new Error('token bridge contract not found');
      // this will throw if the asset hasn't been attested
      const { assetAddress } = await getOriginalAssetSui(
        this.provider,
        token_bridge,
        address,
      );
      return assetAddress;
    } catch (e) {
      throw e;
    }
  }

  /**
   * @param address The asset's external address
   * @returns The asset's address (the Sui `CoinType`) associated with the external address
   */
  async parseAssetAddress(address: string): Promise<string> {
    try {
      const { token_bridge } = this.contracts.mustGetContracts('sui');
      if (!token_bridge) throw new Error('token bridge contract not found');
      const coinType = await getForeignAssetSui(
        this.provider,
        token_bridge,
        this.context.toChainId('sui'),
        arrayify(address),
      );
      if (coinType === null) {
        throw new Error('coinType is null');
      }
      return coinType;
    } catch (e) {
      console.error(`parseAssetAddress - error: ${e}`);
      throw e;
    }
  }

  async getMessage(
    tx: string,
    chain: ChainName | ChainId,
    parseRelayerPayload: boolean = true,
  ): Promise<ParsedMessage | ParsedRelayerMessage> {
    const txBlock = await this.provider.getTransactionBlock({
      digest: tx,
      options: { showEvents: true, showEffects: true, showInput: true },
    });
    const message = txBlock.events?.find((event) =>
      event.type.endsWith('WormholeMessage'),
    );
    if (!message || !message.parsedJson) {
      throw new Error('WormholeMessage not found');
    }
    const { payload, sender: emitterAddress, sequence } = message.parsedJson;

    const parsed = parseTokenTransferPayload(Buffer.from(payload));

    const tokenContext = this.context.getContext(parsed.tokenChain as ChainId);
    const destContext = this.context.getContext(parsed.toChain as ChainId);
    const tokenAddress = await tokenContext.parseAssetAddress(
      hexlify(parsed.tokenAddress),
    );
    const tokenChain = this.context.toChainName(parsed.tokenChain);
    const gasFee = getTotalGasUsed(txBlock);
    const to = destContext.parseAddress(hexlify(parsed.to));
    const parsedMessage: ParsedMessage = {
      sendTx: txBlock.digest,
      sender: getTransactionSender(txBlock) || '',
      amount: BigNumber.from(parsed.amount),
      payloadID: parsed.payloadType,
      recipient: to,
      toChain: this.context.toChainName(parsed.toChain),
      fromChain: this.context.toChainName(chain),
      tokenAddress,
      tokenChain,
      tokenId: {
        chain: tokenChain,
        address: tokenAddress,
      },
      sequence: BigNumber.from(sequence),
      emitterAddress: hexlify(emitterAddress),
      block: Number(txBlock.checkpoint || ''),
      gasFee: gasFee ? BigNumber.from(gasFee) : undefined,
      payload: parsed.tokenTransferPayload.length
        ? hexlify(parsed.tokenTransferPayload)
        : undefined,
    };
    if (parseRelayerPayload && parsed.payloadType === 3) {
      const relayerPayload = destContext.parseRelayerPayload(
        Buffer.from(parsed.tokenTransferPayload),
      );
      const relayerMessage: ParsedRelayerMessage = {
        ...parsedMessage,
        relayerFee: relayerPayload.relayerFee,
        relayerPayloadId: parsed.payloadType as number,
        to,
        recipient: destContext.parseAddress(hexlify(relayerPayload.to)),
        toNativeTokenAmount: relayerPayload.toNativeTokenAmount,
      };
      return relayerMessage;
    }
    return parsedMessage;
  }

  async isTransferCompleted(
    destChain: ChainName | ChainId,
    signedVaa: string,
  ): Promise<boolean> {
    const { token_bridge } = this.contracts.mustGetContracts('sui');
    if (!token_bridge) throw new Error('token bridge contract not found');
    return await getIsTransferCompletedSui(
      this.provider,
      token_bridge,
      arrayify(signedVaa, { allowMissingPrefix: true }),
    );
  }

  async getCurrentBlock(): Promise<number> {
    if (!this.provider) throw new Error('no provider');
    const sequence = await this.provider.getLatestCheckpointSequenceNumber();
    return Number(sequence);
  }

  // MODIFIED FROM @certusone/wormhole-sdk
  // These differ in that they include an additional parameter to allow for caching of the `tokenBridgeStateFields`
  async getTokenCoinType(
    provider: JsonRpcProvider,
    tokenBridgeStateObjectId: string,
    tokenAddress: Uint8Array,
    tokenChain: number,
    tokenBridgeStateFields?: Record<string, any> | null,
  ): Promise<string | null> {
    tokenBridgeStateFields =
      tokenBridgeStateFields ||
      (await getObjectFields(provider, tokenBridgeStateObjectId));
    if (!tokenBridgeStateFields) {
      throw new Error('Unable to fetch object fields from token bridge state');
    }

    const coinTypes =
      tokenBridgeStateFields?.token_registry?.fields?.coin_types;
    const coinTypesObjectId = coinTypes?.fields?.id?.id;
    if (!coinTypesObjectId) {
      throw new Error('Unable to fetch coin types');
    }

    const keyType = getTableKeyType(coinTypes?.type);
    if (!keyType) {
      throw new Error('Unable to get key type');
    }

    const response = await provider.getDynamicFieldObject({
      parentId: coinTypesObjectId,
      name: {
        type: keyType,
        value: {
          addr: [...tokenAddress],
          chain: tokenChain,
        },
      },
    });
    if (response.error) {
      if (response.error.code === 'dynamicFieldNotFound') {
        return null;
      }
      throw new Error(
        `Unexpected getDynamicFieldObject response ${response.error}`,
      );
    }
    const fields = getFieldsFromObjectResponse(response);
    return fields?.value ? trimSuiType(ensureHexPrefix(fields.value)) : null;
  }

  async getForeignAssetSui(
    provider: JsonRpcProvider,
    tokenBridgeStateObjectId: string,
    originChainId: ChainId,
    originAddress: Uint8Array,
    tokenBridgeStateFields?: Record<string, any> | null,
  ): Promise<string | null> {
    return this.getTokenCoinType(
      provider,
      tokenBridgeStateObjectId,
      originAddress,
      originChainId,
      tokenBridgeStateFields,
    );
  }

  async getWrappedNativeTokenId(chain: ChainName | ChainId): Promise<TokenId> {
    return {
      address: SUI_TYPE_ARG,
      chain: 'sui',
    };
  }
}
