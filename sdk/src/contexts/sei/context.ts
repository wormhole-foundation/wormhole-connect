import {
  CHAIN_ID_SEI,
  WormholeWrappedInfo,
  buildTokenId,
  cosmos,
  hexToUint8Array,
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
import axios from 'axios';
import base58 from 'bs58';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import { BigNumber, BigNumberish } from 'ethers';
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
  NATIVE,
  ParsedMessage,
  ParsedRelayerMessage,
  ParsedRelayerPayload,
  TokenId,
} from '../../types';
import { ForeignAssetCache, stripHexPrefix } from '../../utils';
import { WormholeContext } from '../../wormhole';
import { TokenBridgeAbstract } from '../abstracts/tokenBridge';
import { SeiContracts } from './contracts';

interface WrappedRegistryResponse {
  address: string;
}

interface QueryExternalIdResponse {
  token_id: {
    Bank?: {
      denom: string;
    };
    Contract?: {
      NativeCW20?: {
        contract_address: string;
      };
      ForeignToken?: {
        chain_id: number;
        // base64 encoded address
        foreign_address: string;
      };
    };
  };
}

export interface CosmosAssetInfo {
  // The asset is native to the chain
  isNative: boolean;
  // The asset is a native denomination and not a contract (e.g. CW20)
  isDenom: boolean;
  // The asset's address or denomination
  address: string;
}

export interface SeiTransaction {
  fee: StdFee | 'auto' | 'number';
  msgs: EncodeObject[];
  memo: string;
}

interface SeiTranslatorTransferPayload {
  receiver?: string;
  payload?: Uint8Array;
}

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

/**
 * Implements token bridge transfers to and from Sei
 *
 * The Sei blockchain provides a feature through its `tokenfactory`
 * ([docs](https://github.com/sei-protocol/sei-chain/tree/master/x/tokenfactory))
 * module that allows the creation of native denominations through
 * a special message.
 *
 * In order to take leverage this feature to provide a native
 * counterpart to bridged assets, a special relayer contract called
 * "token translator" is deployed on Sei
 * (refer [here](https://github.com/wormhole-foundation/example-sei-token-translator/)
 * for the reference implementation)
 *
 * The translator contract works the same
 * way as relayers on other chains, although it uses a different payload
 * structure than the others and has no native drop off features.
 *
 * As an additional step to the bridge process, the translator contract receives
 * the tokens and locks them, minting to the actual recipient an equivalent
 * amount of the native denomination created through the tokenfactory module.
 * In order to transfer the tokens out of Sei, the user can then use the
 * `convert_and_transfer` message of the token translator contract, which will burn
 * the native denomination and send the locked CW20 tokens through the usual bridge process
 * The contract also offers a message that allows burning the native denomination
 * and receive the CW20 tokens back on a sei account, without going through
 * the bridging process, but such message is not implemented on WH Connect.
 *
 * A mayor drawback of this implementation is that the translator contract does not support
 * transferring native Sei assets (usei denom or cw20 tokens) in or out. For these cases,
 * the traditional token bridge process is used
 */
export class SeiContext<
  T extends WormholeContext,
> extends TokenBridgeAbstract<SeiTransaction> {
  readonly type = Context.SEI;
  readonly contracts: SeiContracts<T>;
  private foreignAssetCache: ForeignAssetCache;

  private wasmClient?: CosmWasmClient;

  private readonly NATIVE_DENOM = 'usei';
  private readonly CHAIN = 'sei';
  private readonly REDEEM_EVENT_DEFAULT_MAX_BLOCKS = 2000;

  constructor(
    protected readonly context: T,
    foreignAssetCache: ForeignAssetCache,
  ) {
    super();
    this.contracts = new SeiContracts<T>(context);
    this.foreignAssetCache = foreignAssetCache;
  }

  protected async getTxGasFee(
    txId: string,
    chain: ChainName | ChainId,
  ): Promise<BigNumber | undefined> {
    throw new Error('not implemented');
  }

  async send(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    relayerFee: string | undefined = '0',
  ): Promise<SeiTransaction> {
    if (token === 'native') throw new Error('Native token not supported');

    const destContext = this.context.getContext(recipientChain);
    const targetChain = this.context.toChainId(recipientChain);

    const targetAddress = Buffer.from(
      destContext.formatAddress(recipientAddress),
    ).toString('base64');

    const wrappedAssetAddress = await this.mustGetForeignAsset(
      token,
      sendingChain,
    );

    const isNative = token.address === this.NATIVE_DENOM;

    let msgs = [];
    if (isNative) {
      msgs = this.createInitiateNativeTransferMessages(
        senderAddress,
        targetChain,
        targetAddress,
        relayerFee,
        amount,
      );
    } else {
      const isTranslated = await this.isTranslatedToken(wrappedAssetAddress);
      msgs = isTranslated
        ? this.createConvertAndTransferMessage(
            senderAddress,
            targetChain,
            targetAddress,
            relayerFee,
            { denom: this.CW20AddressToFactory(wrappedAssetAddress), amount },
          )
        : this.createInitiateTokenTransferMessages(
            senderAddress,
            targetChain,
            targetAddress,
            relayerFee,
            wrappedAssetAddress,
            amount,
          );
    }

    // TODO: find a way to simulate
    const fee = calculateFee(1000000, '0.1usei');

    return {
      msgs,
      fee,
      memo: 'Wormhole - Initiate Transfer',
    };
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

  /**
   * @param tokenAddress The cw20 token address
   * @returns Whether there exists a native denomination created by the translator contract for the given token
   */
  async isTranslatedToken(tokenAddress: string): Promise<boolean> {
    if (!this.context.conf.rest.sei) throw new Error('Sei rest not configured');
    const resp = await axios.get(
      `${new URL(
        this.context.conf.rest.sei,
      )}sei-protocol/seichain/tokenfactory/denoms_from_creator/${this.getTranslatorAddress()}`,
    );
    const denoms: string[] = resp.data.denoms || [];
    const encoded = this.CW20AddressToFactory(tokenAddress);
    return !!denoms.find((d) => d === encoded);
  }

  private createInitiateNativeTransferMessages(
    senderAddress: string,
    targetChain: ChainId,
    targetAddress: string,
    relayerFee: string,
    amount: string,
  ): EncodeObject[] {
    const tokenBridge = this.getTokenBridgeAddress();

    const nonce = Math.round(Math.random() * 100000);

    return [
      buildExecuteMsg(
        senderAddress,
        tokenBridge,
        {
          deposit_tokens: {},
        },
        [{ denom: this.NATIVE_DENOM, amount }],
      ),
      buildExecuteMsg(senderAddress, tokenBridge, {
        initiate_transfer: {
          asset: {
            amount,
            info: { native_token: { denom: this.NATIVE_DENOM } },
          },
          recipient_chain: targetChain,
          recipient: targetAddress,
          fee: relayerFee,
          nonce,
        },
      }),
    ];
  }

  private createInitiateTokenTransferMessages(
    senderAddress: string,
    targetChain: ChainId,
    targetAddress: string,
    relayerFee: string,
    tokenAddress: string,
    amount: string,
  ): EncodeObject[] {
    const tokenBridge = this.getTokenBridgeAddress();

    const nonce = Math.round(Math.random() * 1000000);

    return [
      buildExecuteMsg(senderAddress, tokenAddress, {
        increase_allowance: {
          spender: tokenBridge,
          amount,
          expires: {
            never: {},
          },
        },
      }),
      buildExecuteMsg(senderAddress, tokenBridge, {
        initiate_transfer: {
          asset: {
            amount,
            info: { token: { contract_addr: tokenAddress } },
          },
          recipient_chain: targetChain,
          recipient: targetAddress,
          fee: relayerFee,
          nonce,
        },
      }),
    ];
  }

  private createConvertAndTransferMessage(
    senderAddress: string,
    targetChain: ChainId,
    targetAddress: string,
    relayerFee: string,
    coin: Coin,
  ): EncodeObject[] {
    return [
      buildExecuteMsg(
        senderAddress,
        this.getTranslatorAddress(),
        {
          convert_and_transfer: {
            recipient_chain: targetChain,
            recipient: targetAddress,
            fee: relayerFee,
          },
        },
        [coin],
      ),
    ];
  }

  getTranslatorAddress(): string {
    const { seiTokenTranslator: translatorAddress } =
      this.contracts.mustGetContracts('sei');
    if (!translatorAddress) throw new Error('no translator address found');
    return translatorAddress;
  }

  getTokenBridgeAddress(): string {
    const { token_bridge: tokenBridge } =
      this.contracts.mustGetContracts('sei');
    if (!tokenBridge) throw new Error('no token bridge found');
    return tokenBridge;
  }

  parseRelayerPayload(payload: Buffer): ParsedRelayerPayload {
    const body = JSON.parse(payload.toString());
    const recipientAddress = Buffer.from(
      body.basic_recipient.recipient,
      'base64',
    ).toString();
    return {
      relayerPayloadId: 0,
      to: hexlify(this.formatAddress(recipientAddress)),
      relayerFee: BigNumber.from(0),
      toNativeTokenAmount: BigNumber.from(0),
    };
  }

  async sendWithRelay(
    token: TokenId | 'native',
    amount: string,
    toNativeToken: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    relayerFee?: string,
  ): Promise<any> {
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
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }

  formatAddress(address: string): Uint8Array {
    return arrayify(zeroPad(cosmos.canonicalAddress(address), 32));
  }

  parseAddress(address: any): string {
    const addr =
      typeof address === 'string' && address.startsWith('0x')
        ? Buffer.from(hexStripZeros(address).substring(2), 'hex')
        : address;
    return cosmos.humanAddress('sei', addr);
  }

  /**
   * @param addressOrDenom CW20 token address or bank denomination
   * @returns The external address associated with the asset address
   */
  async formatAssetAddress(addressOrDenom: string): Promise<Uint8Array> {
    if (addressOrDenom === this.NATIVE_DENOM) {
      return Buffer.from(this.buildNativeId(), 'hex');
    }

    // TODO: I think this is not how the external id is calculated
    // see getOriginalAsset for other cosmos chains in the sdk
    const cw20Address = addressOrDenom.startsWith('factory')
      ? this.factoryToCW20(addressOrDenom)
      : addressOrDenom;
    return zeroPad(cosmos.canonicalAddress(cw20Address), 32);
  }

  private buildNativeId(): string {
    return (
      '01' + keccak256(Buffer.from(this.NATIVE_DENOM, 'utf-8')).substring(4)
    );
  }

  /**
   * Builds the information required to send the tokens through the translator
   * contract relay process in order to receive a native denomination on the Sei chain
   *
   * @param token The token or native coin to send
   * @param recipient The final recipient address
   * @returns The receiver and payload necessary to send
   * the tokens through the translator contract relay
   */
  async buildSendPayload(
    token: TokenId | 'native',
    recipient: string,
  ): Promise<SeiTranslatorTransferPayload> {
    // if the token is originally from sei (e.g. native denom or cw20 token)
    // then it has to go through the token bridge and not the translator contract
    if (token !== 'native' && token.chain === 'sei') {
      return {};
    }

    return {
      receiver: this.getTranslatorAddress(),
      payload: new Uint8Array(
        Buffer.from(
          JSON.stringify({
            basic_recipient: {
              recipient: Buffer.from(recipient).toString('base64'),
            },
          }),
        ),
      ),
    };
  }

  /**
   * @param externalId The asset's external id
   * @returns The asset's CW20 token address or the bank denomination associated with the external address
   */
  async parseAssetAddress(externalId: string): Promise<string> {
    const info = await this.queryExternalId(externalId);

    if (!info) throw new Error('Asset not found');

    const { address, isDenom } = info;
    if (isDenom) return address;

    const isTranslated = await this.isTranslatedToken(address);
    return isTranslated
      ? this.CW20AddressToFactory(address)
      : this.parseAddress(address);
  }

  /**
   * @param externalId An external id representing an asset
   * @returns Information about the asset including its address/denom and whether it is native to this chain
   */
  async queryExternalId(externalId: string): Promise<CosmosAssetInfo | null> {
    const wasmClient = await this.getCosmWasmClient();
    const { token_bridge: tokenBridgeAddress } =
      await this.contracts.mustGetContracts(this.CHAIN);
    if (!tokenBridgeAddress) throw new Error('Token bridge contract not found');

    try {
      const response: QueryExternalIdResponse =
        await wasmClient.queryContractSmart(tokenBridgeAddress, {
          external_id: {
            external_id: Buffer.from(
              stripHexPrefix(externalId),
              'hex',
            ).toString('base64'),
          },
        });

      if (response.token_id.Bank) {
        return {
          isNative: true,
          isDenom: true,
          address: response.token_id.Bank.denom,
        };
      }

      if (response.token_id.Contract?.NativeCW20) {
        return {
          isNative: true,
          isDenom: false,
          address: response.token_id.Contract.NativeCW20.contract_address,
        };
      }

      if (response.token_id.Contract?.ForeignToken) {
        return {
          isNative: false,
          isDenom: false,
          address: response.token_id.Contract.ForeignToken.foreign_address,
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  async getOriginalAssetSei(
    wrappedAddress: string,
  ): Promise<WormholeWrappedInfo> {
    const chainId = CHAIN_ID_SEI;
    if (isNativeCosmWasmDenom(chainId, wrappedAddress)) {
      return {
        isWrapped: false,
        chainId,
        assetAddress: hexToUint8Array(buildTokenId(chainId, wrappedAddress)),
      };
    }
    try {
      const client = await this.getCosmWasmClient();
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
      assetAddress: hexToUint8Array(buildTokenId(chainId, wrappedAddress)),
    };
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

    const wasmClient = await this.getCosmWasmClient();
    const { token_bridge: tokenBridgeAddress } =
      await this.contracts.mustGetContracts(this.CHAIN);
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

  /**
   * Search for a specific piece of information emitted by the contracts during the transaction
   * For example: to retrieve the bridge transfer recipient, we would have to look
   * for the "transfer.recipient" under the "wasm" event
   */
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

  async getMessage(
    id: string,
    chain: ChainName | ChainId,
    parseRelayerPayload: boolean = true,
  ): Promise<ParsedMessage | ParsedRelayerMessage> {
    const client = await this.getCosmWasmClient();
    const tx = await client.getTx(id);
    if (!tx) throw new Error('tx not found');

    // parse logs emitted for the tx execution
    const logs = cosmosLogs.parseRawLog(tx.rawLog);

    // extract information wormhole contract logs
    // - message.message: the vaa payload (i.e. the transfer information)
    // - message.sequence: the vaa's sequence number
    // - message.sender: the vaa's emitter address
    const tokenTransferPayload = this.searchLogs('message.message', logs);
    if (!tokenTransferPayload)
      throw new Error('message/transfer payload not found');
    const sequence = this.searchLogs('message.sequence', logs);
    if (!sequence) throw new Error('sequence not found');
    const emitterAddress = this.searchLogs('message.sender', logs);
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

  async getNativeBalance(
    walletAddress: string,
    chain: ChainName | ChainId,
  ): Promise<BigNumber> {
    return this.getDenomBalance(walletAddress, this.NATIVE_DENOM);
  }

  async getTokenBalance(
    walletAddress: string,
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<BigNumber | null> {
    const assetAddress = await this.getForeignAsset(tokenId, chain);
    if (!assetAddress) return null;

    if (assetAddress === this.NATIVE_DENOM) {
      return this.getNativeBalance(walletAddress, chain);
    }

    const isTranslated = await this.isTranslatedToken(assetAddress);
    if (isTranslated) {
      return this.getDenomBalance(
        walletAddress,
        this.CW20AddressToFactory(assetAddress),
      );
    }

    const client = await this.getCosmWasmClient();
    const { balance } = await client.queryContractSmart(assetAddress, {
      balance: { address: walletAddress },
    });
    return BigNumber.from(balance);
  }

  async getTokenBalances(
    walletAddr: string,
    tokenIds: TokenId[],
    chain: ChainName | ChainId,
  ): Promise<(BigNumber | null)[]> {
    return await Promise.all(
      tokenIds.map((tokenId) =>
        this.getTokenBalance(walletAddr, tokenId, chain),
      ),
    );
  }

  async getDenomBalance(
    walletAddress: string,
    denom: string,
  ): Promise<BigNumber> {
    const client = await this.getCosmWasmClient();
    const { amount } = await client.getBalance(walletAddress, denom);
    return BigNumber.from(amount);
  }

  private CW20AddressToFactory(address: string): string {
    const encodedAddress = base58.encode(cosmos.canonicalAddress(address));
    return `factory/${this.getTranslatorAddress()}/${encodedAddress}`;
  }

  private factoryToCW20(denom: string): string {
    if (!denom.startsWith('factory/')) return '';
    const encoded = denom.split('/')[2];
    if (!encoded) return '';
    return cosmos.humanAddress('sei', base58.decode(encoded));
  }

  async redeem(
    destChain: ChainName | ChainId,
    signedVAA: Uint8Array,
    overrides: any,
    payerAddr?: any,
  ): Promise<SeiTransaction> {
    const vaa = parseVaa(signedVAA);
    const transfer = parseTokenTransferPayload(vaa.payload);

    // transfer to comes as a 32 byte array, but cosmos addresses are 20 bytes
    const recipient = cosmos.humanAddress('sei', transfer.to.slice(12));

    const msgs =
      recipient === this.getTranslatorAddress()
        ? [
            buildExecuteMsg(
              payerAddr || recipient,
              this.getTranslatorAddress(),
              {
                complete_transfer_and_convert: {
                  vaa: base64.encode(signedVAA),
                },
              },
            ),
          ]
        : [
            buildExecuteMsg(
              payerAddr || recipient,
              this.getTokenBridgeAddress(),
              {
                submit_vaa: {
                  data: base64.encode(signedVAA),
                },
              },
            ),
          ];

    const fee = calculateFee(1000000, '0.1usei');

    return {
      msgs,
      fee,
      memo: 'Wormhole - Complete Transfer',
    };
  }

  async fetchRedeemedEvent(
    emitterChainId: ChainId,
    emitterAddress: string,
    sequence: string,
  ) {
    // search a max of blocks backwards, amplify the search only if nothing was found
    let res = await this.fetchRedeemedEventInner(
      emitterChainId,
      emitterAddress,
      sequence,
      this.REDEEM_EVENT_DEFAULT_MAX_BLOCKS,
    );

    if (!res) {
      res = await this.fetchRedeemedEventInner(
        emitterChainId,
        emitterAddress,
        sequence,
      );
    }

    return res;
  }

  private async fetchRedeemedEventInner(
    emitterChainId: ChainId,
    emitterAddress: string,
    sequence: string,
    maxBlocks?: number,
  ) {
    const client = await this.getCosmWasmClient();

    // there is no direct way to find the transaction through the chain/emitter/sequence identificator
    // so we need to search for all the transactions that completed a transfer
    // and pick out the one which has a VAA parameter that matches the chain/emitter/sequence we need
    const txs = await client.searchTx([
      {
        key: 'wasm.action',
        value: 'complete_transfer_wrapped',
      },
    ]);
    for (const tx of txs) {
      const decoded = decodeTxRaw(tx.tx);
      for (const msg of decoded.body.messages) {
        if (msg.typeUrl === MSG_EXECUTE_CONTRACT_TYPE_URL) {
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
    if (tokenAddr === this.NATIVE_DENOM) return 6;
    const client = await this.getCosmWasmClient();
    const { decimals } = await client.queryContractSmart(tokenAddr, {
      token_info: {},
    });
    return decimals;
  }

  private async getCosmWasmClient(): Promise<CosmWasmClient> {
    if (!this.wasmClient) {
      if (!this.context.conf.rpcs.sei)
        throw new Error('Sei RPC not configured');
      this.wasmClient = await CosmWasmClient.connect(
        this.context.conf.rpcs.sei,
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

  async getCurrentBlock(): Promise<number> {
    const client = await this.getCosmWasmClient();
    return client.getHeight();
  }

  async getWrappedNativeTokenId(chain: ChainName | ChainId): Promise<TokenId> {
    throw new Error('not implemented');
  }
}
