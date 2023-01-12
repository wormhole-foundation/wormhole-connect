import { WormholeContext } from '../wormhole';
import { Context } from './contextAbstract';
import { TokenId, ChainName, ChainId, NATIVE } from '../types';
import { MsgExecuteContract as MsgExecuteContractInjective } from '@injectivelabs/sdk-ts';
import {
  hexToUint8Array,
  isNativeDenomInjective,
} from '@certusone/wormhole-sdk';

export class InjectiveContext<T extends WormholeContext> extends Context {
  readonly context: T;

  constructor(context: T) {
    super();
    this.context = context;
  }

  private async transferFromInjective(
    senderAddress: string,
    sendingChain: ChainName | ChainId,
    tokenAddress: string,
    amount: string,
    recipientChain: ChainId | ChainName,
    recipientAddress: Uint8Array,
    relayerFee: string = '0',
    payload?: Uint8Array,
  ): Promise<MsgExecuteContractInjective[]> {
    const recipientChainId = this.context.resolveDomain(recipientChain);
    const nonce = Math.round(Math.random() * 100000);
    const isNativeAsset = isNativeDenomInjective(tokenAddress);
    const bridgeAddress = this.context.mustGetBridge(sendingChain).address;
    const mk_action: string = payload
      ? 'initiate_transfer_with_payload'
      : 'initiate_transfer';
    const mk_initiate_transfer = (info: object) =>
      payload
        ? {
            asset: {
              amount,
              info,
            },
            recipient_chain: recipientChainId,
            recipient: Buffer.from(recipientAddress).toString('base64'),
            fee: relayerFee,
            nonce,
            payload,
          }
        : {
            asset: {
              amount,
              info,
            },
            recipient_chain: recipientChainId,
            recipient: Buffer.from(recipientAddress).toString('base64'),
            fee: relayerFee,
            nonce,
          };
    return isNativeAsset
      ? [
          MsgExecuteContractInjective.fromJSON({
            contractAddress: bridgeAddress,
            sender: senderAddress,
            msg: {},
            action: 'deposit_tokens',
            funds: { denom: tokenAddress, amount },
          }),
          MsgExecuteContractInjective.fromJSON({
            contractAddress: bridgeAddress,
            sender: senderAddress,
            msg: mk_initiate_transfer({
              native_token: { denom: tokenAddress },
            }),
            action: mk_action,
          }),
        ]
      : [
          MsgExecuteContractInjective.fromJSON({
            contractAddress: tokenAddress,
            sender: senderAddress,
            msg: {
              spender: bridgeAddress,
              amount,
              expires: {
                never: {},
              },
            },
            action: 'increase_allowance',
          }),
          MsgExecuteContractInjective.fromJSON({
            contractAddress: bridgeAddress,
            sender: senderAddress,
            msg: mk_initiate_transfer({
              token: { contract_addr: tokenAddress },
            }),
            action: mk_action,
          }),
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
  ): Promise<MsgExecuteContractInjective[]> {
    if (token === NATIVE)
      throw new Error('Must send Token ID for Injective transfers');
    return await this.transferFromInjective(
      senderAddress,
      sendingChain,
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
  ): Promise<MsgExecuteContractInjective[]> {
    if (token === NATIVE)
      throw new Error('Must send Token ID for Injective transfers');
    return await this.transferFromInjective(
      senderAddress,
      sendingChain,
      token.address,
      amount,
      recipientChain,
      hexToUint8Array(recipientAddress),
      undefined,
      payload,
    );
  }
}
