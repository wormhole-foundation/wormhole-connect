import {
  ChainName,
  ChainId,
  TokenId,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber } from 'ethers';

import { Route, TokenConfig } from 'config/types';
import {
  TransferInfoBaseParams,
  UnsignedMessage,
  SignedMessage,
} from './types';
import { TransferDisplayData } from './types';
import RouteAbstract from './routeAbstract';
import { CHAINS, ROUTES, TOKENS, isMainnet } from 'config';
import { wh } from 'utils/sdk';
import { toFixedDecimals } from 'utils/balance';
import { NO_INPUT } from 'utils/style';

export class HashflowRoute extends RouteAbstract {
  readonly NATIVE_GAS_DROPOFF_SUPPORTED = false;
  readonly AUTOMATIC_DEPOSIT = true;

  isSupportedChain(chain: ChainName): boolean {
    const supportedTestnet: ChainName[] = [
      'goerli',
      'arbitrumgoerli',
      'fuji',
      'mumbai',
      'optimismgoerli',
    ];
    const supportedMainnet: ChainName[] = [
      'ethereum',
      'arbitrum',
      'avalanche',
      'polygon',
      'optimism',
    ];
    const supportedChains = isMainnet ? supportedMainnet : supportedTestnet;
    return supportedChains.some((c) => c === chain);
  }

  async isRouteAvailable(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    if (!ROUTES.includes(Route.Hashflow)) {
      return false;
    }

    // source token is native to source chain
    // dest token is native to dest chain

    // cctp > hashflow > relay > bridge
    // maker must have liquidity to support
    return true;
  }
  async isSupportedSourceToken(
    token: TokenConfig | undefined,
    destToken: TokenConfig | undefined,
    sourceChain: ChainName,
  ): Promise<boolean> {
    // only allow native tokens
    // TODO: query enpoint for supported tokens and check list
    if (!token) return false;
    if (sourceChain) {
      if (token?.nativeChain !== sourceChain) {
        return false;
      }
    }
    return true;
  }
  async isSupportedDestToken(
    token: TokenConfig | undefined,
    sourceToken: TokenConfig | undefined,
    sourceChain: ChainName,
    destChain: ChainName,
  ): Promise<boolean> {
    // only allow native tokens
    // TODO: query enpoint for supported tokens and check list
    if (!token) return false;
    if (destChain) {
      if (token?.nativeChain !== destChain) {
        return false;
      }
    }
    return true;
  }
  async supportedSourceTokens(
    tokens: TokenConfig[],
    destToken: TokenConfig,
    sourceChain: ChainName,
  ): Promise<TokenConfig[]> {
    const shouldAdd = await Promise.allSettled(
      tokens.map((token) =>
        this.isSupportedSourceToken(token, destToken, sourceChain),
      ),
    );
    return tokens.filter((_token, i) => {
      const res = shouldAdd[i];
      return res.status === 'fulfilled' && res.value;
    });
  }
  async supportedDestTokens(
    tokens: TokenConfig[],
    sourceToken: TokenConfig,
    sourceChain: ChainName,
    destChain: ChainName,
  ): Promise<TokenConfig[]> {
    const shouldAdd = await Promise.allSettled(
      tokens.map((token) =>
        this.isSupportedDestToken(token, sourceToken, sourceChain, destChain),
      ),
    );
    return tokens.filter((_token, i) => {
      const res = shouldAdd[i];
      return res.status === 'fulfilled' && res.value;
    });
  }
  async computeReceiveAmount(sendAmount: number | undefined): Promise<number> {
    // throw new Error('Method not implemented');
    return 1;
  }
  async computeSendAmount(receiveAmount: number | undefined): Promise<number> {
    // throw new Error('Method not implemented');
    return 1;
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
    throw new Error('Method not implemented.');
  }
  async estimateSendGas(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions: any,
  ): Promise<BigNumber> {
    // throw new Error('Method not implemented.');
    return BigNumber.from('0');
  }
  estimateClaimGas(
    destChain: ChainName | ChainId,
    signedMessage?: SignedMessage,
  ): Promise<BigNumber> {
    // throw new Error('Method not implemented.');
    return BigNumber.from('0');
  }
  getMinSendAmount(routeOptions: any): number {
    return 0;
  }
  async send(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions: any,
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }
  async redeem(
    destChain: ChainName | ChainId,
    messageInfo: SignedMessage,
    recipient: string,
  ): Promise<string> {
    throw new Error('Method not implemented.');
  }
  public async getPreview(
    token: TokenConfig,
    destToken: TokenConfig,
    amount: number,
    sendingChain: ChainName | ChainId,
    receipientChain: ChainName | ChainId,
    sendingGasEst: string,
    claimingGasEst: string,
    routeOptions?: any,
  ): Promise<TransferDisplayData> {
    const sendingChainName = wh.toChainName(sendingChain);
    const recipientChainName = wh.toChainName(receipientChain);
    const sendingChainConfig = CHAINS[sendingChainName];
    const receivingChainConfig = CHAINS[recipientChainName];
    const sourceGasToken = CHAINS[sendingChainName]?.gasToken;
    const destinationGasToken = CHAINS[recipientChainName]?.gasToken;
    const { relayerFee } = routeOptions;
    const sourceGasTokenSymbol = sourceGasToken
      ? TOKENS[sourceGasToken].symbol
      : '';

    const destinationGasTokenSymbol = destinationGasToken
      ? TOKENS[destinationGasToken].symbol
      : '';

    const receiveAmt = await this.computeReceiveAmount(amount);

    return [
      {
        title: 'Amount',
        value: `${toFixedDecimals(`${receiveAmt}`, 6)} ${destToken.symbol}`,
      },
      {
        title: 'Total fee estimates',
        value: `$$$$$`,
        rows: [
          {
            title: `${sendingChainConfig?.displayName} gas`,
            value: sendingGasEst
              ? `~ ${sendingGasEst} ${sourceGasTokenSymbol}`
              : NO_INPUT,
          },
          {
            title: `${receivingChainConfig?.displayName} gas + relayer fee`,
            value:
              relayerFee !== undefined
                ? `${relayerFee} ${destinationGasTokenSymbol}`
                : NO_INPUT,
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
    // throw new Error('Method not implemented.');
    return BigNumber.from('0');
  }
  // getForeignAsset(
  //   token: TokenId,
  //   chain: ChainName | ChainId,
  // ): Promise<string | null> {
  //   throw new Error('Method not implemented.');
  // }
  isTransferCompleted(
    destChain: ChainName | ChainId,
    message: SignedMessage,
  ): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  getMessage(tx: string, chain: ChainName | ChainId): Promise<UnsignedMessage> {
    throw new Error('Method not implemented.');
  }
  getSignedMessage(message: UnsignedMessage): Promise<SignedMessage> {
    throw new Error('Method not implemented.');
  }
  getTransferSourceInfo<T extends TransferInfoBaseParams>(
    params: T,
  ): Promise<TransferDisplayData> {
    throw new Error('Method not implemented.');
  }
  getTransferDestInfo<T extends TransferInfoBaseParams>(
    params: T,
  ): Promise<TransferDisplayData> {
    throw new Error('Method not implemented.');
  }

  async nativeTokenAmount(
    destChain: ChainName | ChainId,
    token: TokenId,
    amount: BigNumber,
    walletAddress: string,
  ): Promise<BigNumber> {
    throw new Error('Not supported');
  }

  async maxSwapAmount(
    destChain: ChainName | ChainId,
    token: TokenId,
    walletAddress: string,
  ): Promise<BigNumber> {
    throw new Error('Not supported');
  }

  async tryFetchRedeemTx(txData: UnsignedMessage): Promise<string | undefined> {
    return undefined; // only for automatic routes
  }
}
