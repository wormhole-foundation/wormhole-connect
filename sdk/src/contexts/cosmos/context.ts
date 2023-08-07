import { cosmos, parseVaa } from '@certusone/wormhole-sdk';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { EncodeObject } from '@cosmjs/proto-signing';
import { StdFee } from '@cosmjs/stargate';
import { BigNumber } from 'ethers';
import {
  arrayify,
  base64,
  hexStripZeros,
  keccak256,
  zeroPad,
} from 'ethers/lib/utils';
import {
  ChainId,
  ChainName,
  Context,
  ParsedMessage,
  ParsedRelayerMessage,
  ParsedRelayerPayload,
  TokenId,
  VaaInfo,
} from '../../types';
import { WormholeContext } from '../../wormhole';
import { TokenBridgeAbstract } from '../abstracts/tokenBridge';
import { CosmosContracts } from './contracts';

export interface CosmosTransaction {
  fee: StdFee | 'auto' | 'number';
  msgs: EncodeObject[];
  memo: string;
}

interface WrappedRegistryResponse {
  address: string;
}

const NATIVE_DENOMS: Record<string, string> = {
  osmosis: 'uosmo',
  wormchain: 'uworm',
};

const PREFIXES: Record<string, string> = {
  osmosis: 'osmo',
  wormchain: 'wormchain',
};

export class CosmosContext<
  T extends WormholeContext,
> extends TokenBridgeAbstract<CosmosTransaction> {
  readonly type = Context.COSMOS;
  readonly contracts: CosmosContracts<T>;
  readonly context: T;
  readonly chain: ChainName | ChainId;

  private wasmClient?: CosmWasmClient;

  constructor(context: T, chain: ChainName | ChainId) {
    super();
    this.context = context;
    this.contracts = new CosmosContracts<T>(context);
    this.chain = chain;
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

  formatAddress(address: string) {
    return arrayify(zeroPad(cosmos.canonicalAddress(address), 32));
  }

  parseAddress(address: any): string {
    const prefix = PREFIXES[this.chain];
    if (!prefix) throw new Error(`Prefix not found for chain ${this.chain}`);

    const addr =
      typeof address === 'string' && address.startsWith('0x')
        ? Buffer.from(hexStripZeros(address).substring(2), 'hex')
        : address;
    return cosmos.humanAddress(prefix, addr);
  }

  async formatAssetAddress(address: string): Promise<any> {
    return this.buildTokenId(address);
  }

  private buildTokenId(address: string): string {
    const isNative = !!NATIVE_DENOMS[address];
    return (
      (isNative ? '01' : '00') +
      keccak256(Buffer.from(address, 'utf-8')).substring(4)
    );
  }

  async parseAssetAddress(address: any): Promise<string> {
    const prefix = PREFIXES[this.chain];
    if (!prefix) throw new Error(`Prefix not found for chain ${this.chain}`);

    const addr =
      typeof address === 'string' && address.startsWith('0x')
        ? Buffer.from(hexStripZeros(address).substring(2), 'hex')
        : address;
    return cosmos.humanAddress(prefix, addr);
  }

  async getForeignAsset(
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

  async mustGetForeignAsset(
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<string> {
    const assetAdddress = await this.getForeignAsset(tokenId, chain);
    if (!assetAdddress) throw new Error('token not registered');
    return assetAdddress;
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
      asset || NATIVE_DENOMS[name],
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

    if (assetAddress === this.getNativeDenom(chain)) {
      return this.getNativeBalance(walletAddress, chain);
    }

    const client = await this.getCosmWasmClient(chain);
    const { balance } = await client.queryContractSmart(assetAddress, {
      balance: { address: walletAddress },
    });
    return BigNumber.from(balance);
  }

  private getNativeDenom(chain: ChainName | ChainId): string {
    const name = this.context.toChainName(chain);
    const denom = NATIVE_DENOMS[name];
    if (!denom)
      throw new Error(`Native denomination not found for chain ${chain}`);
    return denom;
  }

  redeem(
    destChain: ChainName | ChainId,
    signedVAA: Uint8Array,
    overrides: any,
    payerAddr?: any,
  ): Promise<CosmosTransaction> {
    throw new Error('Method not implemented.');
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
    if (tokenAddr === this.getNativeDenom(chain)) return 6;
    const client = await this.getCosmWasmClient(chain);
    const { decimals } = await client.queryContractSmart(tokenAddr, {
      token_info: {},
    });
    return decimals;
  }

  async getVaa(id: string, chain: ChainName | ChainId): Promise<VaaInfo<any>> {
    return {
      transaction: {},
      rawVaa: new Uint8Array(),
      vaa: parseVaa(
        Buffer.from(
          'AQAAAAABAHTuF2Lg16OAXXVV1pNTMf3yDcspZEPFxfSLISpBQn/2XVwsnLcu/MkZgliKAhxozR7XKiJqiGDRg95zDumU7lABZLmEUgAAAAAAIJMoZzy13j/ZmXTO+72Q/qAz9MWaVyq/1+Gk7rzF0YFXAAAAAAAAV5AAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATEtAAAAAAAAAAAAAAAAAtPvycRQ/T797kaXe0xgF5CsiCNYAAgAAAAAAAAAAAAAAAEUYf7kP6QCfmadDsyFFyKEsyO8gAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
          'base64',
        ),
      ),
    };
  }

  async parseMessage(
    info: VaaInfo<any>,
  ): Promise<ParsedMessage | ParsedRelayerMessage> {
    throw new Error('not implemented');
  }

  parseRelayerPayload(payload: Buffer): ParsedRelayerPayload {
    return {
      relayerPayloadId: 0,
      to: '',
      relayerFee: BigNumber.from(0),
      toNativeTokenAmount: BigNumber.from(0),
    };
  }

  private async getCosmWasmClient(
    chain: ChainName | ChainId,
  ): Promise<CosmWasmClient> {
    if (!this.wasmClient) {
      const name = this.context.toChainName(chain);
      const rpc = this.context.conf.rpcs[name];
      if (!rpc) throw new Error('RPC not configured');
      this.wasmClient = await CosmWasmClient.connect(rpc);
    }
    return this.wasmClient;
  }

  async getCurrentBlock(): Promise<number> {
    const client = await this.getCosmWasmClient(this.chain);
    return client.getHeight();
  }
}
