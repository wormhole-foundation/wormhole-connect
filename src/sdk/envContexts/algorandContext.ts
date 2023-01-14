import { WormholeContext } from '../wormhole';
import { Context } from './contextAbstract';
import { BigNumber } from 'ethers';
import { TokenId, ChainName, ChainId, NATIVE } from '../types';
import {
  assetOptinCheck,
  getMessageFee,
  optin,
  TransactionSignerPair,
} from '@certusone/wormhole-sdk/lib/cjs/algorand';
import {
  getEmitterAddressAlgorand,
  safeBigIntToNumber,
  textToUint8Array,
  hexToUint8Array,
  uint8ArrayToHex,
} from '@certusone/wormhole-sdk';
import {
  Algodv2,
  bigIntToBytes,
  getApplicationAddress,
  makeApplicationCallTxnFromObject,
  makeAssetTransferTxnWithSuggestedParamsFromObject,
  makePaymentTxnWithSuggestedParamsFromObject,
  OnApplicationComplete,
  SuggestedParams,
  Transaction as AlgorandTransaction,
  decodeAddress,
} from 'algosdk';
import AlgodClient from 'algosdk/dist/types/client/v2/algod/algod';

export class AlgorandContext<T extends WormholeContext> extends Context {
  readonly context: T;

  constructor(context: T) {
    super();
    this.context = context;
  }

  getProvider(): AlgodClient {
    // const baseAmountParsed = parseUnits(amount, decimals);
    // const feeParsed = parseUnits(relayerFee || "0", decimals);
    // const transferAmountParsed = baseAmountParsed.add(feeParsed);
    const ALGORAND_HOST =
      this.context.conf.env === 'MAINNET'
        ? {
            algodToken: '',
            algodServer: 'https://mainnet-api.algonode.cloud',
            algodPort: '',
          }
        : {
            algodToken: '',
            algodServer: 'https://testnet-api.algonode.cloud',
            algodPort: '',
          };
    return new Algodv2(
      ALGORAND_HOST.algodToken,
      ALGORAND_HOST.algodServer,
      ALGORAND_HOST.algodPort,
    );
  }

  private async transferFromAlgorand(
    client: Algodv2,
    tokenBridgeId: bigint,
    bridgeId: bigint,
    senderAddr: string,
    tokenAddress: bigint,
    amount: bigint,
    recipientAddress: string,
    recipientChain: ChainId | ChainName,
    relayerFee: bigint = BigInt('0'),
    payload?: Uint8Array,
  ): Promise<TransactionSignerPair[]> {
    const recipientChainId = this.context.resolveDomain(recipientChain);
    const tokenAddr: string = getApplicationAddress(tokenBridgeId);
    const applAddr: string = getEmitterAddressAlgorand(tokenBridgeId);
    const txs: TransactionSignerPair[] = [];
    // "transferAsset"
    const { addr: emitterAddr, txs: emitterOptInTxs } = await optin(
      client,
      senderAddr,
      bridgeId,
      BigInt(0),
      applAddr,
    );
    txs.push(...emitterOptInTxs);
    let creator;
    let creatorAcctInfo: any;
    let wormhole: boolean = false;
    if (tokenAddress !== BigInt(0)) {
      const assetInfo: Record<string, any> = await client
        .getAssetByID(safeBigIntToNumber(tokenAddress))
        .do();
      creator = assetInfo['params']['creator'];
      creatorAcctInfo = await client.accountInformation(creator).do();
      const authAddr: string = creatorAcctInfo['auth-addr'];
      if (authAddr === tokenAddr) {
        wormhole = true;
      }
    }

    const params: SuggestedParams = await client.getTransactionParams().do();
    const msgFee: bigint = await getMessageFee(client, bridgeId);
    if (msgFee > 0) {
      const payTxn: AlgorandTransaction =
        makePaymentTxnWithSuggestedParamsFromObject({
          from: senderAddr,
          suggestedParams: params,
          to: getApplicationAddress(tokenBridgeId),
          amount: msgFee,
        });
      txs.push({ tx: payTxn, signer: null });
    }
    if (!wormhole) {
      const bNat = Buffer.from('native', 'binary').toString('hex');
      // "creator"
      const result = await optin(
        client,
        senderAddr,
        tokenBridgeId,
        tokenAddress,
        bNat,
      );
      creator = result.addr;
      txs.push(...result.txs);
    }
    if (
      tokenAddress !== BigInt(0) &&
      !(await assetOptinCheck(client, tokenAddress, creator))
    ) {
      // Looks like we need to optin
      const payTxn: AlgorandTransaction =
        makePaymentTxnWithSuggestedParamsFromObject({
          from: senderAddr,
          to: creator,
          amount: 100000,
          suggestedParams: params,
        });
      txs.push({ tx: payTxn, signer: null });
      // The tokenid app needs to do the optin since it has signature authority
      const bOptin: Uint8Array = textToUint8Array('optin');
      let txn = makeApplicationCallTxnFromObject({
        from: senderAddr,
        appIndex: safeBigIntToNumber(tokenBridgeId),
        onComplete: OnApplicationComplete.NoOpOC,
        appArgs: [bOptin, bigIntToBytes(tokenAddress, 8)],
        foreignAssets: [safeBigIntToNumber(tokenAddress)],
        accounts: [creator],
        suggestedParams: params,
      });
      txn.fee *= 2;
      txs.push({ tx: txn, signer: null });
    }
    const t = makeApplicationCallTxnFromObject({
      from: senderAddr,
      appIndex: safeBigIntToNumber(tokenBridgeId),
      onComplete: OnApplicationComplete.NoOpOC,
      appArgs: [textToUint8Array('nop')],
      suggestedParams: params,
    });
    txs.push({ tx: t, signer: null });

    let accounts: string[] = [];
    if (tokenAddress === BigInt(0)) {
      const t = makePaymentTxnWithSuggestedParamsFromObject({
        from: senderAddr,
        to: creator,
        amount,
        suggestedParams: params,
      });
      txs.push({ tx: t, signer: null });
      accounts = [emitterAddr, creator, creator];
    } else {
      const t = makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: senderAddr,
        to: creator,
        suggestedParams: params,
        amount: amount,
        assetIndex: safeBigIntToNumber(tokenAddress),
      });
      txs.push({ tx: t, signer: null });
      accounts = [emitterAddr, creator, creatorAcctInfo['address']];
    }
    let args = [
      textToUint8Array('sendTransfer'),
      bigIntToBytes(tokenAddress, 8),
      bigIntToBytes(amount, 8),
      hexToUint8Array(recipientAddress),
      bigIntToBytes(recipientChainId, 8),
      bigIntToBytes(relayerFee, 8),
    ];
    if (payload) {
      args.push(payload);
    }
    let acTxn = makeApplicationCallTxnFromObject({
      from: senderAddr,
      appIndex: safeBigIntToNumber(tokenBridgeId),
      onComplete: OnApplicationComplete.NoOpOC,
      appArgs: args,
      foreignApps: [safeBigIntToNumber(bridgeId)],
      foreignAssets: [safeBigIntToNumber(tokenAddress)],
      accounts: accounts,
      suggestedParams: params,
    });
    acTxn.fee *= 2;
    txs.push({ tx: acTxn, signer: null });
    return txs;
  }

  async send(
    token: TokenId | typeof NATIVE,
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    relayerFee?: string,
  ): Promise<any> {
    if (token === NATIVE)
      throw new Error('Must send Token ID for Algorand transfers');
    const tokenBridge = this.context.mustGetBridge(sendingChain).address;
    const coreBridge = this.context.mustGetCore(sendingChain).address;
    const client = this.getProvider();
    return await this.transferFromAlgorand(
      client,
      BigInt(tokenBridge),
      BigInt(coreBridge),
      senderAddress,
      BigInt(token.address),
      BigInt(amount),
      recipientAddress,
      recipientChain,
      BigInt(relayerFee || '0'),
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
  ): Promise<any> {
    if (token === NATIVE)
      throw new Error('Must send Token ID for Algorand transfers');
    const tokenBridge = this.context.mustGetBridge(sendingChain).address;
    const coreBridge = this.context.mustGetCore(sendingChain).address;
    const client = this.getProvider();
    return await this.transferFromAlgorand(
      client,
      BigInt(tokenBridge),
      BigInt(coreBridge),
      senderAddress,
      BigInt(token.address),
      BigInt(amount),
      recipientAddress,
      recipientChain,
      undefined,
      payload,
    );
  }

  parseSequenceFromLog(receipt: any): string {
    const sequences = this.parseSequencesFromLog(receipt);
    if (sequences.length === 0) throw new Error('no sequence found in log');
    return sequences[0];
  }

  parseSequencesFromLog(receipt: Record<string, any>): string[] {
    let sequences: string[] = [];
    if (receipt["inner-txns"]) {
      const innerTxns: [] = receipt["inner-txns"];
      class iTxn {
        "local-state-delta": [[Object]];
        logs: Buffer[] | undefined;
        "pool-error": string;
        txn: { txn: [Object] } | undefined;
      }
      innerTxns.forEach((txn: iTxn) => {
        if (txn.logs) {
          sequences.push(BigNumber.from(txn.logs[0].slice(0, 8)).toString());
        }
      });
    }
    return sequences;
  }

  getEmitterAddress(address: bigint): string {
    const appAddr: string = getApplicationAddress(address);
    const decAppAddr: Uint8Array = decodeAddress(appAddr).publicKey;
    const aa: string = uint8ArrayToHex(decAppAddr);
    return aa;
  }
}
