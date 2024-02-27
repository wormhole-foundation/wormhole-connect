import { Route, TokenConfig } from 'config/types';
import { BigNumber } from 'ethers';
import { getNttManager, getWormholeTransceiver } from './platforms';
import { ChainName, ChainId } from '@wormhole-foundation/wormhole-connect-sdk';
import { NttBase } from './nttBase';
import { CHAINS, TOKENS } from 'config';
import {
  TransferDestInfo,
  TransferDestInfoBaseParams,
  TransferDisplayData,
  TransferInfoBaseParams,
  UnsignedMessage,
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
import { toDecimals, toFixedDecimals } from 'utils/balance';
import { NttManagerMessage } from './payloads/common';
import { NativeTokenTransfer } from './payloads/transfers';
import { WormholeTransceiverMessage } from './payloads/wormhole';

export class NttRelay extends NttBase {
  readonly NATIVE_GAS_DROPOFF_SUPPORTED: boolean = false;
  readonly AUTOMATIC_DEPOSIT: boolean = true;
  readonly TYPE: Route = Route.NttRelay;

  async isRouteSupported(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    const endpointAddress = TOKENS[sourceToken]?.ntt?.wormholeTransceiver;
    if (!endpointAddress) {
      return false;
    }
    const endpoint = getWormholeTransceiver(sourceChain, endpointAddress);
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
    if (!tokenConfig.ntt?.wormholeTransceiver) {
      throw new Error('invalid token');
    }
    const deliveryPrice = await getNttManager(
      sourceChain,
      tokenConfig.ntt.nttManager,
    ).quoteDeliveryPrice(destChain, tokenConfig.ntt.wormholeTransceiver);
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
    routeOptions: { relayerFee: number },
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
    let totalFeesText = '';
    let totalFeesPrice = '';
    if (sendingGasEst && routeOptions.relayerFee !== undefined) {
      const feeValue =
        routeOptions.relayerFee + Number.parseFloat(sendingGasEst);
      totalFeesText = toFixedDecimals(feeValue.toString(), 6);
      totalFeesPrice = calculateUSDPrice(feeValue, tokenPrices, token);
    }
    return [
      {
        title: 'Amount',
        value: `${!isNaN(amount) ? amount : '0'} ${getDisplayName(destToken)}`,
        valueUSD: calculateUSDPrice(amount, tokenPrices, destToken),
      },
      {
        title: 'Total fee estimates',
        value: totalFeesText ? `${totalFeesText} ${sourceGasTokenSymbol}` : '',
        valueUSD: totalFeesPrice ? `${totalFeesPrice || NO_INPUT}` : '',
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

  async tryFetchRedeemTx(txData: UnsignedMessage): Promise<string | undefined> {
    if (!isUnsignedNTTMessage(txData)) {
      throw new Error('invalid txData');
    }
    const { transceiverMessage, toChain, fromChain, recipientNttManager } =
      txData;
    const nttManagerMessage = WormholeTransceiverMessage.deserialize(
      Buffer.from(transceiverMessage.slice(2), 'hex'),
      (a) => NttManagerMessage.deserialize(a, NativeTokenTransfer.deserialize),
    ).ntt_managerPayload;
    const nttManager = getNttManager(toChain, recipientNttManager);
    try {
      return await nttManager.fetchRedeemTx(fromChain, nttManagerMessage);
    } catch (e) {
      console.error(e);
    }
  }
}
