import { MsgExecuteContract } from '@terra-money/terra.js';
import { isNativeDenom } from '@certusone/wormhole-sdk/lib/cjs/terra';
import { hexToUint8Array } from '@certusone/wormhole-sdk';
import { TxInfo } from "@terra-money/terra.js";
import { bech32 } from "bech32";
import { zeroPad } from "ethers/lib/utils";

import { WormholeContext } from '../wormhole';
import { Context } from './contextAbstract';
import { TokenId, ChainName, ChainId, NATIVE } from '../types';

export class TerraContext<T extends WormholeContext> extends Context {
  readonly context: T;

  constructor(context: T) {
    super();
    this.context = context;
  }

  private async transferFromTerra(
    senderAddress: string,
    sendingChain: ChainName | ChainId,
    tokenAddress: string,
    amount: string,
    recipientChain: ChainId | ChainName,
    recipientAddress: Uint8Array,
    relayerFee: string = '0',
    payload?: Uint8Array,
  ): Promise<MsgExecuteContract[]> {
    const recipientChainId = this.context.resolveDomain(recipientChain);
    const nonce = Math.round(Math.random() * 100000);
    const isNativeAsset = isNativeDenom(tokenAddress);
    const bridgeAddress = this.context.mustGetBridge(sendingChain).address;
    const mk_initiate_transfer = (info: object) =>
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
              nonce: nonce,
              payload: payload,
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
              nonce: nonce,
            },
          };
    return isNativeAsset
      ? [
          new MsgExecuteContract(
            senderAddress,
            bridgeAddress,
            {
              deposit_tokens: {},
            },
            { [tokenAddress]: amount },
          ),
          new MsgExecuteContract(
            senderAddress,
            bridgeAddress,
            mk_initiate_transfer({
              native_token: {
                denom: tokenAddress,
              },
            }),
            {},
          ),
        ]
      : [
          new MsgExecuteContract(
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
          new MsgExecuteContract(
            senderAddress,
            bridgeAddress,
            mk_initiate_transfer({
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
  ): Promise<MsgExecuteContract[]> {
    if (token === NATIVE)
      throw new Error('Must send Token ID for Terra transfers');
    return await this.transferFromTerra(
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
  ): Promise<MsgExecuteContract[]> {
    if (token === NATIVE)
      throw new Error('Must send Token ID for Injective transfers');
    return await this.transferFromTerra(
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

  parseSequenceFromLog(receipt: TxInfo): string {
    const sequences = this.parseSequencesFromLog(receipt);
    if (sequences.length === 0) throw new Error('no sequence found in log');
    return sequences[0];
    // // Scan for the Sequence attribute in all the outputs of the transaction.
    // let sequence = '';
    // const jsonLog = JSON.parse(info.raw_log);
    // jsonLog.map((row: any) => {
    //   row.events.map((event: any) => {
    //     event.attributes.map((attribute: any) => {
    //       if (attribute.key === "message.sequence") {
    //         sequence = attribute.value.toString();
    //       }
    //     });
    //   });
    // });
    // return sequence;
  }

  parseSequencesFromLog(receipt: TxInfo): string[] {
    // Scan for the Sequence attribute in all the outputs of the transaction.
    // TODO: Make this not horrible.
    let sequences: string[] = [];
    const jsonLog = JSON.parse(receipt.raw_log);
    jsonLog.forEach((row: any) => {
      row.events.forEach((event: any) => {
        event.attributes.forEach((attribute: any) => {
          if (attribute.key === "message.sequence") {
            sequences.push(attribute.value.toString());
          }
        });
      });
    });
    return sequences;
  }

  getEmitterAddress(address: string): string {
    return Buffer.from(
      zeroPad(bech32.fromWords(bech32.decode(address).words), 32)
    ).toString("hex");
  }
}
