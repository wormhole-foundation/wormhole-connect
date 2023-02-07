import { FunctionCallOptions } from 'near-api-js/lib/account';
import {
  getIsWrappedAssetNear,
  uint8ArrayToHex,
} from '@certusone/wormhole-sdk';
import { Account, connect } from 'near-api-js';
import BN from 'bn.js';
import { arrayify, sha256 } from 'ethers/lib/utils';
import { WormholeContext } from '../wormhole';
import { Context } from './contextAbstract';
import { TokenId, ChainName, ChainId, NATIVE } from '../types';

export class NearContext<T extends WormholeContext> extends Context {
  readonly context: T;

  constructor(context: T) {
    super();
    this.context = context;
  }

  async getProvider(
    chain: ChainName | ChainId,
    senderAddr: string,
  ): Promise<Account> {
    const networkName = this.context.resolveDomainName(chain) as ChainName;
    const rpc = this.context.conf.rpcs[networkName];
    if (!rpc) throw new Error(`No connection available for ${networkName}`);
    const provider = (
      await connect({
        networkId: this.context.conf.env === 'MAINNET' ? 'mainnet' : 'testnet',
        nodeUrl: rpc,
      })
    ).account(senderAddr);
    return provider;
  }

  private async transferNativeNear(
    account: Account,
    sendingChain: ChainName | ChainId,
    amount: string,
    recipientChain: ChainId | ChainName,
    recipientAddress: string,
    relayerFee: string = '0',
    payload?: Uint8Array,
  ): Promise<FunctionCallOptions[]> {
    const coreBridge = this.context.mustGetCore(sendingChain).address;
    const tokenBridge = this.context.mustGetBridge(sendingChain).address;
    let message_fee = await account.viewFunction(coreBridge, 'message_fee', {});

    const transferMsg: FunctionCallOptions = {
      contractId: tokenBridge,
      methodName: 'send_transfer_near',
      args: {
        receiver: recipientAddress,
        chain: recipientChain,
        fee: relayerFee,
        payload: payload,
        message_fee: message_fee,
      },
      attachedDeposit: new BN(amount).add(new BN(message_fee)),
      gas: new BN('100000000000000'),
    };
    return [transferMsg];
  }

  private async transferFromNear(
    account: Account,
    sendingChain: ChainName | ChainId,
    tokenAddress: string,
    amount: string,
    recipientChain: ChainId | ChainName,
    recipientAddress: string,
    relayerFee: string = '0',
    payload?: Uint8Array,
  ): Promise<FunctionCallOptions[]> {
    const coreBridge = this.context.mustGetBridge(sendingChain).address;
    const tokenBridge = this.context.mustGetBridge(sendingChain).address;
    let isWrapped = getIsWrappedAssetNear(tokenBridge, tokenAddress);

    let message_fee = await account.viewFunction(coreBridge, 'message_fee', {});

    if (isWrapped) {
      const transferMsg: FunctionCallOptions = {
        contractId: tokenBridge,
        methodName: 'send_transfer_wormhole_token',
        args: {
          token: tokenAddress,
          amount,
          receiver: recipientAddress,
          chain: recipientChain,
          fee: relayerFee,
          payload: payload,
          message_fee: message_fee,
        },
        attachedDeposit: new BN(message_fee + 1),
        gas: new BN('100000000000000'),
      };
      return [transferMsg];
      // return await account.functionCall(transferMsg);
    } else {
      const msgs: FunctionCallOptions[] = [];
      let bal = await account.viewFunction(tokenAddress, 'storage_balance_of', {
        account_id: tokenBridge,
      });
      if (bal === null) {
        // Looks like we have to stake some storage for this asset
        // for the token bridge...
        msgs.push({
          contractId: tokenAddress,
          methodName: 'storage_deposit',
          args: { account_id: tokenBridge, registration_only: true },
          gas: new BN('100000000000000'),
          attachedDeposit: new BN('2000000000000000000000'), // 0.002 NEAR
        });
      }

      if (message_fee > 0) {
        let bank = await account.viewFunction(tokenBridge, 'bank_balance', {
          acct: account.accountId,
        });

        if (!bank[0]) {
          msgs.push({
            contractId: tokenBridge,
            methodName: 'register_bank',
            args: {},
            gas: new BN('100000000000000'),
            attachedDeposit: new BN('2000000000000000000000'), // 0.002 NEAR
          });
        }

        if (bank[1] < message_fee) {
          msgs.push({
            contractId: tokenBridge,
            methodName: 'fill_bank',
            args: {},
            gas: new BN('100000000000000'),
            attachedDeposit: new BN(message_fee),
          });
        }
      }

      msgs.push({
        contractId: tokenAddress,
        methodName: 'ft_transfer_call',
        args: {
          receiver_id: tokenBridge,
          amount,
          msg: JSON.stringify({
            receiver: recipientAddress,
            chain: recipientChain,
            fee: relayerFee,
            payload: payload,
            message_fee: message_fee,
          }),
        },
        attachedDeposit: new BN(1),
        gas: new BN('100000000000000'),
      });
      return msgs;
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
  ): Promise<FunctionCallOptions[]> {
    const provider = await this.getProvider(sendingChain, senderAddress);
    if (token === NATIVE) {
      return await this.transferNativeNear(
        provider,
        sendingChain,
        amount,
        recipientChain,
        recipientAddress,
        relayerFee,
      );
    } else {
      return await this.transferFromNear(
        provider,
        sendingChain,
        token.address,
        amount,
        recipientChain,
        recipientAddress,
        relayerFee,
      );
    }
  }

  async sendWithPayload(
    token: TokenId | typeof NATIVE,
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    payload: Uint8Array | Buffer,
  ): Promise<FunctionCallOptions[]> {
    const provider = await this.getProvider(sendingChain, senderAddress);
    if (token === NATIVE) {
      return await this.transferNativeNear(
        provider,
        sendingChain,
        amount,
        recipientChain,
        recipientAddress,
        undefined,
        payload,
      );
    } else {
      return await this.transferFromNear(
        provider,
        sendingChain,
        token.address,
        amount,
        recipientChain,
        recipientAddress,
        undefined,
        payload,
      );
    }
  }

  formatAddress(address: string): string {
    return uint8ArrayToHex(arrayify(sha256(Buffer.from(address, 'utf8'))));
  }
}
