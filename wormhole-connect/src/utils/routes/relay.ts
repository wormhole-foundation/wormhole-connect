import {
  TokenId,
  ChainName,
  ChainId,
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
} from 'utils/sdk';
import { BridgePreviewParams, BridgeRoute, adaptParsedMessage } from './bridge';
import { getTokenDecimals, getWrappedTokenId } from 'utils';
import { fetchVaa } from 'utils/vaa';
import { utils } from 'ethers';
import { TransferWallet, signAndSendTransaction } from 'utils/wallet';
import { toFixedDecimals } from '../balance';
import { PreviewData } from './types';

export type RelayOptions = {
  relayerFee?: number;
  toNativeToken?: number;
};

export interface RelayPreviewParams extends BridgePreviewParams {
  token: TokenConfig;
  receiveNativeAmt: number;
  relayerFee: number;
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

  public async readyForRedeem(
    txData: ParsedMessage | ParsedRelayerMessage,
  ): Promise<boolean> {
    throw new Error('not implemented');
  }

  async redeem(txData: ParsedMessage | ParsedRelayerMessage): Promise<string> {
    // TODO: implement redeemRelay in the WormholeContext for self redemptions
    throw new Error('not implemented');
  }

  async parseMessage(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<ParsedMessage | ParsedRelayerMessage> {
    const info = await wh.getVaa(tx, chain);
    const message = await wh.parseMessage(info);
    const parsed: any = await adaptParsedMessage(message, Route.RELAY);
    if (parsed.payloadID !== PayloadType.AUTOMATIC) {
      throw new Error('wrong payload, not a token bridge relay transfer');
    }
    return {
      ...parsed,
      relayerFee: parsed.relayerFee.toString(),
      toNativeTokenAmount: parsed.toNativeTokenAmount.toString(),
    };
  }

  public async isTransferCompleted(
    txData: ParsedMessage | ParsedRelayerMessage,
  ): Promise<boolean> {
    const parsedVaa = await fetchVaa(txData);
    if (!parsedVaa) return false;
    const signedVaa = parsedVaa.bytes;
    return await wh.isTransferCompleted(txData.toChain, signedVaa);
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
  }: RelayPreviewParams): Promise<PreviewData> {
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
}
