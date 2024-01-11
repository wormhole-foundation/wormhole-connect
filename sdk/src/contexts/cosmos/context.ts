import {
  CHAIN_ID_WORMCHAIN,
  CosmWasmChainId,
  WormholeWrappedInfo,
  cosmos,
  hexToUint8Array,
  isNativeCosmWasmDenom,
  parseTokenTransferPayload,
  parseVaa,
} from '@certusone/wormhole-sdk';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { EncodeObject } from '@cosmjs/proto-signing';
import {
  BankExtension,
  Coin,
  IbcExtension,
  QueryClient,
  calculateFee,
  setupBankExtension,
  setupIbcExtension,
} from '@cosmjs/stargate';
import {
  Tendermint34Client,
  Tendermint37Client,
  TendermintClient,
} from '@cosmjs/tendermint-rpc';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import { BigNumber, utils } from 'ethers';
import {
  arrayify,
  base58,
  base64,
  hexStripZeros,
  keccak256,
  zeroPad,
} from 'ethers/lib/utils';
import {
  ChainId,
  ChainName,
  Context,
  NATIVE,
  ParsedMessage,
  ParsedRelayerMessage,
  ParsedRelayerPayload,
  TokenId,
} from '../../types';
import { ForeignAssetCache, Lock } from '../../utils';
import { WormholeContext } from '../../wormhole';
import { TokenBridgeAbstract } from '../abstracts/tokenBridge';
import { CosmosContracts } from './contracts';
import { getNativeDenom, getPrefix, isNativeDenom } from './denom';
import {
  CosmosTransaction,
  IBCConnection,
  WrappedRegistryResponse,
} from './types';
import { isGatewayChain } from './utils';

const MSG_EXECUTE_CONTRACT_TYPE_URL = '/cosmwasm.wasm.v1.MsgExecuteContract';
const buildExecuteMsg = (
  sender: string,
  contract: string,
  msg: Record<string, any>,
  funds?: Coin[],
): EncodeObject => ({
  typeUrl: MSG_EXECUTE_CONTRACT_TYPE_URL,
  value: MsgExecuteContract.fromPartial({
    sender: sender,
    contract: contract,
    msg: Buffer.from(JSON.stringify(msg)),
    funds,
  }),
});

const IBC_PORT = 'transfer';

export class CosmosContext<
  T extends WormholeContext,
> extends TokenBridgeAbstract<CosmosTransaction> {
  readonly type = Context.COSMOS;
  readonly contracts: CosmosContracts<T>;
  readonly context: T;
  readonly chain: ChainName;

  private static FETCH_CLIENT_LOCK = new Lock();
  private static CLIENT_MAP: Partial<Record<string, TendermintClient>> = {};
  private static FETCH_CONNECTION_LOCK = new Lock();
  private static CHANNEL_MAP: Partial<Record<ChainName, IBCConnection>> = {};
  private foreignAssetCache: ForeignAssetCache;

  constructor(
    context: T,
    chain: ChainName,
    foreignAssetCache: ForeignAssetCache,
  ) {
    super();
    this.context = context;
    this.contracts = new CosmosContracts<T>(context);
    this.chain = chain;
    this.foreignAssetCache = foreignAssetCache;
  }

  protected async getTxGasFee(
    txId: string,
    chain: ChainName | ChainId,
  ): Promise<BigNumber | undefined> {
    const client = await this.getCosmWasmClient(chain);
    const transaction = await client.getTx(txId);
    return BigNumber.from(transaction?.gasUsed || 0);
  }

  send(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    relayerFee: any,
  ): Promise<CosmosTransaction> {
    throw new Error('Method not implemented.');
  }

  sendWithPayload(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    payload: any,
  ): Promise<CosmosTransaction> {
    throw new Error('Method not implemented.');
  }

  async estimateSendGas(
    token: TokenId | typeof NATIVE,
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
  ): Promise<BigNumber> {
    throw new Error('not implemented');
  }
  async estimateClaimGas(
    destChain: ChainName | ChainId,
    VAA: Uint8Array,
  ): Promise<BigNumber> {
    throw new Error('not implemented');
  }

  formatAddress(address: string): Uint8Array {
    return arrayify(zeroPad(cosmos.canonicalAddress(address), 32));
  }

  parseAddress(address: any): string {
    const prefix = getPrefix(this.chain);

    const addr =
      typeof address === 'string' && address.startsWith('0x')
        ? Buffer.from(hexStripZeros(address).substring(2), 'hex')
        : address;
    return cosmos.humanAddress(prefix, addr);
  }

  async formatAssetAddress(address: string): Promise<Uint8Array> {
    return Buffer.from(this.buildTokenId(address), 'hex');
  }

  private buildTokenId(asset: string): string {
    const chainId = this.context.toChainId(this.chain) as CosmWasmChainId;
    const isNative = isNativeCosmWasmDenom(chainId, asset);
    return (
      (isNative ? '01' : '00') +
      keccak256(Buffer.from(asset, 'utf-8')).substring(4)
    );
  }

  async parseAssetAddress(address: any): Promise<string> {
    const prefix = getPrefix(this.chain);

    const addr =
      typeof address === 'string' && address.startsWith('0x')
        ? Buffer.from(hexStripZeros(address).substring(2), 'hex')
        : address;
    return cosmos.humanAddress(prefix, addr);
  }

  async getForeignAsset(
    tokenId: TokenId,
    chain: ChainId | ChainName,
  ): Promise<string | null> {
    const chainName = this.context.toChainName(chain);
    if (this.foreignAssetCache.get(tokenId.chain, tokenId.address, chainName)) {
      return this.foreignAssetCache.get(
        tokenId.chain,
        tokenId.address,
        chainName,
      )!;
    }

    const address =
      this.context.toChainId(chain) === CHAIN_ID_WORMCHAIN
        ? await this.getWhForeignAsset(tokenId, chain)
        : await this.getGatewayForeignAsset(tokenId, chain);

    if (!address) return null;
    this.foreignAssetCache.set(
      tokenId.chain,
      tokenId.address,
      chainName,
      address,
    );

    return address;
  }

  async getGatewayForeignAsset(
    tokenId: TokenId,
    chain: ChainId | ChainName,
  ): Promise<string | null> {
    // add check here in case the token is a native cosmos denom
    // in such cases there's no need to look for in the wormchain network
    if (tokenId.chain === chain) return tokenId.address;
    const wrappedAsset = await this.getWhForeignAsset(
      tokenId,
      CHAIN_ID_WORMCHAIN,
    );
    if (!wrappedAsset) return null;
    return this.isNativeDenom(wrappedAsset, chain)
      ? wrappedAsset
      : this.deriveIBCDenom(this.CW20AddressToFactory(wrappedAsset), chain);
  }

  private CW20AddressToFactory(address: string): string {
    const encodedAddress = base58.encode(cosmos.canonicalAddress(address));
    return `factory/${this.getTranslatorAddress()}/${encodedAddress}`;
  }

  getTranslatorAddress(): string {
    const addr =
      this.context.conf.chains['wormchain']?.contracts.ibcShimContract;
    if (!addr) throw new Error('IBC Shim contract not configured');
    return addr;
  }

  async deriveIBCDenom(
    denom: string,
    chain: ChainId | ChainName,
  ): Promise<string | null> {
    const channel = await this.getIbcDestinationChannel(chain);
    const hashData = utils.hexlify(Buffer.from(`transfer/${channel}/${denom}`));
    const hash = utils.sha256(hashData).substring(2);
    return `ibc/${hash.toUpperCase()}`;
  }

  async getConnection(chain: ChainId | ChainName): Promise<IBCConnection> {
    await CosmosContext.FETCH_CONNECTION_LOCK.acquire();

    try {
      const chainName = this.context.toChainName(chain);
      if (CosmosContext.CHANNEL_MAP[chainName]) {
        return CosmosContext.CHANNEL_MAP[chainName]!;
      }

      const srcChannel = await this.queryIbcSourceChannel(chain);
      const queryClient = await this.getQueryClient(CHAIN_ID_WORMCHAIN);
      const conn = await queryClient.ibc.channel.channel(IBC_PORT, srcChannel);

      const destChannel = conn.channel?.counterparty?.channelId;
      if (!destChannel) {
        throw new Error(`No destination channel found on chain ${chain}`);
      }

      const connection: IBCConnection = {
        srcChannel: srcChannel,
        destChannel: destChannel,
      };
      CosmosContext.CHANNEL_MAP[chainName] = connection;

      return connection;
    } finally {
      await CosmosContext.FETCH_CONNECTION_LOCK.release();
    }
  }

  async getIbcDestinationChannel(chain: ChainId | ChainName): Promise<string> {
    const { destChannel } = await this.getConnection(chain);
    return destChannel;
  }

  async getIbcSourceChannel(chain: ChainId | ChainName): Promise<string> {
    const { srcChannel } = await this.getConnection(chain);
    return srcChannel;
  }

  private async queryIbcSourceChannel(
    chain: ChainId | ChainName,
  ): Promise<string> {
    const id = this.context.toChainId(chain);
    if (!isGatewayChain(id))
      throw new Error(`Chain ${chain} is not a gateway chain`);
    const client = await this.getCosmWasmClient(CHAIN_ID_WORMCHAIN);
    const { channel } = await client.queryContractSmart(
      this.getTranslatorAddress(),
      {
        ibc_channel: {
          chain_id: id,
        },
      },
    );
    return channel;
  }

  private isNativeDenom(denom: string, chain: ChainName | ChainId): boolean {
    const chainName = this.context.toChainName(chain);
    return isNativeDenom(denom, chainName);
  }

  async getWhForeignAsset(
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<string | null> {
    const toChainId = this.context.toChainId(chain);
    const chainId = this.context.toChainId(tokenId.chain);
    if (toChainId === chainId) return tokenId.address;

    const wasmClient = await this.getCosmWasmClient(chain);
    const { token_bridge: tokenBridgeAddress } =
      await this.contracts.mustGetContracts(chain);
    if (!tokenBridgeAddress) throw new Error('Token bridge contract not found');

    const sourceContext = this.context.getContext(tokenId.chain);
    const tokenAddr = await sourceContext.formatAssetAddress(tokenId.address);
    const base64Addr = Buffer.from(tokenAddr).toString('base64');

    try {
      const { address }: WrappedRegistryResponse =
        await wasmClient.queryContractSmart(tokenBridgeAddress, {
          wrapped_registry: {
            chain: chainId,
            address: base64Addr,
          },
        });

      return address;
    } catch (e) {
      return null;
    }
  }

  async getNativeBalance(
    walletAddress: string,
    chain: ChainName | ChainId,
    asset?: string,
  ): Promise<BigNumber> {
    const name = this.context.toChainName(chain);
    const client = await this.getCosmWasmClient(name);
    const { amount } = await client.getBalance(
      walletAddress,
      asset || getNativeDenom(name, this.context.conf.env),
    );
    return BigNumber.from(amount);
  }

  async getTokenBalance(
    walletAddress: string,
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<BigNumber | null> {
    const assetAddress = await this.getForeignAsset(tokenId, chain);
    if (!assetAddress) return null;
    return this.getNativeBalance(walletAddress, chain, assetAddress);
  }

  async getTokenBalances(
    walletAddress: string,
    tokenIds: TokenId[],
    chain: ChainName | ChainId,
  ): Promise<(BigNumber | null)[]> {
    const assetAddresses = await Promise.all(
      tokenIds.map((tokenId) => this.getForeignAsset(tokenId, chain)),
    );
    const client = await this.getQueryClient(chain);
    const balances = await client.bank.allBalances(walletAddress);
    return assetAddresses.map((assetAddress) => {
      const balance = balances.find(
        (balance) => balance.denom === assetAddress,
      );
      return balance ? BigNumber.from(balance.amount) : null;
    });
  }

  async redeem(
    destChain: ChainName | ChainId,
    signedVAA: Uint8Array,
    overrides: any,
    payerAddr?: any,
  ): Promise<CosmosTransaction> {
    const chainName = this.context.toChainName(destChain);
    const vaa = parseVaa(signedVAA);
    const transfer = parseTokenTransferPayload(vaa.payload);

    const denom = getNativeDenom(chainName, this.context.conf.env);
    const prefix = getPrefix(chainName);

    // transfer to comes as a 32 byte array, but cosmos addresses are 20 bytes
    const recipient = cosmos.humanAddress(prefix, transfer.to.slice(12));

    const msgs = [
      buildExecuteMsg(
        payerAddr || recipient,
        this.getTokenBridgeAddress(chainName),
        {
          submit_vaa: {
            data: base64.encode(signedVAA),
          },
        },
      ),
    ];

    const fee = calculateFee(1000000, `0.1${denom}`);

    return {
      msgs,
      fee,
      memo: 'Wormhole - Complete Transfer',
    };
  }

  async isTransferCompleted(
    destChain: ChainName | ChainId,
    signedVaa: string,
  ): Promise<boolean> {
    const { token_bridge: tokenBridgeAddress } =
      this.contracts.mustGetContracts(this.chain);
    if (!tokenBridgeAddress) throw new Error('Token bridge contract not found');
    const client = await this.getCosmWasmClient(destChain);
    const result = await client.queryContractSmart(tokenBridgeAddress, {
      is_vaa_redeemed: {
        vaa: base64.encode(arrayify(signedVaa)),
      },
    });
    return result.is_redeemed;
  }

  async fetchTokenDecimals(
    tokenAddr: string,
    chain: ChainName | ChainId,
  ): Promise<number> {
    const name = this.context.toChainName(chain);
    if (tokenAddr === getNativeDenom(name, this.context.conf.env)) {
      const config = this.context.conf.chains[name];
      if (!config) throw new Error(`Config not found for chain ${chain}`);
      return config.nativeTokenDecimals;
    }

    // extract the cw20 from the ibc denom if the target chain is not wormchain
    const cw20 =
      name === 'wormchain'
        ? tokenAddr
        : await this.ibcDenomToCW20(tokenAddr, chain);
    const client = await this.getCosmWasmClient(CHAIN_ID_WORMCHAIN);
    const { decimals } = await client.queryContractSmart(cw20, {
      token_info: {},
    });
    return decimals;
  }

  private async ibcDenomToCW20(
    denom: string,
    chain: ChainName | ChainId,
  ): Promise<string> {
    const client = await this.getQueryClient(chain);

    let res;
    try {
      res = await client.ibc.transfer.denomTrace(denom);
    } catch (e: any) {
      if (e.message.includes('denomination trace not found')) {
        throw new Error(`denom trace for ${denom} not found`);
      }
      throw e;
    }

    if (!res.denomTrace) throw new Error(`denom trace for ${denom} not found`);
    const { baseDenom } = res.denomTrace;
    const parts = baseDenom.split('/');
    if (parts.length !== 3)
      throw new Error(`Can't convert ${denom} to cw20 address`);
    const [, , address] = parts;
    return cosmos.humanAddress('wormhole', base58.decode(address));
  }

  async getMessage(
    id: string,
    chain: ChainName | ChainId,
    parseRelayerPayload: boolean = true,
  ): Promise<ParsedMessage | ParsedRelayerMessage> {
    // see the gateway route for the implementation
    // we might not have all information available in the parameters
    // to do it here
    throw new Error(
      'Not implemented. Something went wrong, this method implementation should never be called',
    );
  }

  parseRelayerPayload(payload: Buffer): ParsedRelayerPayload {
    return {
      relayerPayloadId: 0,
      to: '',
      relayerFee: BigNumber.from(0),
      toNativeTokenAmount: BigNumber.from(0),
    };
  }

  private async getQueryClient(
    chain: ChainId | ChainName,
  ): Promise<QueryClient & BankExtension & IbcExtension> {
    const tmClient = await this.getTmClient(chain);
    return QueryClient.withExtensions(
      tmClient,
      setupBankExtension,
      setupIbcExtension,
    );
  }

  private async getTmClient(
    chain: ChainId | ChainName,
  ): Promise<Tendermint34Client | Tendermint37Client> {
    await CosmosContext.FETCH_CLIENT_LOCK.acquire();

    try {
      const name = this.context.toChainName(chain);
      if (CosmosContext.CLIENT_MAP[name]) {
        return CosmosContext.CLIENT_MAP[name]!;
      }

      const rpc = this.context.conf.rpcs[name];
      if (!rpc) throw new Error(`${chain} RPC not configured`);

      // from cosmjs: https://github.com/cosmos/cosmjs/blob/358260bff71c9d3e7ad6644fcf64dc00325cdfb9/packages/stargate/src/stargateclient.ts#L218
      let tmClient: TendermintClient;
      const tm37Client = await Tendermint37Client.connect(rpc);
      const version = (await tm37Client.status()).nodeInfo.version;
      if (version.startsWith('0.37.')) {
        tmClient = tm37Client;
      } else {
        tm37Client.disconnect();
        tmClient = await Tendermint34Client.connect(rpc);
      }

      CosmosContext.CLIENT_MAP[name] = tmClient;

      return tmClient;
    } finally {
      CosmosContext.FETCH_CLIENT_LOCK.release();
    }
  }

  private async getCosmWasmClient(
    chain: ChainId | ChainName,
  ): Promise<CosmWasmClient> {
    const tmClient = await this.getTmClient(chain);
    return CosmWasmClient.create(tmClient);
  }

  getTokenBridgeAddress(chain: ChainName): string {
    const { token_bridge: tokenBridge } =
      this.contracts.mustGetContracts(chain);
    if (!tokenBridge)
      throw new Error(`No token bridge found for chain ${chain}`);
    return tokenBridge;
  }

  async getCurrentBlock(): Promise<number> {
    const client = await this.getCosmWasmClient(this.chain);
    return client.getHeight();
  }

  async getOriginalAsset(
    chain: ChainName | ChainId,
    wrappedAddress: string,
  ): Promise<WormholeWrappedInfo> {
    const chainId = this.context.toChainId(chain) as CosmWasmChainId;
    // need to cast to ChainId since Terra (chain id 3) is not on wh connect
    if (!isGatewayChain(chainId as ChainId)) {
      throw new Error(`${chain} is not a cosmos chain`);
    }
    if (isNativeCosmWasmDenom(chainId, wrappedAddress)) {
      return {
        isWrapped: false,
        chainId,
        assetAddress: hexToUint8Array(this.buildTokenId(wrappedAddress)),
      };
    }
    try {
      const client = await this.getCosmWasmClient(chain);
      const response = await client.queryContractSmart(wrappedAddress, {
        wrapped_asset_info: {},
      });
      return {
        isWrapped: true,
        chainId: response.asset_chain,
        assetAddress: new Uint8Array(
          Buffer.from(response.asset_address, 'base64'),
        ),
      };
    } catch {}
    return {
      isWrapped: false,
      chainId: chainId,
      assetAddress: hexToUint8Array(this.buildTokenId(wrappedAddress)),
    };
  }

  async getWrappedNativeTokenId(chain: ChainName | ChainId): Promise<TokenId> {
    throw new Error('Method not implemented.');
  }
}
