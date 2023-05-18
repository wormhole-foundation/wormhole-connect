// import { SeiContracts } from './contracts';
import {
  cosmos,
  parseTokenTransferPayload,
  parseVaa,
} from '@certusone/wormhole-sdk';
import {
  CosmWasmClient,
  MsgExecuteContractEncodeObject,
} from '@cosmjs/cosmwasm-stargate';
import { decodeTxRaw } from '@cosmjs/proto-signing';
import { StargateClient, logs as cosmosLogs } from '@cosmjs/stargate';
import base58 from 'bs58';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import { BigNumber, BigNumberish } from 'ethers';
import {
  arrayify,
  base64,
  hexlify,
  zeroPad,
  hexStripZeros,
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
import { SeiContracts } from './contracts';

interface WrappedRegistryResponse {
  address: string;
}

const SEI_TRANSLATOR =
  'sei1dkdwdvknx0qav5cp5kw68mkn3r99m3svkyjfvkztwh97dv2lm0ksj6xrak';

export class SeiContext<
  T extends WormholeContext,
> extends TokenBridgeAbstract<any> {
  readonly type = Context.SEI;
  readonly contracts: SeiContracts<T>;

  private readonly DEFAULT_RPC: string =
    'https://rpc.atlantic-2.seinetwork.io/';
  private client?: StargateClient;
  private wasmClient?: CosmWasmClient;

  private readonly NATIVE_DENOM = 'usei';
  private readonly CHAIN = 'sei';

  constructor(private readonly context: T) {
    super();
    this.contracts = new SeiContracts<T>(context);
  }

  async send(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    relayerFee: string | undefined = '0',
  ): Promise<MsgExecuteContractEncodeObject[]> {
    if (token === 'native') throw new Error('Native token not supported');

    const destContext = this.context.getContext(recipientChain);
    const targetChain = this.context.toChainId(recipientChain);
    const targetAddress = Buffer.from(
      destContext.formatAddress(recipientAddress),
    ).toString('base64');

    const denom = this.CW20AddressToFactory(
      token.address === this.NATIVE_DENOM,
      await this.mustGetForeignAsset(token, sendingChain),
    );

    return [
      {
        typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
        value: MsgExecuteContract.fromPartial({
          sender: senderAddress,
          contract: SEI_TRANSLATOR,
          msg: Buffer.from(
            JSON.stringify({
              convert_and_transfer: {
                recipient_chain: targetChain,
                recipient: targetAddress,
                fee: relayerFee,
              },
            }),
          ),
          funds: [
            {
              denom,
              amount,
            },
          ],
        }),
      },
    ];
  }

  parseRelayerPayload(payload: Buffer): ParsedRelayerPayload {
    return {
      relayerPayloadId: payload.readUInt8(0),
      to: hexlify(payload.slice(33, 65)),
      relayerFee: BigNumber.from(0),
      toNativeTokenAmount: BigNumber.from(0),
    };
  }

  sendWithPayload(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    payload: any,
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }

  formatAddress(address: string): string {
    return hexlify(zeroPad(cosmos.canonicalAddress(address), 32));
  }

  parseAddress(address: any): string {
    const addr =
      typeof address === 'string' && address.startsWith('0x')
        ? Buffer.from(hexStripZeros(address).substring(2), 'hex')
        : address;
    return cosmos.humanAddress('sei', addr);
  }

  async formatAssetAddress(denom: string): Promise<Uint8Array> {
    const cw20Address = this.factoryToCW20(denom);
    return cosmos.canonicalAddress(cw20Address);
  }

  async parseAssetAddress(cw20Address: any): Promise<string> {
    return this.CW20AddressToFactory(false, cw20Address);
  }

  async getForeignAsset(
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<string | null> {
    const toChainId = this.context.toChainId(chain);
    const chainId = this.context.toChainId(tokenId.chain);
    if (toChainId === chainId) return tokenId.address;

    const wasmClient = await this.getCosmWasmClient();
    const { token_bridge: tokenBridgeAddress } =
      await this.contracts.mustGetContracts(this.CHAIN);
    if (!tokenBridgeAddress) throw new Error('Token bridge contract not found');

    const sourceContext = this.context.getContext(tokenId.chain);
    const tokenAddr = await sourceContext.formatAssetAddress(tokenId.address);
    // TODO: modify formatAssetAddress to return Uint8Array
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

  private searchLogs(
    key: string,
    logs: readonly cosmosLogs.Log[],
  ): string | null {
    for (const log of logs) {
      for (const ev of log.events) {
        for (const attr of ev.attributes) {
          if (attr.key === key) {
            return attr.value;
          }
        }
      }
    }
    return null;
  }

  async parseMessageFromTx(
    id: string,
    chain: ChainName | ChainId,
  ): Promise<ParsedMessage[] | ParsedRelayerMessage[]> {
    const client = await this.getCosmWasmClient();
    const tx = await client.getTx(id);
    if (!tx) throw new Error('tx not found');

    const decoded = decodeTxRaw(tx.tx);
    const sender = cosmos.humanAddress(
      'sei',
      decoded.authInfo.signerInfos[0].publicKey!.value,
    );

    // parse logs
    const logs = cosmosLogs.parseRawLog(tx.rawLog);

    // extract information wormhole contract logs
    const tokenTransferPayload = this.searchLogs('message.message', logs);
    const sequence = this.searchLogs('message.sequence', logs);
    const emitterAddress = this.searchLogs('message.sender', logs);

    if (!tokenTransferPayload || !sequence || !emitterAddress)
      throw new Error('No token transfer payload found');

    const parsed = parseTokenTransferPayload(
      Buffer.from(tokenTransferPayload, 'hex'),
    );

    const destContext = this.context.getContext(parsed.toChain as ChainId);
    const tokenContext = this.context.getContext(parsed.tokenChain as ChainId);

    const tokenAddress = await tokenContext.parseAssetAddress(
      hexlify(parsed.tokenAddress),
    );
    const tokenChain = this.context.toChainName(parsed.tokenChain);

    // let relayerInfo = {};
    // if (parsed.payloadType === TokenBridgePayload.TransferWithPayload) {
    //   const relayerPayload = parseTransfer
    // }

    return [
      {
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
        // payload: parsedTransfer.payload,
        // relayerPayloadId: parsedPayload.payloadId,
        // recipient: destContext.parseAddress(parsedPayload.targetRecipient),
        // relayerFee: parsedPayload.targetRelayerFee,
        // toNativeTokenAmount: parsedPayload.toNativeTokenAmount,
      },
    ];
  }

  async getNativeBalance(
    walletAddress: string,
    chain: ChainName | ChainId,
  ): Promise<BigNumber> {
    const client = await this.getStargateClient();
    const { amount } = await client.getBalance(
      walletAddress,
      this.NATIVE_DENOM,
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

    const denom = this.CW20AddressToFactory(
      tokenId.address === this.NATIVE_DENOM,
      assetAddress,
    );

    const client = await this.getCosmWasmClient();
    const { amount } = await client.getBalance(walletAddress, denom);
    return BigNumber.from(amount);
  }

  private CW20AddressToFactory(isNative: boolean, address: string): string {
    let denom = this.NATIVE_DENOM;
    if (!isNative) {
      const encodedAddress = base58.encode(cosmos.canonicalAddress(address));
      denom = `factory/${SEI_TRANSLATOR}/${encodedAddress}`;
    }
    return denom;
  }

  private factoryToCW20(denom: string): string {
    const encoded = denom.split('/')[2];
    if (!encoded) return '';
    return cosmos.humanAddress('sei', base58.decode(encoded));
  }

  async redeem(
    destChain: ChainName | ChainId,
    signedVAA: Uint8Array,
    overrides: any,
    payerAddr?: any,
  ): Promise<MsgExecuteContractEncodeObject[]> {
    return [
      {
        typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
        value: MsgExecuteContract.fromPartial({
          contract: SEI_TRANSLATOR,
          msg: Buffer.from(
            JSON.stringify({
              complete_transfer_and_convert: {
                vaa: base64.encode(signedVAA),
              },
            }),
          ),
        }),
      },
    ];
  }

  async fetchRedeemedEvent(
    emitterChainId: ChainId,
    emitterAddress: string,
    sequence: string,
  ) {
    const client = await this.getCosmWasmClient();
    const txs = await client.searchTx({
      tags: [
        {
          key: 'wasm.action',
          value: 'complete_transfer_wrapped',
        },
      ],
    });
    for (const tx of txs) {
      const decoded = decodeTxRaw(tx.tx);
      for (const msg of decoded.body.messages) {
        if (msg.typeUrl === '/cosmwasm.wasm.v1.MsgExecuteContract') {
          const parsed = MsgExecuteContract.decode(msg.value);
          const instruction = JSON.parse(Buffer.from(parsed.msg).toString());
          const base64Vaa = instruction?.complete_transfer_and_convert?.vaa;
          if (base64Vaa) {
            const vaa = parseVaa(base64.decode(base64Vaa));
            if (
              vaa.emitterChain === emitterChainId &&
              hexlify(vaa.emitterAddress) === emitterAddress &&
              vaa.sequence === BigInt(sequence)
            ) {
              return tx.hash;
            }
          }
        }
      }
    }
    return null;
  }

  async isTransferCompleted(
    destChain: ChainName | ChainId,
    signedVaa: string,
  ): Promise<boolean> {
    const { token_bridge: tokenBridgeAddress } =
      this.contracts.mustGetContracts(this.CHAIN);
    if (!tokenBridgeAddress) throw new Error('Token bridge contract not found');
    const client = await this.getCosmWasmClient();
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
    const client = await this.getCosmWasmClient();
    const { decimals } = await client.queryContractSmart(tokenAddr, {
      token_info: {},
    });
    return decimals;
  }

  private async getStargateClient(): Promise<StargateClient> {
    if (!this.client) {
      this.client = await StargateClient.connect(
        this.context.conf.rpcs.sei || this.DEFAULT_RPC,
      );
    }
    return this.client;
  }

  private async getCosmWasmClient(): Promise<CosmWasmClient> {
    if (!this.wasmClient) {
      this.wasmClient = await CosmWasmClient.connect(
        this.context.conf.rpcs.sei || this.DEFAULT_RPC,
      );
    }
    return this.wasmClient;
  }

  async calculateNativeTokenAmt(
    destChain: ChainName | ChainId,
    tokenId: TokenId,
    amount: BigNumberish,
    walletAddress: string,
  ): Promise<BigNumber> {
    return BigNumber.from(0);
  }
}
