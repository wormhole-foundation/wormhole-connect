import { createNonce, isValidAptosType } from '@certusone/wormhole-sdk';
import { ethers } from 'ethers';
import { WormholeContext } from '../wormhole';
import { Context } from './contextAbstract';
import { TokenId, ChainName, ChainId, NATIVE } from '../types';
import { Types } from 'aptos';

export class AptosContext<T extends WormholeContext> extends Context {
  readonly context: T;

  constructor(context: T) {
    super();
    this.context = context;
  }

  async send(
    token: TokenId | typeof NATIVE,
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    relayerFee: ethers.BigNumberish = 0,
  ): Promise<Types.EntryFunctionPayload> {
    if (token === NATIVE)
      throw new Error('Must send Token ID for Aptos transfers');
    const tokenBridgeAddress = this.context.mustGetBridge(sendingChain);
    if (!isValidAptosType(token.address)) {
      throw new Error('Invalid qualified type');
    }
    const recipientChainId = this.context.resolveDomain(recipientChain);
    const nonce = createNonce().readUInt32LE(0);

    return {
      function: `${tokenBridgeAddress}::transfer_tokens::transfer_tokens_entry`,
      type_arguments: [token.address],
      arguments: [
        amount,
        recipientChainId,
        recipientAddress,
        relayerFee,
        nonce,
      ],
    };
  }

  async sendWithPayload(
    token: TokenId | typeof NATIVE,
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    payload: Uint8Array,
  ): Promise<void> {
    throw new Error('Transfer with payload are not yet supported in the sdk');
  }
}
