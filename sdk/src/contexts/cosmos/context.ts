import {
  CosmWasmChainId,
  WormholeWrappedInfo,
  cosmos,
  hexToUint8Array,
  isCosmWasmChain,
  isNativeCosmWasmDenom,
  parseTokenTransferPayload,
  parseVaa,
} from '@certusone/wormhole-sdk';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { EncodeObject, decodeTxRaw } from '@cosmjs/proto-signing';
import {
  Coin,
  StdFee,
  calculateFee,
  logs as cosmosLogs,
} from '@cosmjs/stargate';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import { BigNumber } from 'ethers';
import {
  arrayify,
  base64,
  hexStripZeros,
  hexlify,
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
} from '../../types';
import { WormholeContext } from '../../wormhole';
import { TokenBridgeAbstract } from '../abstracts/tokenBridge';
import { CosmosContracts } from './contracts';
import { searchCosmosLogs } from './utils';
import { ForeignAssetCache } from '../../utils';

export interface CosmosTransaction {
  fee: StdFee | 'auto' | number;
  msgs: EncodeObject[];
  memo: string;
}

interface WrappedRegistryResponse {
  address: string;
}

const MAINNET_NATIVE_DENOMS: Record<string, string> = {
  osmosis: 'uosmo',
  wormchain: 'uworm',
  terra2: 'uluna',
  cosmoshub: 'uatom',
  evmos: 'aevmos',
};
const TESTNET_NATIVE_DENOMS: Record<string, string> = {
  ...MAINNET_NATIVE_DENOMS,
  evmos: 'atevmos',
};

const PREFIXES: Record<string, string> = {
  osmosis: 'osmo',
  wormchain: 'wormhole',
  terra2: 'terra',
  cosmoshub: 'cosmos',
  evmos: 'evmos',
};

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

export class CosmosContext<
  T extends WormholeContext,
> extends TokenBridgeAbstract<CosmosTransaction> {
  readonly type = Context.COSMOS;
  readonly contracts: CosmosContracts<T>;
  readonly context: T;
  readonly chain: ChainName;

  private static CLIENT_MAP: Record<string, CosmWasmClient> = {};
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

  formatAddress(address: string): Uint8Array {
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

  async formatAssetAddress(address: string): Promise<Uint8Array> {
    return Buffer.from(this.buildTokenId(address), 'hex');
  }

  private buildTokenId(address: string): string {
    const isNative =
      this.context.conf.env === 'TESTNET'
        ? !!TESTNET_NATIVE_DENOMS[address]
        : !!MAINNET_NATIVE_DENOMS[address];
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
    const chainName = this.context.toChainName(chain);
    if (this.foreignAssetCache.get(tokenId.chain, tokenId.address, chainName)) {
      return this.foreignAssetCache.get(
        tokenId.chain,
        tokenId.address,
        chainName,
      )!;
    }

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

      this.foreignAssetCache.set(
        tokenId.chain,
        tokenId.address,
        chainName,
        address,
      );

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
      asset || this.getNativeDenom(name),
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
    const denom =
      this.context.conf.env === 'TESTNET'
        ? TESTNET_NATIVE_DENOMS[name]
        : MAINNET_NATIVE_DENOMS[name];
    if (!denom) {
      throw new Error(`Native denomination not found for chain ${chain}`);
    }
    return denom;
  }

  private getPrefix(chain: ChainName | ChainId): string {
    const name = this.context.toChainName(chain);
    const prefix = PREFIXES[name];
    if (!prefix) throw new Error(`Prefix not found for chain ${chain}`);
    return prefix;
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

    const denom = this.getNativeDenom(chainName);
    const prefix = this.getPrefix(chainName);

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
    if (tokenAddr === this.getNativeDenom(chain)) return 6;
    const client = await this.getCosmWasmClient(chain);
    const { decimals } = await client.queryContractSmart(tokenAddr, {
      token_info: {},
    });
    return decimals;
  }

  async getMessage(
    id: string,
    chain: ChainName | ChainId,
  ): Promise<ParsedMessage | ParsedRelayerMessage> {
    const client = await this.getCosmWasmClient(chain);
    const tx = await client.getTx(id);
    if (!tx) throw new Error('tx not found');

    // parse logs emitted for the tx execution
    const logs = cosmosLogs.parseRawLog(tx.rawLog);

    // extract information wormhole contract logs
    // - wasm.message.message: the vaa payload (i.e. the transfer information)
    // - wasm.message.sequence: the vaa's sequence number
    // - wasm.message.sender: the vaa's emitter address
    const tokenTransferPayload = searchCosmosLogs('wasm.message.message', logs);
    if (!tokenTransferPayload)
      throw new Error('message/transfer payload not found');
    const sequence = searchCosmosLogs('wasm.message.sequence', logs);
    if (!sequence) throw new Error('sequence not found');
    const emitterAddress = searchCosmosLogs('wasm.message.sender', logs);
    if (!emitterAddress) throw new Error('emitter not found');

    const parsed = parseTokenTransferPayload(
      Buffer.from(tokenTransferPayload, 'hex'),
    );

    const decoded = decodeTxRaw(tx.tx);
    const { sender } = MsgExecuteContract.decode(
      decoded.body.messages[0].value,
    );

    const destContext = this.context.getContext(parsed.toChain as ChainId);
    const tokenContext = this.context.getContext(parsed.tokenChain as ChainId);

    const tokenAddress = await tokenContext.parseAssetAddress(
      hexlify(parsed.tokenAddress),
    );
    const tokenChain = this.context.toChainName(parsed.tokenChain);

    return {
      sendTx: tx.hash,
      sender,
      amount: BigNumber.from(parsed.amount),
      payloadID: parsed.payloadType,
      recipient: destContext.parseAddress(hexlify(parsed.to)),
      toChain: this.context.toChainName(parsed.toChain),
      fromChain: this.context.toChainName(chain),
      tokenAddress,
      tokenChain,
      tokenId: {
        address: tokenAddress,
        chain: tokenChain,
      },
      sequence: BigNumber.from(sequence),
      emitterAddress,
      block: tx.height,
      gasFee: BigNumber.from(tx.gasUsed),
      payload: parsed.tokenTransferPayload.length
        ? hexlify(parsed.tokenTransferPayload)
        : undefined,
    };
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
    chain: ChainId | ChainName,
  ): Promise<CosmWasmClient> {
    const name = this.context.toChainName(chain);
    if (CosmosContext.CLIENT_MAP[name]) {
      return CosmosContext.CLIENT_MAP[name];
    }

    const rpc = this.context.conf.rpcs[name];
    if (!rpc) throw new Error(`${chain} RPC not configured`);
    const client = await CosmWasmClient.connect(rpc);
    CosmosContext.CLIENT_MAP[name] = client;
    return client;
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
    if (!isCosmWasmChain(chainId)) {
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
}
