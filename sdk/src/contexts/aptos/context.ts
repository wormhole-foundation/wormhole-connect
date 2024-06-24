import { BigNumber } from 'ethers';
import {
  TokenId,
  ParsedRelayerMessage,
  ChainName,
  ChainId,
  NATIVE,
  ParsedMessage,
  Context,
  ParsedRelayerPayload,
} from '../../types';
import { WormholeContext } from '../../wormhole';
import { TokenBridgeAbstract } from '../abstracts/tokenBridge';
import { AptosContracts } from './contracts';
import { AptosClient, CoinClient, Types } from 'aptos';
import {
  getForeignAssetAptos,
  getIsTransferCompletedAptos,
  getTypeFromExternalAddress,
  hexToUint8Array,
  isValidAptosType,
  parseTokenTransferPayload,
  redeemOnAptos,
  transferFromAptos,
} from '@certusone/wormhole-sdk';
import { arrayify, hexlify, stripZeros, zeroPad } from 'ethers/lib/utils';
import { sha3_256 } from 'js-sha3';
import { ForeignAssetCache } from '../../utils';
import axios from 'axios';

export const APTOS_COIN = '0x1::aptos_coin::AptosCoin';

export type CurrentCoinBalancesResponse = {
  data: { current_coin_balances: CoinBalance[] };
};

export type CoinBalance = {
  coin_type: string;
  amount: number;
};
export class AptosContext<
  T extends WormholeContext,
> extends TokenBridgeAbstract<Types.EntryFunctionPayload> {
  readonly type = Context.APTOS;
  protected contracts: AptosContracts<T>;
  readonly context: T;
  readonly aptosClient: AptosClient;
  readonly coinClient: CoinClient;
  private foreignAssetCache: ForeignAssetCache;

  constructor(context: T, foreignAssetCache: ForeignAssetCache) {
    super();
    this.context = context;
    const rpc = context.conf.rpcs.aptos;
    if (rpc === undefined) throw new Error('No Aptos rpc configured');
    this.aptosClient = new AptosClient(rpc);
    this.coinClient = new CoinClient(this.aptosClient);
    this.contracts = new AptosContracts(context, this.aptosClient);
    this.foreignAssetCache = foreignAssetCache;
  }

  formatAddress(address: string): Uint8Array {
    return arrayify(zeroPad(address, 32));
  }

  parseAddress(address: string): string {
    return hexlify(stripZeros(address));
  }

  async formatAssetAddress(address: string): Promise<Uint8Array> {
    if (!isValidAptosType(address)) {
      throw new Error(`Unable to format Aptos asset address: ${address}`);
    }
    return hexToUint8Array(sha3_256(address));
  }

  async parseAssetAddress(address: string): Promise<string> {
    const bridge = this.contracts.mustGetBridge('aptos');
    const assetType = await getTypeFromExternalAddress(
      this.aptosClient,
      bridge,
      address,
    );
    if (!assetType)
      throw new Error(`Unable to parse Aptos asset address: ${address}`);
    return assetType;
  }

  async getMessage(
    tx: string,
    chain: ChainName | ChainId,
    parseRelayerPayload: boolean = true,
  ): Promise<ParsedMessage | ParsedRelayerMessage> {
    const transaction = await this.aptosClient.getTransactionByHash(tx);
    if (transaction.type !== 'user_transaction') {
      throw new Error(`${tx} is not a user_transaction`);
    }
    const userTransaction = transaction as Types.UserTransaction;
    const message = userTransaction.events.find((event) =>
      event.type.endsWith('WormholeMessage'),
    );
    if (!message || !message.data) {
      throw new Error(`WormholeMessage not found for ${tx}`);
    }

    const { payload, sender, sequence } = message.data;

    const parsed = parseTokenTransferPayload(
      Buffer.from(payload.slice(2), 'hex'),
    );
    const tokenContext = this.context.getContext(parsed.tokenChain as ChainId);
    const destContext = this.context.getContext(parsed.toChain as ChainId);
    const tokenAddress = await tokenContext.parseAssetAddress(
      hexlify(parsed.tokenAddress),
    );
    const tokenChain = this.context.toChainName(parsed.tokenChain);

    // make sender address even-length
    const emitter = hexlify(sender, {
      allowMissingPrefix: true,
      hexPad: 'left',
    });
    const parsedMessage: ParsedMessage = {
      sendTx: userTransaction.hash,
      sender: userTransaction.sender,
      amount: BigNumber.from(parsed.amount),
      payloadID: Number(parsed.payloadType),
      recipient: destContext.parseAddress(hexlify(parsed.to)),
      toChain: this.context.toChainName(parsed.toChain),
      fromChain: this.context.toChainName(chain),
      tokenAddress,
      tokenChain,
      tokenId: {
        chain: tokenChain,
        address: tokenAddress,
      },
      sequence: BigNumber.from(sequence),
      emitterAddress: hexlify(this.formatAddress(emitter)),
      block: Number(userTransaction.version),
      gasFee: BigNumber.from(userTransaction.gas_used).mul(
        userTransaction.gas_unit_price,
      ),
      payload: parsed.tokenTransferPayload.length
        ? hexlify(parsed.tokenTransferPayload)
        : undefined,
    };
    return parsedMessage;
  }

  async isTransferCompleted(
    destChain: ChainName | ChainId,
    signedVaa: string,
  ): Promise<boolean> {
    return await getIsTransferCompletedAptos(
      this.aptosClient,
      this.contracts.mustGetBridge(destChain),
      arrayify(signedVaa, { allowMissingPrefix: true }),
    );
  }

  getTxIdFromReceipt(hash: Types.HexEncodedBytes) {
    return hash;
  }

  parseRelayerPayload(payload: Buffer): ParsedRelayerPayload {
    throw new Error('relaying is not supported on aptos');
  }

  async getCurrentBlock(): Promise<number> {
    throw new Error('Aptos getCurrentBlock not implemented');
  }

  async getWrappedNativeTokenId(chain: ChainName | ChainId): Promise<TokenId> {
    return {
      address: APTOS_COIN,
      chain: 'aptos',
    };
  }
}
