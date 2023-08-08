import {
  TokenId,
  ChainName,
  ChainId,
  VaaInfo,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { TokenConfig } from 'config/types';
import { estimateClaimGasFees, estimateSendGasFees } from 'utils/gasEstimates';
import { Route } from 'store/transferInput';
import {
  ParsedMessage,
  PayloadType,
  wh,
  isAcceptedToken,
  ParsedRelayerMessage,
  toChainId,
  calculateNativeTokenAmt,
} from 'utils/sdk';
import { BridgePreviewParams, BridgeRoute } from './bridge';
import {
  MAX_DECIMALS,
  fromNormalizedDecimals,
  getTokenDecimals,
  getWrappedTokenId,
  toNormalizedDecimals,
} from 'utils';
import { BigNumber, utils } from 'ethers';
import { TransferWallet, signAndSendTransaction } from 'utils/wallet';
import { toDecimals, toFixedDecimals } from '../balance';
import { TransferDisplayData } from './types';
import { CHAINS, TOKENS } from '../../config';
import { adaptParsedMessage } from './common';
import { fetchSwapEvent } from '../events';
import { TransferInfoBaseParams } from './routeAbstract';

export type RelayOptions = {
  relayerFee?: number;
  toNativeToken?: number;
};

export interface RelayPreviewParams extends BridgePreviewParams {
  token: TokenConfig;
  receiveNativeAmt: number;
  relayerFee: number;
}

interface TransferDestInfoParams {
  txData: ParsedMessage | ParsedRelayerMessage;
  receiveTx?: string;
  transferComplete?: boolean;
}

export class RelayRoute extends BridgeRoute {
  async isRouteAvailable(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    const isBridgeRouteAvailable = await super.isRouteAvailable(
      sourceToken,
      destToken,
      amount,
      sourceChain,
      destChain,
    );
    if (!isBridgeRouteAvailable) return false;
    const sourceContracts = wh.mustGetContracts(sourceChain);
    const destContracts = wh.mustGetContracts(destChain);
    if (!sourceContracts.relayer || !destContracts.relayer) {
      return false;
    }
    return true;
  }

  async isSupportedSourceToken(
    token: TokenConfig | undefined,
    destToken: TokenConfig | undefined,
  ): Promise<boolean> {
    if (!token) return false;
    const isSupportedBridgeToken = await super.isSupportedSourceToken(
      token,
      destToken,
    );
    if (!isSupportedBridgeToken) return false;
    const tokenId = getWrappedTokenId(token);
    return await isAcceptedToken(tokenId);
  }

  async isSupportedDestToken(
    token: TokenConfig | undefined,
    sourceToken: TokenConfig | undefined,
  ): Promise<boolean> {
    if (!token) return false;
    const isSupportedBridgeToken = await super.isSupportedDestToken(
      token,
      sourceToken,
    );
    if (!isSupportedBridgeToken) return false;
    const tokenId = getWrappedTokenId(token);
    return await isAcceptedToken(tokenId);
  }

  async supportedSourceTokens(
    tokens: TokenConfig[],
    destToken?: TokenConfig,
  ): Promise<TokenConfig[]> {
    const shouldAdd = await Promise.allSettled(
      tokens.map((token) => this.isSupportedSourceToken(token, destToken)),
    );
    return tokens.filter((_token, i) => {
      const res = shouldAdd[i];
      return res.status === 'fulfilled' && res.value;
    });
  }

  async supportedDestTokens(
    tokens: TokenConfig[],
    sourceToken?: TokenConfig,
  ): Promise<TokenConfig[]> {
    const shouldAdd = await Promise.allSettled(
      tokens.map((token) => this.isSupportedDestToken(token, sourceToken)),
    );
    return tokens.filter((_token, i) => {
      const res = shouldAdd[i];
      return res.status === 'fulfilled' && res.value;
    });
  }

  async computeReceiveAmount(
    sendAmount: number | undefined,
    routeOptions: RelayOptions,
  ): Promise<number> {
    if (!sendAmount) return 0;
    return sendAmount - (routeOptions?.toNativeToken || 0);
  }
  async computeSendAmount(
    receiveAmount: number | undefined,
    routeOptions: RelayOptions,
  ): Promise<number> {
    if (!receiveAmount) return 0;
    return receiveAmount + (routeOptions?.toNativeToken || 0);
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
    routeOptions: RelayOptions,
  ): Promise<string> {
    return await estimateSendGasFees(
      token,
      Number.parseFloat(amount),
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
      Route.RELAY,
      routeOptions.relayerFee,
      routeOptions.toNativeToken,
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
    routeOptions: RelayOptions,
  ): Promise<string> {
    const fromChainId = wh.toChainId(sendingChain);
    const fromChainName = wh.toChainName(sendingChain);
    const decimals = getTokenDecimals(fromChainId, token);
    const parsedAmt = utils.parseUnits(amount, decimals);
    if (!wh.supportsSendWithRelay(fromChainId)) {
      throw new Error(`send with relay not supported`);
    }
    const parsedNativeAmt = routeOptions.toNativeToken
      ? utils
          .parseUnits(routeOptions.toNativeToken.toString(), decimals)
          .toString()
      : '0';
    const tx = await wh.sendWithRelay(
      token,
      parsedAmt.toString(),
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
      parsedNativeAmt,
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
    vaa: Uint8Array,
    payer: string,
  ): Promise<string> {
    // TODO: implement redeemRelay in the WormholeContext for self redemptions
    throw new Error('not implemented');
  }

  async parseMessage(
    info: VaaInfo<any>,
  ): Promise<ParsedMessage | ParsedRelayerMessage> {
    const message = await wh.parseMessage(info);
    const parsed: any = await adaptParsedMessage(message);
    if (parsed.payloadID !== PayloadType.AUTOMATIC) {
      throw new Error('wrong payload, not a token bridge relay transfer');
    }
    return {
      ...parsed,
      relayerFee: parsed.relayerFee.toString(),
      toNativeTokenAmount: parsed.toNativeTokenAmount.toString(),
    };
  }

  public async getPreview({
    token,
    destToken,
    sourceGasToken,
    destinationGasToken,
    receiveAmount,
    receiveNativeAmt,
    sendingGasEst,
    relayerFee,
  }: RelayPreviewParams): Promise<TransferDisplayData> {
    const isNative = token.symbol === sourceGasToken;
    let totalFeesText = '';
    if (sendingGasEst && relayerFee) {
      const fee = toFixedDecimals(
        `${relayerFee + (isNative ? Number.parseFloat(sendingGasEst) : 0)}`,
        6,
      );
      totalFeesText = isNative
        ? `${fee} ${token.symbol}`
        : `${sendingGasEst} ${sourceGasToken} & ${fee} ${token.symbol}`;
    }

    return [
      {
        title: 'Amount',
        value: `${toFixedDecimals(`${receiveAmount}`, 6)} ${destToken.symbol}`,
      },
      {
        title: 'Native gas on destination',
        value:
          receiveNativeAmt > 0
            ? `${receiveNativeAmt} ${destinationGasToken}`
            : '-',
      },
      {
        title: 'Total fee estimates',
        value: totalFeesText,
        rows: [
          {
            title: 'Source chain gas estimate',
            value: sendingGasEst ? `~ ${sendingGasEst} ${sourceGasToken}` : '—',
          },
          {
            title: 'Relayer fee',
            value: relayerFee ? `${relayerFee} ${token.symbol}` : '—',
          },
        ],
      },
    ];
  }

  async getRelayerFee(
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    token: string,
  ): Promise<BigNumber> {
    const context: any = wh.getContext(sourceChain);
    const tokenConfig = TOKENS[token];
    if (!tokenConfig) throw new Error('could not get token config');
    const tokenId = tokenConfig.tokenId || getWrappedTokenId(tokenConfig);
    return await context.getRelayerFee(sourceChain, destChain, tokenId);
  }

  async getTransferSourceInfo({
    txData: data,
  }: TransferInfoBaseParams): Promise<TransferDisplayData> {
    const txData = data as ParsedRelayerMessage;

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

    // automatic transfers
    const formattedFee = toNormalizedDecimals(
      txData.relayerFee,
      txData.tokenDecimals,
      MAX_DECIMALS,
    );
    const formattedToNative = toNormalizedDecimals(
      txData.toNativeTokenAmount,
      txData.tokenDecimals,
      MAX_DECIMALS,
    );
    const { gasToken } = CHAINS[txData.toChain]!;
    return [
      {
        title: 'Amount',
        value: `${formattedAmt} ${token.symbol}`,
      },
      {
        title: 'Gas fee',
        value: formattedGas ? `${formattedGas} ${sourceGasTokenSymbol}` : '—',
      },
      {
        title: 'Relayer fee',
        value: `${formattedFee} ${token.symbol}`,
      },
      {
        title: 'Convert to native gas token',
        value: `≈ ${formattedToNative} ${token.symbol} \u2192 ${gasToken}`,
      },
    ];
  }

  async getTransferDestInfo({
    txData: data,
    receiveTx,
    transferComplete,
  }: TransferDestInfoParams): Promise<TransferDisplayData> {
    const txData: ParsedRelayerMessage = data as ParsedRelayerMessage;

    const token = TOKENS[txData.tokenKey];
    const { gasToken } = CHAINS[txData.toChain]!;

    // calculate the amount of native gas received
    let nativeGasAmt: string | undefined;
    const nativeGasToken = TOKENS[gasToken];
    if (receiveTx) {
      let nativeSwapAmount: any;
      try {
        nativeSwapAmount = await fetchSwapEvent(txData);
      } catch (e) {
        console.error(`could not fetch swap event:\n${e}`);
      }
      if (nativeSwapAmount) {
        const decimals = getTokenDecimals(
          wh.toChainId(txData.toChain),
          nativeGasToken.tokenId,
        );
        nativeGasAmt = toDecimals(nativeSwapAmount, decimals, MAX_DECIMALS);
      }
    } else if (!transferComplete) {
      // get the decimals on the target chain
      const destinationTokenDecimals = getTokenDecimals(
        wh.toChainId(txData.toChain),
        txData.tokenId,
      );
      const amount = await calculateNativeTokenAmt(
        txData.toChain,
        txData.tokenId,
        fromNormalizedDecimals(
          BigNumber.from(txData.toNativeTokenAmount),
          destinationTokenDecimals,
        ),
        txData.recipient,
      );
      // get the decimals on the target chain
      const nativeGasTokenDecimals = getTokenDecimals(
        wh.toChainId(txData.toChain),
        getWrappedTokenId(nativeGasToken),
      );
      nativeGasAmt = toDecimals(
        amount.toString(),
        // nativeGasToken.decimals,
        nativeGasTokenDecimals,
        MAX_DECIMALS,
      );
    }

    const receiveAmt = BigNumber.from(txData.amount)
      .sub(BigNumber.from(txData.relayerFee))
      .sub(BigNumber.from(txData.toNativeTokenAmount || 0));
    const formattedAmt = toNormalizedDecimals(
      receiveAmt,
      txData.tokenDecimals,
      MAX_DECIMALS,
    );

    return [
      {
        title: 'Amount',
        value: `${formattedAmt} ${token.symbol}`,
      },
      {
        title: 'Native gas token',
        value: nativeGasAmt ? `${nativeGasAmt} ${gasToken}` : '—',
      },
    ];
  }
}
