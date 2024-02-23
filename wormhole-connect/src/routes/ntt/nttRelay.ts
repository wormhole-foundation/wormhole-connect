import { Route, TokenConfig } from 'config/types';
import { BigNumber } from 'ethers';
import { getManager, getWormholeEndpoint } from './platforms';
import { ChainName, ChainId } from '@wormhole-foundation/wormhole-connect-sdk';
import { NTTBase } from './nttBase';
import { CHAINS, TOKENS } from 'config';
import {
  TransferDestInfo,
  TransferDestInfoBaseParams,
  TransferDisplayData,
  TransferInfoBaseParams,
  isUnsignedNTTMessage,
} from 'routes/types';
import {
  MAX_DECIMALS,
  calculateUSDPrice,
  getDisplayName,
  getTokenDecimals,
  toNormalizedDecimals,
} from 'utils';
import { toChainId, wh } from 'utils/sdk';
import { NO_INPUT } from 'utils/style';
import { TokenPrices } from 'store/tokenPrices';
import { toDecimals } from 'utils/balance';

export class NTTRelay extends NTTBase {
  readonly NATIVE_GAS_DROPOFF_SUPPORTED: boolean = false;
  readonly AUTOMATIC_DEPOSIT: boolean = true;
  readonly TYPE: Route = Route.NTTRelay;

  async isRouteSupported(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    const endpointAddress = TOKENS[sourceToken]?.ntt?.wormholeEndpointAddress;
    if (!endpointAddress) {
      return false;
    }
    const endpoint = getWormholeEndpoint(sourceChain, endpointAddress);
    return await Promise.all([
      super.isRouteSupported(
        sourceToken,
        destToken,
        amount,
        sourceChain,
        destChain,
      ),
      endpoint.isWormholeRelayingEnabled(destChain),
      endpoint.isSpecialRelayingEnabled(destChain),
    ]).then((results) => results[0] && (results[1] || results[2]));
  }

  async getRelayerFee(
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    token: string,
    destToken: string,
  ): Promise<BigNumber> {
    const tokenConfig = TOKENS[token];
    if (!tokenConfig.ntt?.wormholeEndpointAddress) {
      throw new Error('invalid token');
    }
    const deliveryPrice = await getManager(
      sourceChain,
      tokenConfig.ntt.managerAddress,
    ).quoteDeliveryPrice(destChain, tokenConfig.ntt.wormholeEndpointAddress);
    return BigNumber.from(deliveryPrice);
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
    routeOptions: { relayerFee: string },
  ): Promise<TransferDisplayData> {
    const sendingChainName = wh.toChainName(sendingChain);
    const sourceGasToken = CHAINS[sendingChainName]?.gasToken;
    const sourceGasTokenSymbol = sourceGasToken
      ? getDisplayName(TOKENS[sourceGasToken])
      : '';
    // Calculate the USD value of the gas
    const sendingGasEstPrice = calculateUSDPrice(
      sendingGasEst,
      tokenPrices,
      TOKENS[sourceGasToken || ''],
    );
    const relayerFeePrice = calculateUSDPrice(
      routeOptions.relayerFee,
      tokenPrices,
      TOKENS[sourceGasToken || ''],
    );
    return [
      {
        title: 'Amount',
        value: `${!isNaN(amount) ? amount : '0'} ${getDisplayName(destToken)}`,
        valueUSD: calculateUSDPrice(amount, tokenPrices, destToken),
      },
      {
        title: 'Total fee estimates',
        value: sendingGasEst ? `${sendingGasEst} ${sourceGasTokenSymbol}` : '',
        valueUSD: sendingGasEst ? `${sendingGasEstPrice || NO_INPUT}` : '',
        rows: [
          {
            title: 'Source chain gas estimate',
            value: sendingGasEst
              ? `~ ${sendingGasEst} ${sourceGasTokenSymbol}`
              : 'Not available',
            valueUSD: sendingGasEstPrice,
          },
          {
            title: 'Relayer fee',
            value: routeOptions.relayerFee
              ? `${routeOptions.relayerFee} ${sourceGasTokenSymbol}`
              : NO_INPUT,
            valueUSD: relayerFeePrice,
          },
        ],
      },
    ];
  }

  async getTransferSourceInfo<T extends TransferInfoBaseParams>(
    params: T,
  ): Promise<TransferDisplayData> {
    if (!isUnsignedNTTMessage(params.txData)) {
      return [];
    }
    const { tokenKey, amount, tokenDecimals, fromChain, gasFee, relayerFee } =
      params.txData;
    const tokenPrices = params.tokenPrices;
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
    const formattedFee =
      relayerFee && toDecimals(relayerFee, decimals, MAX_DECIMALS);
    const token = TOKENS[tokenKey];

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
      {
        title: 'Relayer fee',
        value: formattedFee
          ? `${formattedFee} ${getDisplayName(sourceGasToken)}`
          : NO_INPUT,
        valueUSD: calculateUSDPrice(formattedFee, tokenPrices, sourceGasToken),
      },
    ];
  }

  async getTransferDestInfo<T extends TransferDestInfoBaseParams>(
    params: T,
  ): Promise<TransferDestInfo> {
    const {
      txData: { tokenKey, amount, tokenDecimals },
      tokenPrices,
    } = params;
    const token = TOKENS[tokenKey];
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
      ],
    };
  }
}
