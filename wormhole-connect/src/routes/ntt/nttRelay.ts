import { Route, TokenConfig } from 'config/types';
import { BigNumber } from 'ethers';
import { getNttManager } from './chains';
import { ChainName, ChainId } from '@wormhole-foundation/wormhole-connect-sdk';
import { NttBase } from './nttBase';
import {
  RelayerFee,
  TransferDisplayData,
  TransferInfoBaseParams,
  UnsignedMessage,
  isUnsignedNttMessage,
} from 'routes/types';
import {
  MAX_DECIMALS,
  calculateUSDPrice,
  getDisplayName,
  getTokenDecimals,
  toNormalizedDecimals,
} from 'utils';
import {
  ParsedRelayerMessage,
  isEvmChain,
  toChainId,
  toChainName,
} from 'utils/sdk';
import { NO_INPUT } from 'utils/style';
import { TokenPrices } from 'store/tokenPrices';
import { toDecimals, toFixedDecimals } from 'utils/balance';
import { NttManagerEvm, WormholeTransceiver } from './chains/evm';
import { NttQuoter } from './chains/solana/nttQuoter';
import config from 'config';
import {
  getNttGroupKey,
  getNttManagerAddress,
  getNttManagerConfig,
  getNttManagerConfigByAddress,
} from 'utils/ntt';

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
    const groupKey = getNttGroupKey(
      config.tokens[sourceToken],
      config.tokens[destToken],
    );
    if (!groupKey) return false;
    const nttConfig = getNttManagerConfig(config.tokens[sourceToken], groupKey);
    if (!nttConfig) return false;
    if (
      !(await super.isRouteSupported(
        sourceToken,
        destToken,
        amount,
        sourceChain,
        destChain,
      ))
    ) {
      return false;
    }
    if (isEvmChain(sourceChain)) {
      if (nttConfig.transceivers[0].type !== 'wormhole') return false;
      const transceiver = new WormholeTransceiver(
        sourceChain,
        nttConfig.transceivers[0].address,
      );
      return await Promise.all([
        transceiver.isWormholeRelayingEnabled(destChain),
        transceiver.isSpecialRelayingEnabled(destChain),
      ]).then((results) => results.some((r) => r));
    }
    if (toChainName(sourceChain) === 'solana') {
      if (!nttConfig.solanaQuoter) return false;
      const quoter = new NttQuoter(nttConfig.solanaQuoter);
      return await quoter.isRelayEnabled(destChain);
    }
    return false;
  }

  async getRelayerFee(
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    token: string,
    destToken: string,
  ): Promise<RelayerFee | null> {
    const groupKey = getNttGroupKey(
      config.tokens[token],
      config.tokens[destToken],
    );
    if (!groupKey) throw new Error('no ntt group');
    const nttManagerAddress = getNttManagerAddress(
      config.tokens[token],
      groupKey,
    );
    if (!nttManagerAddress) throw new Error('no ntt manager address');
    const nttConfig = getNttManagerConfigByAddress(
      nttManagerAddress,
      toChainName(sourceChain),
    );
    if (!nttConfig) throw new Error('no ntt config');
    if (isEvmChain(sourceChain)) {
      const nttManager = new NttManagerEvm(sourceChain, nttManagerAddress);
      if (nttConfig.transceivers[0].type !== 'wormhole')
        throw new Error('no wormhole transceiver');
      const deliveryPrice = await nttManager.quoteDeliveryPrice(
        destChain,
        false,
      );
      return { fee: deliveryPrice, feeToken: 'native' };
    }
    if (toChainName(sourceChain) === 'solana') {
      if (!nttConfig.solanaQuoter) throw new Error('no solana quoter');
      const quoter = new NttQuoter(nttConfig.solanaQuoter);
      const relayCost = await quoter.calcRelayCost(
        destChain,
        nttConfig.address,
      );
      return { fee: BigNumber.from(relayCost.toString()), feeToken: 'native' };
    }
    throw new Error('unsupported chain');
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
    const sendingChainName = toChainName(sendingChain);
    const sourceGasToken = config.chains[sendingChainName]?.gasToken;
    const sourceGasTokenSymbol = sourceGasToken
      ? getDisplayName(config.tokens[sourceGasToken])
      : '';
    // Calculate the USD value of the gas
    const sendingGasEstPrice = calculateUSDPrice(
      sendingGasEst,
      tokenPrices,
      config.tokens[sourceGasToken || ''],
    );
    const relayerFeePrice = calculateUSDPrice(
      routeOptions.relayerFee,
      tokenPrices,
      config.tokens[sourceGasToken || ''],
    );
    let totalFeesText = '';
    let totalFeesPrice = '';
    if (
      sendingGasEst &&
      sourceGasToken &&
      routeOptions.relayerFee !== undefined
    ) {
      const feeValue =
        routeOptions.relayerFee + Number.parseFloat(sendingGasEst);
      totalFeesText = toFixedDecimals(feeValue.toString(), 6);
      totalFeesPrice = calculateUSDPrice(
        feeValue,
        tokenPrices,
        config.tokens[sourceGasToken],
      );
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
    const txData = params.txData as ParsedRelayerMessage;
    const { tokenKey, amount, tokenDecimals, fromChain, gasFee, relayerFee } =
      txData;
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
    const formattedFee =
      relayerFee && toDecimals(relayerFee, decimals, MAX_DECIMALS);
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
      {
        title: 'Relayer fee',
        value: formattedFee
          ? `${formattedFee} ${getDisplayName(sourceGasToken)}`
          : NO_INPUT,
        valueUSD: calculateUSDPrice(formattedFee, tokenPrices, sourceGasToken),
      },
    ];
  }

  async tryFetchRedeemTx(txData: UnsignedMessage): Promise<string | undefined> {
    if (!isUnsignedNttMessage(txData)) {
      throw new Error('invalid txData');
    }
    const { toChain, recipientNttManager, messageDigest } = txData;
    const nttManager = getNttManager(toChain, recipientNttManager);
    try {
      return await nttManager.fetchRedeemTx(messageDigest);
    } catch (e) {
      console.error(e);
    }
    return undefined;
  }
}
