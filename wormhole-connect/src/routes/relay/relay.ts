import {
  TokenId,
  ChainName,
  ChainId,
  MAINNET_CHAINS,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber, utils } from 'ethers';

import config from 'config';
import { TokenConfig, Route } from 'config/types';
import {
  MAX_DECIMALS,
  fromNormalizedDecimals,
  getTokenDecimals,
  getWrappedTokenId,
  toNormalizedDecimals,
  getDisplayName,
  calculateUSDPrice,
  getTokenById,
} from 'utils';
import {
  fetchRedeemedEvent,
  fetchRedeemedEventSender,
} from '../../utils/events';
import {
  isAcceptedToken,
  ParsedRelayerMessage,
  toChainId,
  calculateNativeTokenAmt,
  calculateMaxSwapAmount,
  PayloadType,
  toChainName,
} from 'utils/sdk';
import { NO_INPUT } from 'utils/style';
import { TransferWallet, postVaa, signAndSendTransaction } from 'utils/wallet';
import { BridgeRoute } from '../bridge/bridge';
import { toDecimals, toFixedDecimals } from '../../utils/balance';
import {
  RelayTransferMessage,
  RelayerFee,
  SignedRelayTransferMessage,
  TransferDestInfo,
  TransferDisplayData,
  isSignedWormholeMessage,
} from '../types';
import { adaptParsedMessage } from '../utils';
import { fetchSwapEvent } from '../../utils/events';
import {
  UnsignedMessage,
  SignedMessage,
  TransferInfoBaseParams,
} from '../types';
import { fetchVaa } from '../../utils/vaa';
import { RelayOptions, TransferDestInfoParams } from './types';
import {
  AvailableReason,
  REASON_AMOUNT_TOO_LOW,
  RelayAbstract,
} from 'routes/abstracts';
import { arrayify } from 'ethers/lib/utils.js';
import { TokenPrices } from 'store/tokenPrices';

export class RelayRoute extends BridgeRoute implements RelayAbstract {
  readonly NATIVE_GAS_DROPOFF_SUPPORTED = true;
  readonly AUTOMATIC_DEPOSIT = true;
  readonly TYPE = Route.Relay;

  isSupportedChain(chain: ChainName): boolean {
    return !!config.chains[chain]?.contracts.relayer;
  }

  async isRouteSupported(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    if (!config.routes.includes(Route.Relay)) {
      return false;
    }

    const isBridgeRouteAvailable = await super.isRouteSupported(
      sourceToken,
      destToken,
      amount,
      sourceChain,
      destChain,
    );
    if (!isBridgeRouteAvailable) return false;
    const sourceContracts = config.wh.mustGetContracts(sourceChain);
    const destContracts = config.wh.mustGetContracts(destChain);
    if (!sourceContracts.relayer || !destContracts.relayer) {
      return false;
    }
    const tokenConfig = config.tokens[sourceToken]!;
    const tokenId = getWrappedTokenId(tokenConfig);
    return isAcceptedToken(tokenId);
  }

  async isRouteAvailable(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<AvailableReason> {
    const tokenConfig = config.tokens[sourceToken]!;
    const tokenId = getWrappedTokenId(tokenConfig);
    let relayerFee;
    try {
      const result = await this.getRelayerFee(
        sourceChain,
        destChain,
        sourceToken,
        destToken,
      );
      relayerFee = result?.fee;
    } catch (e) {
      console.error(e);
    }
    const decimals = getTokenDecimals(
      config.wh.toChainId(sourceChain),
      tokenId,
    );
    const available = !(
      relayerFee === undefined ||
      parseFloat(amount) <
        this.getMinSendAmount(tokenId, destChain, {
          relayerFee: toDecimals(relayerFee, decimals),
          toNativeToken: 0,
        })
    );
    return {
      isAvailable: available,
      ...(!available && { reason: REASON_AMOUNT_TOO_LOW }),
    };
  }

  async isSupportedSourceToken(
    token?: TokenConfig,
    destToken?: TokenConfig,
    sourceChain?: ChainName | ChainId,
  ): Promise<boolean> {
    if (!token) return false;
    const isSupportedBridgeToken = await super.isSupportedSourceToken(
      token,
      destToken,
      sourceChain,
    );
    if (!isSupportedBridgeToken) return false;
    const tokenId = getWrappedTokenId(token);
    return await isAcceptedToken(tokenId);
  }

  async isSupportedDestToken(
    token?: TokenConfig,
    sourceToken?: TokenConfig,
    sourceChain?: ChainName | ChainId,
    destChain?: ChainName | ChainId,
  ): Promise<boolean> {
    if (!token) return false;
    const isSupportedBridgeToken = await super.isSupportedDestToken(
      token,
      sourceToken,
      sourceChain,
      destChain,
    );
    if (!isSupportedBridgeToken) return false;
    const tokenId = getWrappedTokenId(token);
    return await isAcceptedToken(tokenId);
  }

  async supportedSourceTokens(
    tokens: TokenConfig[],
    destToken?: TokenConfig,
    sourceChain?: ChainName | ChainId,
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
    sendAmount: number,
    token: string,
    destToken: string,
    sendingChain: ChainName | undefined,
    recipientChain: ChainName | undefined,
    routeOptions: RelayOptions,
  ): Promise<number> {
    if (!sendAmount) return 0;

    const { toNativeToken, relayerFee } = routeOptions;

    // floating point math
    const DECIMALS = 10 ** 8;
    return (
      (Math.round(sendAmount * DECIMALS) -
        Math.round((toNativeToken || 0) * DECIMALS) -
        Math.round((relayerFee || 0) * DECIMALS)) /
      DECIMALS
    );
  }
  async computeSendAmount(
    receiveAmount: number | undefined,
    routeOptions: RelayOptions,
  ): Promise<number> {
    if (!receiveAmount) return 0;
    return receiveAmount + (routeOptions?.toNativeToken || 0);
  }

  async nativeTokenAmount(
    destChain: ChainName | ChainId,
    token: TokenId,
    amount: BigNumber,
    walletAddress: string,
  ): Promise<BigNumber> {
    return calculateNativeTokenAmt(destChain, token, amount, walletAddress);
  }

  async maxSwapAmount(
    destChain: ChainName | ChainId,
    token: TokenId,
    walletAddress: string,
  ): Promise<BigNumber> {
    return calculateMaxSwapAmount(destChain, token, walletAddress);
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
  ): Promise<BigNumber> {
    const { relayerFee, toNativeToken } = routeOptions;
    const sendGas = await config.wh.estimateSendWithRelayGas(
      token,
      amount,
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
      relayerFee,
      toNativeToken ? `${routeOptions.toNativeToken}` : '0',
    );
    if (!sendGas) throw new Error('could not estimate gas');
    return sendGas;
  }

  async estimateClaimGas(
    destChain: ChainName | ChainId,
    signedMessage?: SignedMessage,
  ): Promise<BigNumber> {
    if (!signedMessage)
      throw new Error('Cannot estimate gas without a signed message');
    throw new Error(
      'manual claim not implemented for automatic token bridge relays',
    );
  }

  /**
   * These operations have to be implemented in subclasses.
   */
  getMinSendAmount(
    token: TokenId | 'native',
    recipientChain: ChainName | ChainId,
    routeOptions: any,
  ): number {
    const { relayerFee, toNativeToken } = routeOptions;

    // has to be slightly higher than the minimum or else tx will revert
    const fees = parseFloat(relayerFee) + parseFloat(toNativeToken);
    let min = fees * 1.05;

    if (
      toChainName(recipientChain) === 'solana' &&
      token !== 'native' &&
      getTokenById(token)?.key === 'WSOL'
    ) {
      // the minimum rent-exempt balance required for a solana wallet is 0.00089088 SOL
      // the transfer tx on solana will fail if the resulting balance is below this amount
      min += 0.00089088;
    }

    return Number.parseFloat(min.toFixed(6));
  }
  async send(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    destToken: string,
    routeOptions: RelayOptions,
  ): Promise<string> {
    const fromChainId = config.wh.toChainId(sendingChain);
    const fromChainName = config.wh.toChainName(sendingChain);
    const decimals = getTokenDecimals(fromChainId, token);
    const parsedAmt = utils.parseUnits(amount, decimals);
    if (!config.wh.supportsSendWithRelay(fromChainId)) {
      throw new Error(`send with relay not supported`);
    }
    const parsedNativeAmt = routeOptions.toNativeToken
      ? utils
          .parseUnits(routeOptions.toNativeToken.toString(), decimals)
          .toString()
      : '0';
    const tx = await config.wh.sendWithRelay(
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
    config.wh.registerProviders();
    return txId;
  }

  async redeem(
    destChain: ChainName | ChainId,
    signedMessage: SignedMessage,
    payer: string,
  ): Promise<string> {
    if (!isSignedWormholeMessage(signedMessage)) {
      throw new Error('Invalid signed message');
    }
    const destChainId = config.wh.toChainId(destChain);
    const destChainName = config.wh.toChainName(destChain);
    if (destChainId === MAINNET_CHAINS.solana) {
      const destContext = config.wh.getContext(destChain) as any;
      const connection = destContext.connection;
      if (!connection) throw new Error('no connection');
      const contracts = config.wh.mustGetContracts(destChain);
      if (!contracts.core) throw new Error('contract not found');
      await postVaa(
        connection,
        contracts.core,
        Buffer.from(arrayify(signedMessage.vaa, { allowMissingPrefix: true })),
      );
    }
    const tx = await config.wh.redeemRelay(
      destChain,
      arrayify(signedMessage.vaa),
      undefined,
      payer,
    );
    const txId = await signAndSendTransaction(
      destChainName,
      tx,
      TransferWallet.RECEIVING,
    );
    config.wh.registerProviders();
    return txId;
  }

  async getMessage(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<UnsignedMessage> {
    const message = await config.wh.getMessage(tx, chain);
    const parsed = (await adaptParsedMessage(message)) as ParsedRelayerMessage;
    if (parsed.payloadID !== PayloadType.Automatic) {
      throw new Error('wrong payload, not a token bridge relay transfer');
    }
    return {
      ...parsed,
      relayerFee: parsed.relayerFee.toString(),
      toNativeTokenAmount: parsed.toNativeTokenAmount.toString(),
    };
  }

  async getSignedMessage(
    message: RelayTransferMessage,
  ): Promise<SignedRelayTransferMessage> {
    const vaa = await fetchVaa(message);

    if (!vaa) {
      throw new Error('VAA not found');
    }

    return {
      ...message,
      vaa: utils.hexlify(vaa.bytes),
    };
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
    routeOptions: RelayOptions,
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
    const { relayerFee, receiveNativeAmt } = routeOptions;
    const isNative = token.key === sourceGasToken;

    let totalFeesText = '';
    let totalFeesPrice = '';
    if (sendingGasEst && relayerFee !== undefined) {
      const feeValue =
        relayerFee + (isNative ? Number.parseFloat(sendingGasEst) : 0);
      const fee = toFixedDecimals(`${feeValue}`, 6);
      totalFeesText = isNative
        ? `${fee} ${getDisplayName(token)}`
        : `${sendingGasEst} ${sourceGasTokenSymbol} & ${fee} ${getDisplayName(
            token,
          )}`;
      totalFeesPrice = isNative
        ? calculateUSDPrice(feeValue, tokenPrices, token)
        : `${
            calculateUSDPrice(
              sendingGasEst,
              tokenPrices,
              config.tokens[sourceGasToken || ''],
            ) || NO_INPUT
          } & ${calculateUSDPrice(feeValue, tokenPrices, token) || NO_INPUT}`;
    }

    const receiveAmt = await this.computeReceiveAmount(
      amount,
      token.key,
      destToken.key,
      sendingChainName,
      receipientChainName,
      routeOptions,
    );

    const nativeGasDisplay =
      receiveNativeAmt > 0
        ? [
            {
              title: 'Native gas on destination',
              value: `${receiveNativeAmt} ${destinationGasTokenSymbol}`,
              valueUSD: calculateUSDPrice(
                receiveNativeAmt,
                tokenPrices,
                config.tokens[destinationGasToken || ''],
              ),
            },
          ]
        : [];

    return [
      {
        title: 'Amount',
        value: `${toFixedDecimals(`${receiveAmt}`, 6)} ${getDisplayName(
          destToken,
        )}`,
        valueUSD: calculateUSDPrice(receiveAmt, tokenPrices, destToken),
      },
      ...nativeGasDisplay,
      {
        title: 'Total fee estimates',
        value: totalFeesText,
        valueUSD: totalFeesPrice,
        rows: [
          {
            title: 'Source chain gas estimate',
            value: sendingGasEst
              ? `~ ${sendingGasEst} ${sourceGasTokenSymbol}`
              : NO_INPUT,
            valueUSD: calculateUSDPrice(
              sendingGasEst,
              tokenPrices,
              config.tokens[sourceGasToken || ''],
            ),
          },
          {
            title: 'Relayer fee',
            value:
              relayerFee !== undefined
                ? `${relayerFee} ${getDisplayName(token)}`
                : NO_INPUT,
            valueUSD: calculateUSDPrice(relayerFee, tokenPrices, token),
          },
        ],
      },
    ];
  }

  async getRelayerFee(
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    token: string,
    destToken: string,
  ): Promise<RelayerFee | null> {
    const context: any = config.wh.getContext(sourceChain);
    const tokenConfig = config.tokens[token];
    if (!tokenConfig) throw new Error('could not get token config');
    const tokenId = tokenConfig.tokenId || getWrappedTokenId(tokenConfig);
    const fee = context.getRelayerFee
      ? await context.getRelayerFee(sourceChain, destChain, tokenId)
      : BigNumber.from(0);
    return { fee, feeToken: tokenId };
  }

  async getTransferSourceInfo({
    txData: data,
    tokenPrices,
  }: TransferInfoBaseParams): Promise<TransferDisplayData> {
    const txData = data as ParsedRelayerMessage;

    const formattedAmt = toNormalizedDecimals(
      txData.amount,
      txData.tokenDecimals,
      MAX_DECIMALS,
    );
    const { gasToken: sourceGasTokenKey } = config.chains[txData.fromChain]!;
    const sourceGasToken = config.tokens[sourceGasTokenKey];
    const decimals = getTokenDecimals(
      toChainId(sourceGasToken.nativeChain),
      'native',
    );
    const formattedGas =
      txData.gasFee && toDecimals(txData.gasFee, decimals, MAX_DECIMALS);
    const token = config.tokens[txData.tokenKey];

    // automatic transfers
    const formattedFee = toNormalizedDecimals(
      txData.relayerFee,
      txData.tokenDecimals,
      MAX_DECIMALS,
    );
    const { gasToken } = config.chains[txData.toChain]!;
    const rows = [
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
        value: `${formattedFee} ${getDisplayName(token)}`,
        valueUSD: calculateUSDPrice(formattedFee, tokenPrices, token),
      },
    ];

    if (!BigNumber.from(txData.toNativeTokenAmount).isZero()) {
      const formattedToNative = toNormalizedDecimals(
        txData.toNativeTokenAmount,
        txData.tokenDecimals,
        MAX_DECIMALS,
      );

      rows.push({
        title: 'Convert to native gas token',
        value: `≈ ${formattedToNative} ${getDisplayName(
          token,
        )} \u2192 ${getDisplayName(config.tokens[gasToken])}`,
        valueUSD: calculateUSDPrice(formattedToNative, tokenPrices, token),
      });
    }

    return rows;
  }

  async getTransferDestInfo({
    txData: data,
    tokenPrices,
    receiveTx,
    transferComplete,
  }: TransferDestInfoParams): Promise<TransferDestInfo> {
    const txData: SignedRelayTransferMessage =
      data as SignedRelayTransferMessage;

    const token = config.tokens[txData.tokenKey];
    const { gasToken } = config.chains[txData.toChain]!;

    // calculate the amount of native gas received
    let nativeGasAmt: string | undefined;
    if (receiveTx) {
      let nativeSwapAmount: any;
      try {
        nativeSwapAmount = await fetchSwapEvent(txData);
      } catch (e) {
        console.error(`could not fetch swap event:\n${e}`);
      }
      if (nativeSwapAmount) {
        const decimals = getTokenDecimals(
          config.wh.toChainId(txData.toChain),
          'native',
        );
        nativeGasAmt = toDecimals(nativeSwapAmount, decimals, MAX_DECIMALS);
      }
    }
    if (!nativeGasAmt) {
      let sender;
      try {
        sender = await fetchRedeemedEventSender(txData);
      } catch (e) {
        console.error(e);
      }
      // if the sender is the recipient, then this was a manual claim
      // and no native gas was received or relayer fee paid
      if (sender && sender === txData.recipient) {
        const amount = toNormalizedDecimals(
          txData.amount,
          txData.tokenDecimals,
          MAX_DECIMALS,
        );
        return {
          route: this.TYPE,
          displayData: [
            {
              title: 'Amount',
              value: `${amount} ${getDisplayName(token)}`,
              valueUSD: calculateUSDPrice(amount, tokenPrices, token),
            },
            {
              title: 'Native gas token',
              value: `${NO_INPUT}`,
            },
            {
              title: 'Relayer fee',
              value: `${NO_INPUT}`,
            },
          ],
        };
      }
      // get the decimals on the target chain
      const destinationTokenDecimals = getTokenDecimals(
        config.wh.toChainId(txData.toChain),
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
        config.wh.toChainId(txData.toChain),
        'native',
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

    return {
      route: this.TYPE,
      displayData: [
        {
          title: 'Amount',
          value: `${formattedAmt} ${getDisplayName(token)}`,
          valueUSD: calculateUSDPrice(formattedAmt, tokenPrices, token),
        },
        {
          title: 'Native gas token',
          value: nativeGasAmt
            ? `${nativeGasAmt} ${getDisplayName(config.tokens[gasToken])}`
            : NO_INPUT,
          valueUSD: calculateUSDPrice(
            nativeGasAmt,
            tokenPrices,
            config.tokens[gasToken],
          ),
        },
      ],
    };
  }

  async tryFetchRedeemTx(message: SignedMessage): Promise<string | undefined> {
    if (!isSignedWormholeMessage(message)) {
      throw new Error('Signed message is not for relay');
    }

    // if this is an automatic transfer and the transaction hash was not found,
    // then try to fetch the redeemed event
    let redeemTx: string | undefined = undefined;
    try {
      const res = await fetchRedeemedEvent(message);
      redeemTx = res?.transactionHash;
    } catch (e) {
      console.error(e);
    }

    return redeemTx;
  }
}
