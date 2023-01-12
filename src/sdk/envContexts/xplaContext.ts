import { WormholeContext } from '../wormhole';
import { Context } from './contextAbstract';
import { TokenId, ChainName, ChainId, NATIVE } from '../types';
import { MsgExecuteContract as XplaMsgExecuteContract } from '@xpla/xpla.js';
import { hexToUint8Array, isNativeDenomXpla } from '@certusone/wormhole-sdk';

export class XplaContext<T extends WormholeContext> extends Context {
  readonly context: T;

  constructor(context: T) {
    super();
    this.context = context;
  }

  private async transferFromXpla(
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    tokenAddress: string,
    amount: string,
    recipientChain: ChainId | ChainName,
    recipientAddress: Uint8Array,
    relayerFee: string = '0',
    payload?: Uint8Array,
  ): Promise<XplaMsgExecuteContract[]> {
    const recipientChainId = this.context.resolveDomain(recipientChain);
    const nonce = Math.round(Math.random() * 100000);
    const isNativeAsset = isNativeDenomXpla(tokenAddress);
    const bridgeAddress = this.context.mustGetBridge(sendingChain).address;
    const createInitiateTransfer = (info: object) =>
      payload
        ? {
            initiate_transfer_with_payload: {
              asset: {
                amount,
                info,
              },
              recipient_chain: recipientChainId,
              recipient: Buffer.from(recipientAddress).toString('base64'),
              fee: relayerFee,
              nonce,
              payload,
            },
          }
        : {
            initiate_transfer: {
              asset: {
                amount,
                info,
              },
              recipient_chain: recipientChainId,
              recipient: Buffer.from(recipientAddress).toString('base64'),
              fee: relayerFee,
              nonce,
            },
          };
    return isNativeAsset
      ? [
          new XplaMsgExecuteContract(
            senderAddress,
            bridgeAddress,
            {
              deposit_tokens: {},
            },
            { [tokenAddress]: amount },
          ),
          new XplaMsgExecuteContract(
            senderAddress,
            bridgeAddress,
            createInitiateTransfer({
              native_token: {
                denom: tokenAddress,
              },
            }),
            {},
          ),
        ]
      : [
          new XplaMsgExecuteContract(
            senderAddress,
            tokenAddress,
            {
              increase_allowance: {
                spender: bridgeAddress,
                amount: amount,
                expires: {
                  never: {},
                },
              },
            },
            {},
          ),
          new XplaMsgExecuteContract(
            senderAddress,
            bridgeAddress,
            createInitiateTransfer({
              token: {
                contract_addr: tokenAddress,
              },
            }),
            {},
          ),
        ];
  }

  async send(
    token: TokenId | typeof NATIVE,
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    relayerFee?: string,
  ): Promise<XplaMsgExecuteContract[]> {
    if (token === NATIVE)
      throw new Error('Must send Token ID for Injective transfers');
    return await this.transferFromXpla(
      sendingChain,
      senderAddress,
      token.address,
      amount,
      recipientChain,
      hexToUint8Array(recipientAddress),
      relayerFee,
    );
  }

  async sendWithPayload(
    token: TokenId | typeof NATIVE,
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    payload: Uint8Array | Buffer,
  ): Promise<XplaMsgExecuteContract[]> {
    if (token === NATIVE)
      throw new Error('Must send Token ID for Injective transfers');
    return await this.transferFromXpla(
      sendingChain,
      senderAddress,
      token.address,
      amount,
      recipientChain,
      hexToUint8Array(recipientAddress),
      undefined,
      payload,
    );
  }
}
