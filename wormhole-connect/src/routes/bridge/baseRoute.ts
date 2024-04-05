import { ChainId, ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { TokenConfig } from 'config/types';
import {
  MAX_DECIMALS,
  calculateUSDPrice,
  getDisplayName,
  getTokenDecimals,
  getWrappedToken,
  toNormalizedDecimals,
} from 'utils';
import { RouteAbstract } from '../abstracts';
import { toChainId } from 'utils/sdk';
import config from 'config';
import {
  TransferDisplayData,
  TransferInfoBaseParams,
  TransferDestInfoBaseParams,
  SignedMessage,
  isSignedWormholeMessage,
  TransferDestInfo,
} from 'routes/types';
import { formatGasFee, isIlliquidDestToken } from 'routes/utils';
import { toDecimals } from 'utils/balance';
import { NO_INPUT } from 'utils/style';
import { hexlify } from 'ethers/lib/utils.js';
import { isTBTCToken } from 'routes/tbtc/utils';
import { TokenPrices } from 'store/tokenPrices';

export abstract class BaseRoute extends RouteAbstract {
  async isSupportedSourceToken(
    token?: TokenConfig,
    destToken?: TokenConfig,
    sourceChain?: ChainName | ChainId,
    destChain?: ChainName | ChainId,
  ): Promise<boolean> {
    if (!token) return false;
    // if (destToken) {
    //   const wrapped = getWrappedToken(token);
    //   return wrapped.key === destToken.key;
    // }

    if (!sourceChain) return true;
    const chainName = config.wh.toChainName(sourceChain);
    if (!token.tokenId && token.nativeChain !== chainName) {
      return false;
    }
    if (isTBTCToken(token) && token.nativeChain !== chainName) {
      return false;
    }
    return true;
  }

  async isSupportedDestToken(
    token?: TokenConfig,
    sourceToken?: TokenConfig,
    sourceChain?: ChainName | ChainId,
    destChain?: ChainName | ChainId,
  ): Promise<boolean> {
    if (!token) return false;
    if (!token.tokenId) return false;
    if (destChain && isIlliquidDestToken(token, destChain)) return false;
    if (isTBTCToken(token)) return false;
    if (sourceToken) {
      const wrapped = getWrappedToken(sourceToken);
      return wrapped.key === token.key;
    }
    return true;
  }

  async supportedSourceTokens(
    tokens: TokenConfig[],
    destToken?: TokenConfig,
    sourceChain?: ChainName | ChainId,
  ): Promise<TokenConfig[]> {
    if (!destToken) return tokens;
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

  async isRouteAvailable(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    return true;
  }

  async getPreview(
    token: TokenConfig,
    destToken: TokenConfig,
    amount: number,
    sendingChain: ChainName | ChainId,
    receipientChain: ChainName | ChainId,
    sendingGasEst: string,
    claimingGasEst: string,
    receiveAmount: string,
    tokenPrices: TokenPrices,
    routeOptions?: any,
  ): Promise<TransferDisplayData> {
    const sendingChainName = config.wh.toChainName(sendingChain);
    const receipientChainName = config.wh.toChainName(receipientChain);
    const sourceGasToken = config.chains[sendingChainName]?.gasToken;
    const destinationGasToken = config.chains[receipientChainName]?.gasToken;
    const sourceGasTokenSymbol = sourceGasToken
      ? getDisplayName(config.tokens[sourceGasToken])
      : '';
    const destinationGasTokenSymbol = destinationGasToken
      ? getDisplayName(config.tokens[destinationGasToken])
      : '';

    // Calculate the USD value of the gas
    const sendingGasEstPrice = calculateUSDPrice(
      sendingGasEst,
      tokenPrices,
      config.tokens[sourceGasToken || ''],
    );
    const claimingGasEstPrice = calculateUSDPrice(
      claimingGasEst,
      tokenPrices,
      config.tokens[destinationGasToken || ''],
    );

    return [
      {
        title: 'Amount',
        value: `${!isNaN(amount) ? amount : '0'} ${getDisplayName(destToken)}`,
        valueUSD: calculateUSDPrice(amount, tokenPrices, destToken),
      },
      {
        title: 'Total fee estimates',
        value:
          sendingGasEst && claimingGasEst
            ? `${sendingGasEst} ${sourceGasTokenSymbol} & ${claimingGasEst} ${destinationGasTokenSymbol}`
            : '',
        valueUSD:
          sendingGasEst && claimingGasEst
            ? `${sendingGasEstPrice || NO_INPUT} & ${
                claimingGasEstPrice || NO_INPUT
              }`
            : '',
        rows: [
          {
            title: 'Source chain gas estimate',
            value: sendingGasEst
              ? `~ ${sendingGasEst} ${sourceGasTokenSymbol}`
              : 'Not available',
            valueUSD: sendingGasEstPrice,
          },
          {
            title: 'Destination chain gas estimate',
            value: claimingGasEst
              ? `~ ${claimingGasEst} ${destinationGasTokenSymbol}`
              : 'Not available',
            valueUSD: claimingGasEstPrice,
          },
        ],
      },
    ];
  }

  async getTransferSourceInfo<T extends TransferInfoBaseParams>(
    params: T,
  ): Promise<TransferDisplayData> {
    const { tokenKey, amount, tokenDecimals, fromChain, gasFee } =
      params.txData;
    const tokenPrices = params.tokenPrices;
    const formattedAmt = toNormalizedDecimals(
      amount,
      tokenDecimals,
      MAX_DECIMALS,
    );
    const { gasToken: sourceGasTokenKey } = config.chains[fromChain]!;
    const sourceGasToken = config.tokens[sourceGasTokenKey];
    const decimals = getTokenDecimals(
      toChainId(sourceGasToken.nativeChain),
      'native',
    );
    const formattedGas = gasFee && toDecimals(gasFee, decimals, MAX_DECIMALS);
    const token = config.tokens[tokenKey];

    return [
      {
        title: 'Amount',
        value: `${formattedAmt} ${getDisplayName(token)}`,
        valueUSD: calculateUSDPrice(formattedAmt, tokenPrices, token),
      },
      {
        title: 'Gas fee',
        value: formattedGas
          ? `${formattedGas} ${getDisplayName(sourceGasToken)}`
          : NO_INPUT,
        valueUSD: calculateUSDPrice(formattedGas, tokenPrices, sourceGasToken),
      },
    ];
  }

  async getTransferDestInfo<T extends TransferDestInfoBaseParams>(
    params: T,
  ): Promise<TransferDestInfo> {
    const {
      txData: { tokenKey, amount, tokenDecimals, toChain },
      tokenPrices,
      receiveTx,
      gasEstimate,
    } = params;
    const token = config.tokens[tokenKey];
    const { gasToken } = config.chains[toChain]!;

    let gas = gasEstimate;
    if (receiveTx) {
      const gasFee = await config.wh.getTxGasFee(toChain, receiveTx);
      if (gasFee) {
        gas = formatGasFee(toChain, gasFee);
      }
    }

    const formattedAmt = toNormalizedDecimals(
      amount,
      tokenDecimals,
      MAX_DECIMALS,
    );

    return {
      route: this.TYPE,
      displayData: [
        {
          title: 'Amount',
          value: `${formattedAmt} ${getDisplayName(token)}`,
          valueUSD: calculateUSDPrice(formattedAmt, tokenPrices, token),
        },
        {
          title: receiveTx ? 'Gas fee' : 'Gas estimate',
          value: gas
            ? `${gas} ${getDisplayName(config.tokens[gasToken])}`
            : NO_INPUT,
          valueUSD: calculateUSDPrice(
            gas,
            tokenPrices,
            config.tokens[gasToken],
          ),
        },
      ],
    };
  }

  async isTransferCompleted(
    destChain: ChainName | ChainId,
    messageInfo: SignedMessage,
  ): Promise<boolean> {
    if (!isSignedWormholeMessage(messageInfo)) {
      throw new Error('Invalid signed message');
    }
    return config.wh.isTransferCompleted(destChain, hexlify(messageInfo.vaa));
  }

  async computeReceiveAmountWithFees(
    sendAmount: number,
    token: string,
    destToken: string,
    sendingChain: ChainName | undefined,
    recipientChain: ChainName | undefined,
    routeOptions: any,
  ): Promise<number> {
    return this.computeReceiveAmount(
      sendAmount,
      token,
      destToken,
      sendingChain,
      recipientChain,
      routeOptions,
    );
  }

  getMaxSendAmount(): number {
    return Infinity;
  }

  getMinSendAmount(routeOptions: any): number {
    return 0;
  }
}
