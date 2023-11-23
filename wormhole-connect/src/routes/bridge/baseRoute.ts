import { ChainId, ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { TokenConfig } from 'config/types';
import {
  MAX_DECIMALS,
  getDisplayName,
  getTokenDecimals,
  getWrappedToken,
  toNormalizedDecimals,
} from 'utils';
import { RouteAbstract } from '../abstracts';
import { toChainId, wh } from 'utils/sdk';
import { CHAINS, TOKENS } from 'config';
import {
  TransferDisplayData,
  TransferInfoBaseParams,
  TransferDestInfoBaseParams,
  SignedMessage,
  isSignedWormholeMessage,
} from 'routes/types';
import { formatGasFee } from 'routes/utils';
import { toDecimals } from 'utils/balance';
import { NO_INPUT } from 'utils/style';
import { hexlify } from 'ethers/lib/utils.js';

export abstract class BaseRoute extends RouteAbstract {
  async isSupportedSourceToken(
    token: TokenConfig | undefined,
    destToken: TokenConfig | undefined,
    sourceChain?: ChainName | ChainId,
  ): Promise<boolean> {
    if (!token) return false;
    // if (destToken) {
    //   const wrapped = getWrappedToken(token);
    //   return wrapped.key === destToken.key;
    // }

    if (!sourceChain) return true;
    const chainName = wh.toChainName(sourceChain);
    if (!token.tokenId && token.nativeChain !== chainName) {
      return false;
    }
    return true;
  }

  async isSupportedDestToken(
    token: TokenConfig | undefined,
    sourceToken: TokenConfig | undefined,
  ): Promise<boolean> {
    if (!token) return false;
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

  async getPreview(
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
    const receipientChainName = wh.toChainName(receipientChain);
    const sourceGasToken = CHAINS[sendingChainName]?.gasToken;
    const destinationGasToken = CHAINS[receipientChainName]?.gasToken;
    const sourceGasTokenSymbol = sourceGasToken
      ? getDisplayName(TOKENS[sourceGasToken])
      : '';
    const destinationGasTokenSymbol = destinationGasToken
      ? getDisplayName(TOKENS[destinationGasToken])
      : '';
    return [
      {
        title: 'Amount',
        value: `${amount} ${getDisplayName(destToken)}`,
      },
      {
        title: 'Total fee estimates',
        value:
          sendingGasEst && claimingGasEst
            ? `${sendingGasEst} ${sourceGasTokenSymbol} & ${claimingGasEst} ${destinationGasTokenSymbol}`
            : '',
        rows: [
          {
            title: 'Source chain gas estimate',
            value: sendingGasEst
              ? `~ ${sendingGasEst} ${sourceGasTokenSymbol}`
              : 'Not available',
          },
          {
            title: 'Destination chain gas estimate',
            value: claimingGasEst
              ? `~ ${claimingGasEst} ${destinationGasTokenSymbol}`
              : 'Not available',
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
    const formattedAmt = toNormalizedDecimals(
      amount,
      tokenDecimals,
      MAX_DECIMALS,
    );
    const { gasToken: sourceGasTokenKey } = CHAINS[fromChain]!;
    const sourceGasToken = TOKENS[sourceGasTokenKey];
    const decimals = getTokenDecimals(
      toChainId(sourceGasToken.nativeChain),
      'native',
    );
    const formattedGas = gasFee && toDecimals(gasFee, decimals, MAX_DECIMALS);
    const token = TOKENS[tokenKey];

    return [
      {
        title: 'Amount',
        value: `${formattedAmt} ${getDisplayName(token)}`,
      },
      {
        title: 'Gas fee',
        value: formattedGas
          ? `${formattedGas} ${getDisplayName(sourceGasToken)}`
          : NO_INPUT,
      },
    ];
  }

  async getTransferDestInfo<T extends TransferDestInfoBaseParams>(
    params: T,
  ): Promise<TransferDisplayData> {
    const {
      txData: { tokenKey, amount, tokenDecimals, toChain },
      receiveTx,
      gasEstimate,
    } = params;
    const token = TOKENS[tokenKey];
    const { gasToken } = CHAINS[toChain]!;

    let gas = gasEstimate;
    if (receiveTx) {
      const gasFee = await wh.getTxGasFee(toChain, receiveTx);
      if (gasFee) {
        gas = formatGasFee(toChain, gasFee);
      }
    }

    const formattedAmt = toNormalizedDecimals(
      amount,
      tokenDecimals,
      MAX_DECIMALS,
    );

    return [
      {
        title: 'Amount',
        value: `${formattedAmt} ${getDisplayName(token)}`,
      },
      {
        title: receiveTx ? 'Gas fee' : 'Gas estimate',
        value: gas ? `${gas} ${getDisplayName(TOKENS[gasToken])}` : NO_INPUT,
      },
    ];
  }

  async isTransferCompleted(
    destChain: ChainName | ChainId,
    messageInfo: SignedMessage,
  ): Promise<boolean> {
    if (!isSignedWormholeMessage(messageInfo)) {
      throw new Error('Invalid signed message');
    }
    return wh.isTransferCompleted(destChain, hexlify(messageInfo.vaa));
  }
}
