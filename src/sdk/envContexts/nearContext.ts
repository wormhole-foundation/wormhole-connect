import { WormholeContext } from '../wormhole';
import { Context } from './contextAbstract';
import { TokenId, ChainName, ChainId, NATIVE } from '../types';
import { FunctionCallOptions } from 'near-api-js/lib/account';
import {
  getIsWrappedAssetNear,
  Network as Environment,
} from '@certusone/wormhole-sdk';
import { Account, connect } from 'near-api-js';
import BN from 'bn.js';
import { FinalExecutionOutcome } from 'near-api-js/lib/providers';
import { Wallet } from '@near-wallet-selector/core/lib/wallet';
import { setupWalletSelector } from '@near-wallet-selector/core';
import { setupDefaultWallets } from '@near-wallet-selector/default-wallets';
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet';
import { setupNearWallet } from '@near-wallet-selector/near-wallet';
import { setupNightly } from '@near-wallet-selector/nightly';
import { setupSender } from '@near-wallet-selector/sender';
import { setupMathWallet } from '@near-wallet-selector/math-wallet';
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet';
const NEAR_EVENT_PREFIX = "EVENT_JSON:";

async function getNearWallet(env: Environment) {
  return await setupWalletSelector({
    network: env === 'MAINNET' ? 'mainnet' : 'testnet',
    modules: [
      ...(await setupDefaultWallets()),
      setupNearWallet(),
      setupMyNearWallet(),
      setupSender(),
      setupMathWallet(),
      setupNightly(),
      setupMeteorWallet(),
    ],
    debug: true,
  });
}

export const signAndSendTransactions = async (
  account: Account,
  wallet: Wallet,
  messages: FunctionCallOptions[],
): Promise<FinalExecutionOutcome> => {
  // the browser wallet's signAndSendTransactions call navigates away from the page which is incompatible with the current app design
  if (account) {
    let lastReceipt: FinalExecutionOutcome | null = null;
    for (const message of messages) {
      lastReceipt = await account.functionCall(message);
    }
    if (!lastReceipt) {
      throw new Error('An error occurred while fetching the transaction info');
    }
    return lastReceipt;
  }
  const receipts = await wallet.signAndSendTransactions({
    transactions: messages.map((options) => ({
      signerId: wallet.id,
      receiverId: options.contractId,
      actions: [
        {
          type: 'FunctionCall',
          params: {
            methodName: options.methodName,
            args: options.args,
            gas: options.gas?.toString() || '0',
            deposit: options.attachedDeposit?.toString() || '0',
          },
        },
      ],
    })),
  });
  if (!receipts || receipts.length === 0) {
    throw new Error('An error occurred while fetching the transaction info');
  }
  return receipts[receipts.length - 1];
};

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

  async getWallet() {
    const walletSelector = await getNearWallet(this.context.conf.env);
    return await walletSelector.wallet();
  }

  private async transferNativeNear(
    account: Account,
    sendingChain: ChainName | ChainId,
    amount: string,
    recipientChain: ChainId | ChainName,
    recipientAddress: string,
    relayerFee: string = '0',
    payload?: Uint8Array,
  ): Promise<FinalExecutionOutcome> {
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
    return await account.functionCall(transferMsg);
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
  ): Promise<FinalExecutionOutcome> {
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
      return await account.functionCall(transferMsg);
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
      const wallet = await this.getWallet();
      return await signAndSendTransactions(account, wallet, msgs);
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
  ): Promise<FinalExecutionOutcome> {
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
  ): Promise<FinalExecutionOutcome> {
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

  parseSequenceFromLog(receipt: FinalExecutionOutcome): string {
    const sequences = this.parseSequencesFromLog(receipt);
    if (sequences.length === 0) throw new Error('no sequence found in log');
    return sequences[0];
  }

  parseSequencesFromLog(receipt: FinalExecutionOutcome): string[] {
    const sequences: string[] = [];
    for (const o of receipt.receipts_outcome) {
      for (const l of o.outcome.logs) {
        if (l.startsWith(NEAR_EVENT_PREFIX)) {
          const body = JSON.parse(l.slice(NEAR_EVENT_PREFIX.length));
          if (body.standard === "wormhole" && body.event === "publish") {
            sequences.push(body.seq.toString());
          }
        }
      }
    }
    return sequences;
  }
}
