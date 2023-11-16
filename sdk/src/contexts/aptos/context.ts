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

  protected async getTxGasFee(
    txId: string,
    chain: ChainName | ChainId,
  ): Promise<BigNumber | undefined> {
    const txn = await this.aptosClient.getTransactionByHash(txId);
    if (txn.type === 'user_transaction') {
      const userTxn = txn as Types.UserTransaction;
      return BigNumber.from(userTxn.gas_used).mul(userTxn.gas_unit_price);
    }
  }

  async send(
    token: TokenId | typeof NATIVE,
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    relayerFee: string = '0',
  ): Promise<Types.EntryFunctionPayload> {
    return this.innerSend(
      token,
      amount,
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
      relayerFee,
      undefined,
    );
  }

  async sendWithPayload(
    token: TokenId | typeof NATIVE,
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    payload: Uint8Array,
  ): Promise<Types.EntryFunctionPayload> {
    return this.innerSend(
      token,
      amount,
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
      undefined,
      payload,
    );
  }
  async estimateSendGas(
    token: TokenId | typeof NATIVE,
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
  ): Promise<BigNumber> {
    // TODO: the account's public key is needed for AptosClient.simulateTransaction
    // throw error so it goes to the fallback value
    throw new Error('not implemented');
  }
  async estimateClaimGas(
    destChain: ChainName | ChainId,
    VAA: Uint8Array,
  ): Promise<BigNumber> {
    // TODO: the account's public key is needed for AptosClient.simulateTransaction
    // throw error so it goes to the fallback value
    throw new Error('not implemented');
  }

  private async innerSend(
    token: TokenId | typeof NATIVE,
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    relayerFee: string = '0',
    payload: Uint8Array | undefined,
  ): Promise<Types.EntryFunctionPayload> {
    const destContext = this.context.getContext(recipientChain);
    const recipientChainId = this.context.toChainId(recipientChain);

    const formattedRecipientAccount = arrayify(
      destContext.formatAddress(recipientAddress),
    );

    let coinType;
    if (token === NATIVE) {
      coinType = APTOS_COIN;
    } else {
      coinType = await this.mustGetForeignAsset(token, sendingChain);
    }

    const tx = transferFromAptos(
      this.contracts.mustGetBridge(sendingChain),
      coinType,
      amount,
      recipientChainId,
      formattedRecipientAccount,
      relayerFee,
      payload,
    );
    return tx;
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

  async getForeignAsset(
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<string | null> {
    const chainName = this.context.toChainName(chain);
    if (this.foreignAssetCache.get(tokenId.chain, tokenId.address, chainName)) {
      return this.foreignAssetCache.get(
        tokenId.chain,
        tokenId.address,
        chainName,
      )!;
    }

    const chainId = this.context.toChainId(tokenId.chain);
    const toChainId = this.context.toChainId(chain);
    if (toChainId === chainId) return tokenId.address;

    const { token_bridge } = this.context.mustGetContracts(chain);
    if (!token_bridge) throw new Error('token bridge contract not found');

    const tokenContext = this.context.getContext(tokenId.chain);
    const formattedAddr = await tokenContext.formatAssetAddress(
      tokenId.address,
    );
    const asset = await getForeignAssetAptos(
      this.aptosClient,
      token_bridge,
      chainId,
      hexlify(formattedAddr),
    );

    if (!asset) return null;
    this.foreignAssetCache.set(
      tokenId.chain,
      tokenId.address,
      chainName,
      asset,
    );
    return asset;
  }

  async mustGetForeignAsset(
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<string> {
    const addr = await this.getForeignAsset(tokenId, chain);
    if (!addr) throw new Error('token not registered');
    return addr;
  }

  async fetchTokenDecimals(
    tokenAddr: string,
    chain: ChainName | ChainId,
  ): Promise<number> {
    const coinType = `0x1::coin::CoinInfo<${tokenAddr}>`;
    const decimals = (
      (
        await this.aptosClient.getAccountResource(
          tokenAddr.split('::')[0],
          coinType,
        )
      ).data as any
    ).decimals;
    return decimals;
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

  async getNativeBalance(
    walletAddress: string,
    chain: ChainName | ChainId,
  ): Promise<BigNumber> {
    return await this.checkBalance(walletAddress, APTOS_COIN);
  }

  async getTokenBalance(
    walletAddress: string,
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<BigNumber | null> {
    const address = await this.getForeignAsset(tokenId, chain);
    if (!address) return null;
    const balance = await this.checkBalance(walletAddress, address);
    return balance ? BigNumber.from(balance) : null;
  }

  async getTokenBalances(
    walletAddress: string,
    tokenIds: TokenId[],
    chain: ChainName | ChainId,
  ): Promise<(BigNumber | null)[]> {
    const addresses = await Promise.all(
      tokenIds.map((tokenId) => this.getForeignAsset(tokenId, chain)),
    );
    let coinBalances: CoinBalance[] = [];
    let offset = 0;
    const limit = 100;
    while (true) {
      const result = await this.fetchCurrentCoins(walletAddress, offset, limit);
      coinBalances = [...coinBalances, ...result.data.current_coin_balances];
      if (result.data.current_coin_balances.length < limit) {
        break;
      }
      offset += result.data.current_coin_balances.length;
    }

    return addresses.map((address) =>
      !address
        ? null
        : BigNumber.from(
            coinBalances.find((bal) => bal.coin_type === address)?.amount || 0,
          ),
    );
  }

  async checkBalance(
    walletAddress: string,
    coinType: string,
  ): Promise<BigNumber> {
    try {
      const balance = await this.coinClient.checkBalance(walletAddress, {
        coinType,
      });
      return BigNumber.from(balance);
    } catch (e: any) {
      if (
        (e instanceof Types.ApiError || e.errorCode === 'resource_not_found') &&
        e.status === 404
      ) {
        return BigNumber.from(0);
      }
      throw e;
    }
  }

  async fetchCurrentCoins(ownerAddress: string, offset: number, limit: number) {
    if (!this.context.conf.graphql.aptos)
      throw new Error('Aptos graphql not configured');
    const response = await axios.post<CurrentCoinBalancesResponse>(
      this.context.conf.graphql.aptos,
      {
        query: `query CurrentCoinBalances($owner_address: String, $offset: Int, $limit: Int) {
        current_coin_balances(
          where: {owner_address: {_eq: $owner_address}} 
          offset: $offset
          limit: $limit
        ) {
          coin_type
          amount
        }
      }`,
        variables: { owner_address: ownerAddress, offset, limit },
      },
    );
    return response.data;
  }

  async redeem(
    destChain: ChainName | ChainId,
    signedVAA: Uint8Array,
    overrides: any,
    payerAddr?: any,
  ): Promise<Types.EntryFunctionPayload> {
    const payload = await redeemOnAptos(
      this.aptosClient,
      this.contracts.mustGetBridge(destChain),
      signedVAA,
    );
    return payload;
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
