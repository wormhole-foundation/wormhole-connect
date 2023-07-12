import {
  TokenId,
  ChainName,
  ChainId,
  MAINNET_CHAINS,
  ParsedMessage as SdkParsedMessage,
  ParsedRelayerMessage as SdkParsedRelayerMessage,
  VaaInfo,
} from '@wormhole-foundation/wormhole-connect-sdk';
import RouteAbstract from './routeAbstract';
import { TOKENS } from 'config';
import { getTokenById, getTokenDecimals, getWrappedToken } from 'utils';
import { TokenConfig } from 'config/types';
import { estimateClaimGasFees, estimateSendGasFees } from 'utils/gasEstimates';
import { Route } from 'store/transferInput';
import {
  ParsedMessage,
  ParsedRelayerMessage,
  solanaContext,
  wh,
} from 'utils/sdk';
import { utils } from 'ethers';
import { TransferWallet, postVaa, signAndSendTransaction } from 'utils/wallet';
import { PreviewData } from './types';

// adapts the sdk returned parsed message to the type that
// wh connect uses
export const adaptParsedMessage = async (
  parsed: SdkParsedMessage | SdkParsedRelayerMessage,
): Promise<ParsedMessage | ParsedRelayerMessage> => {
  const tokenId = {
    address: parsed.tokenAddress,
    chain: parsed.tokenChain,
  };
  const decimals = await wh.fetchTokenDecimals(tokenId, parsed.fromChain);
  const token = getTokenById(tokenId);

  const base: ParsedMessage = {
    ...parsed,
    amount: parsed.amount.toString(),
    tokenKey: token?.key || '',
    tokenDecimals: decimals,
    sequence: parsed.sequence.toString(),
    gasFee: parsed.gasFee ? parsed.gasFee.toString() : undefined,
  };
  // get wallet address of associated token account for Solana
  const toChainId = wh.toChainId(parsed.toChain);
  if (toChainId === MAINNET_CHAINS.solana) {
    const accountOwner = await solanaContext().getTokenAccountOwner(
      parsed.recipient,
    );
    base.recipient = accountOwner;
  }
  return base;
};

export interface BridgePreviewParams {
  destToken: TokenConfig;
  sourceGasToken: string;
  destinationGasToken: string;
  receiveAmount: number;
  sendingGasEst: string;
  destGasEst: string;
}

export class BridgeRoute extends RouteAbstract {
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

  async isSupportedSourceToken(
    token: TokenConfig | undefined,
    destToken: TokenConfig | undefined,
  ): Promise<boolean> {
    if (!token) return false;
    if (destToken) {
      const wrapped = getWrappedToken(token);
      return wrapped.key === destToken.key;
    }
    return true;
  }

  async isSupportedDestToken(
    token: TokenConfig | undefined,
    sourceToken: TokenConfig | undefined,
  ): Promise<boolean> {
    if (!token) return false;
    if (token.key === 'WSOL') return false;
    if (!token.tokenId) return false;
    if (sourceToken) {
      const wrapped = getWrappedToken(sourceToken);
      return wrapped.key === token.key;
    }
    return true;
  }

  async supportedSourceTokens(
    tokens: TokenConfig[],
    destToken?: TokenConfig,
  ): Promise<TokenConfig[]> {
    if (!destToken) return tokens;
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
    if (!sourceToken) return tokens;
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
    vaa: Uint8Array,
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
      await postVaa(connection, contracts.core, Buffer.from(vaa));
    }

    const tx = await wh.redeem(destChain, vaa, { gasLimit: 250000 }, payer);
    const txId = await signAndSendTransaction(
      destChainName,
      tx,
      TransferWallet.RECEIVING,
    );
    wh.registerProviders();
    return txId;
  }

  async parseMessage(
    info: VaaInfo<any>,
  ): Promise<ParsedMessage | ParsedRelayerMessage> {
    const message = await wh.parseMessage(info);
    return adaptParsedMessage(message);
  }

  public async getPreview({
    destToken,
    sourceGasToken,
    destinationGasToken,
    receiveAmount: amount,
    sendingGasEst,
    destGasEst,
  }: BridgePreviewParams): Promise<PreviewData> {
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
}
