import {
  ChainId,
  ChainName,
  MAINNET_CHAINS,
  TokenId,
  VaaInfo,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { CHAINS, TOKENS } from 'config';
import { TokenConfig } from 'config/types';
import { BigNumber, utils } from 'ethers';
import { Route } from 'store/transferInput';
import { MAX_DECIMALS, getTokenDecimals, toNormalizedDecimals } from 'utils';
import { estimateClaimGasFees, estimateSendGasFees } from 'utils/gasEstimates';
import { ParsedMessage, ParsedRelayerMessage, toChainId, wh } from 'utils/sdk';
import { TransferWallet, postVaa, signAndSendTransaction } from 'utils/wallet';
import { TransferDisplayData } from './types';
import { BaseRoute } from './baseRoute';
import { adaptParsedMessage } from './common';
import { toDecimals } from '../balance';
import { calculateGas } from '../gas';
import { TransferInfoBaseParams } from './routeAbstract';
import { hexlify } from 'ethers/lib/utils.js';

export interface BridgePreviewParams {
  destToken: TokenConfig;
  sourceGasToken: string;
  destinationGasToken: string;
  receiveAmount: number;
  sendingGasEst: string;
  destGasEst: string;
}

interface TransferDestInfoParams {
  txData: ParsedMessage | ParsedRelayerMessage;
  receiveTx?: string;
}

export class BridgeRoute extends BaseRoute {
  async isRouteAvailable(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    const sourceTokenConfig = TOKENS[sourceToken];
    const destTokenConfig = TOKENS[destToken];
    if (!sourceChain || !destChain || !sourceTokenConfig || !destTokenConfig)
      return false;
    if (sourceChain === destChain) return false;
    // TODO: probably not true for Solana
    if (destToken === 'native') return false;
    if (!!sourceTokenConfig.tokenId && sourceToken === destToken) return true;
    if (
      !sourceTokenConfig.tokenId &&
      sourceTokenConfig.wrappedAsset === destToken
    )
      return true;
    return false;
  }

  async computeReceiveAmount(
    sendAmount: number | undefined,
    routeOptions: any,
  ): Promise<number> {
    if (!sendAmount) return 0;
    return sendAmount;
  }
  async computeSendAmount(
    receiveAmount: number | undefined,
    routeOptions: any,
  ): Promise<number> {
    if (!receiveAmount) return 0;
    return receiveAmount;
  }

  async validate(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions: any,
  ): Promise<boolean> {
    throw new Error('not implemented');
  }

  async estimateSendGas(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions: any,
  ): Promise<string> {
    return await estimateSendGasFees(
      token,
      Number.parseFloat(amount),
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
      Route.BRIDGE,
    );
  }

  async estimateClaimGas(destChain: ChainName | ChainId): Promise<string> {
    return await estimateClaimGasFees(destChain);
  }

  /**
   * These operations have to be implemented in subclasses.
   */
  async send(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions: any,
  ): Promise<string> {
    const fromChainId = wh.toChainId(sendingChain);
    const fromChainName = wh.toChainName(sendingChain);
    const decimals = getTokenDecimals(fromChainId, token);
    const parsedAmt = utils.parseUnits(amount, decimals);
    const tx = await wh.send(
      token,
      parsedAmt.toString(),
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
      undefined,
    );
    const txId = await signAndSendTransaction(
      fromChainName,
      tx,
      TransferWallet.SENDING,
    );
    wh.registerProviders();
    return txId;
  }

  async redeem(
    destChain: ChainName | ChainId,
    messageInfo: VaaInfo,
    payer: string,
  ): Promise<string> {
    // post vaa (solana)
    // TODO: move to context

    const destChainId = wh.toChainId(destChain);
    const destChainName = wh.toChainName(destChain);
    if (destChainId === MAINNET_CHAINS.solana) {
      const destContext = wh.getContext(destChain) as any;
      const connection = destContext.connection;
      if (!connection) throw new Error('no connection');
      const contracts = wh.mustGetContracts(destChain);
      if (!contracts.core) throw new Error('contract not found');
      await postVaa(
        connection,
        contracts.core,
        Buffer.from(messageInfo.rawVaa),
      );
    }

    const tx = await wh.redeem(destChain, messageInfo.rawVaa, undefined, payer);
    const txId = await signAndSendTransaction(
      destChainName,
      tx,
      TransferWallet.RECEIVING,
    );
    wh.registerProviders();
    return txId;
  }

  async parseMessage(
    messageInfo: VaaInfo<any>,
  ): Promise<ParsedMessage | ParsedRelayerMessage> {
    const message = await wh.parseMessage(messageInfo);
    return adaptParsedMessage(message);
  }

  public async getPreview({
    destToken,
    sourceGasToken,
    destinationGasToken,
    receiveAmount: amount,
    sendingGasEst,
    destGasEst,
  }: BridgePreviewParams): Promise<TransferDisplayData> {
    return [
      {
        title: 'Amount',
        value: `${amount} ${destToken.symbol}`,
      },
      {
        title: 'Total fee estimates',
        value:
          sendingGasEst && destGasEst
            ? `${sendingGasEst} ${sourceGasToken} & ${destGasEst} ${destinationGasToken}`
            : '',
        rows: [
          {
            title: 'Source chain gas estimate',
            value: sendingGasEst
              ? `~ ${sendingGasEst} ${sourceGasToken}`
              : 'Not available',
          },
          {
            title: 'Destination chain gas estimate',
            value: destGasEst
              ? `~ ${destGasEst} ${destinationGasToken}`
              : 'Not available',
          },
        ],
      },
    ];
  }

  public getNativeBalance(
    address: string,
    network: ChainName | ChainId,
  ): Promise<BigNumber | null> {
    return wh.getNativeBalance(address, network);
  }

  public getTokenBalance(
    address: string,
    tokenId: TokenId,
    network: ChainName | ChainId,
  ): Promise<BigNumber | null> {
    return wh.getTokenBalance(address, tokenId, network);
  }

  async getRelayerFee(
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    token: string,
  ): Promise<BigNumber> {
    return BigNumber.from(0);
  }

  async getForeignAsset(
    token: TokenId,
    chain: ChainName | ChainId,
  ): Promise<string | null> {
    return wh.getForeignAsset(token, chain);
  }

  async getMessageInfo(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<VaaInfo<any>> {
    return wh.getVaa(tx, chain);
  }

  async getTransferSourceInfo({
    txData,
  }: TransferInfoBaseParams): Promise<TransferDisplayData> {
    const formattedAmt = toNormalizedDecimals(
      txData.amount,
      txData.tokenDecimals,
      MAX_DECIMALS,
    );
    const { gasToken: sourceGasTokenSymbol } = CHAINS[txData.fromChain]!;
    const sourceGasToken = TOKENS[sourceGasTokenSymbol];
    const decimals = getTokenDecimals(
      toChainId(sourceGasToken.nativeNetwork),
      sourceGasToken.tokenId,
    );
    const formattedGas =
      txData.gasFee && toDecimals(txData.gasFee, decimals, MAX_DECIMALS);
    const token = TOKENS[txData.tokenKey];

    return [
      {
        title: 'Amount',
        value: `${formattedAmt} ${token.symbol}`,
      },
      {
        title: 'Gas fee',
        value: formattedGas ? `${formattedGas} ${sourceGasTokenSymbol}` : '—',
      },
    ];
  }

  async getTransferDestInfo({
    txData,
    receiveTx,
  }: TransferDestInfoParams): Promise<TransferDisplayData> {
    const token = TOKENS[txData.tokenKey];
    const { gasToken } = CHAINS[txData.toChain]!;

    const gas = await calculateGas(txData.toChain, Route.BRIDGE, receiveTx);

    const formattedAmt = toNormalizedDecimals(
      txData.amount,
      txData.tokenDecimals,
      MAX_DECIMALS,
    );
    return [
      {
        title: 'Amount',
        value: `${formattedAmt} ${token.symbol}`,
      },
      {
        title: receiveTx ? 'Gas fee' : 'Gas estimate',
        value: gas ? `${gas} ${gasToken}` : '—',
      },
    ];
  }

  async isTransferCompleted(
    destChain: ChainName | ChainId,
    messageInfo: VaaInfo,
  ): Promise<boolean> {
    return wh.isTransferCompleted(destChain, hexlify(messageInfo.rawVaa));
  }
}
