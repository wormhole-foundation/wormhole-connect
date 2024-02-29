import {
  ChainId,
  ChainName,
  TokenId,
  EthContext,
  WormholeContext,
  MessageTransmitter__factory,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber, utils } from 'ethers';

import { CHAINS, ROUTES, TOKENS, sdkConfig } from 'config';
import { TokenConfig, Route } from 'config/types';
import {
  MAX_DECIMALS,
  getTokenDecimals,
  toNormalizedDecimals,
  fromNormalizedDecimals,
  getTokenById,
  getDisplayName,
  calculateUSDPrice,
} from 'utils';
import {
  ParsedMessage,
  ParsedRelayerMessage,
  PayloadType,
  toChainId,
  wh,
} from 'utils/sdk';
import { TransferWallet, signAndSendTransaction } from 'utils/wallet';
import { NO_INPUT } from 'utils/style';
import {
  TransferDisplayData,
  TransferInfoBaseParams,
  SignedMessage,
  RelayCCTPMessage,
  TransferDestInfoBaseParams,
  TransferDestInfo,
} from '../types';
import { toDecimals, toFixedDecimals } from '../../utils/balance';
import { RelayOptions } from '../relay';
import {
  CCTPTokenSymbol,
  CCTPManual_CHAINS as CCTPRelay_CHAINS,
  CCTP_LOG_MessageSent,
  CCTP_LOG_TokenMessenger_DepositForBurn,
  CCTPManualRoute,
  getChainNameCCTP,
  getForeignUSDCAddress,
  getNonce,
} from '../cctpManual';
import { getUnsignedVaaEvm } from 'utils/vaa';
import { getNativeVersionOfToken } from 'store/transferInput';
import { RelayAbstract } from 'routes/abstracts';
import { TokenPrices } from 'store/tokenPrices';

export class CCTPRelayRoute extends CCTPManualRoute implements RelayAbstract {
  readonly NATIVE_GAS_DROPOFF_SUPPORTED = true;
  readonly AUTOMATIC_DEPOSIT = true;
  readonly TYPE: Route = Route.CCTPRelay;

  isSupportedChain(chain: ChainName): boolean {
    return !!sdkConfig.chains[chain]?.contracts.cctpContracts
      ?.wormholeCircleRelayer;
  }

  async isSupportedSourceToken(
    token?: TokenConfig,
    destToken?: TokenConfig,
    sourceChain?: ChainName | ChainId,
    destChain?: ChainName | ChainId,
  ): Promise<boolean> {
    if (!token) return false;
    const sourceChainName = token.nativeChain;
    const sourceChainCCTP =
      CCTPRelay_CHAINS.includes(sourceChainName) &&
      (!sourceChain || wh.toChainName(sourceChain) === sourceChainName);

    if (destToken) {
      const destChainName = destToken.nativeChain;
      const destChainCCTP =
        CCTPRelay_CHAINS.includes(destChainName) &&
        (!destChain || wh.toChainName(destChain) === destChainName);

      return (
        destToken.symbol === CCTPTokenSymbol &&
        token.symbol === CCTPTokenSymbol &&
        sourceChainCCTP &&
        destChainCCTP
      );
    }
    return token.symbol === CCTPTokenSymbol && sourceChainCCTP;
  }

  async isSupportedDestToken(
    token?: TokenConfig,
    sourceToken?: TokenConfig,
    sourceChain?: ChainName | ChainId,
    destChain?: ChainName | ChainId,
  ): Promise<boolean> {
    if (!token) return false;
    const destChainName = token.nativeChain;
    const destChainCCTP =
      CCTPRelay_CHAINS.includes(destChainName) &&
      (!destChain || wh.toChainName(destChain) === destChainName);
    if (sourceToken) {
      const sourceChainName = sourceToken.nativeChain;
      const sourceChainCCTP =
        CCTPRelay_CHAINS.includes(sourceChainName) &&
        (!sourceChain || wh.toChainName(sourceChain) === sourceChainName);

      return (
        sourceToken.symbol === CCTPTokenSymbol &&
        token.symbol === CCTPTokenSymbol &&
        sourceChainCCTP &&
        destChainCCTP
      );
    }
    return token.symbol === CCTPTokenSymbol && destChainCCTP;
  }

  async supportedSourceTokens(
    tokens: TokenConfig[],
    destToken?: TokenConfig,
    sourceChain?: ChainName | ChainId,
    destChain?: ChainName | ChainId,
  ): Promise<TokenConfig[]> {
    if (!destToken) return tokens;
    const shouldAdd = await Promise.allSettled(
      tokens.map((token) =>
        this.isSupportedSourceToken(token, destToken, sourceChain, destChain),
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
    sourceChain?: ChainName | ChainId,
    destChain?: ChainName | ChainId,
  ): Promise<TokenConfig[]> {
    if (!sourceToken) return tokens;
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

  async isRouteSupported(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    if (!ROUTES.includes(Route.CCTPRelay)) {
      return false;
    }

    const sourceTokenConfig = TOKENS[sourceToken];
    const destTokenConfig = TOKENS[destToken];

    if (!sourceChain || !destChain || !sourceTokenConfig || !destTokenConfig)
      return false;

    const sourceChainName = wh.toChainName(sourceChain);
    const destChainName = wh.toChainName(destChain);

    if (sourceChainName === destChainName) return false;

    if (sourceTokenConfig.symbol !== CCTPTokenSymbol) return false;
    if (destTokenConfig.symbol !== CCTPTokenSymbol) return false;
    if (sourceTokenConfig.nativeChain !== sourceChainName) return false;
    if (destTokenConfig.nativeChain !== destChainName) return false;

    const chainsAreValid =
      CCTPRelay_CHAINS.includes(sourceChainName) &&
      CCTPRelay_CHAINS.includes(destChainName);

    if (!chainsAreValid) return false;

    const bothHaveRelayer =
      CHAINS[sourceChainName]?.contracts.cctpContracts?.wormholeCircleRelayer &&
      CHAINS[destChainName]?.contracts.cctpContracts?.wormholeCircleRelayer;

    return !!bothHaveRelayer;
  }

  async isRouteAvailable(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    let relayerFee;
    try {
      relayerFee = await this.getRelayerFee(
        sourceChain,
        destChain,
        sourceToken,
        destToken,
      );
    } catch (e) {
      console.error(e);
    }
    return !(
      relayerFee === undefined ||
      parseFloat(amount) <
        this.getMinSendAmount({
          relayerFee: toDecimals(relayerFee, 6),
          toNativeToken: 0,
        })
    );
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
    const DECIMALS = 10 ** 6;
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
    const { toNativeToken, relayerFee } = routeOptions;
    return receiveAmount + (toNativeToken || 0) + (relayerFee || 0);
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
    const provider = wh.mustGetProvider(sendingChain);
    const { gasPrice } = await provider.getFeeData();
    if (!gasPrice)
      throw new Error('gas price not available, cannot estimate fees');

    // only works on EVM
    const chainContext = wh.getContext(
      sendingChain,
    ) as EthContext<WormholeContext>;
    const circleRelayer =
      chainContext.contracts.mustGetWormholeCircleRelayer(sendingChain);
    const tokenAddr = await wh.mustGetForeignAsset(
      token as TokenId,
      sendingChain,
    );
    const fromChainId = wh.toChainId(sendingChain);
    const decimals = getTokenDecimals(fromChainId, token);
    const parsedAmt = utils.parseUnits(`${amount}`, decimals);

    const tx = await circleRelayer.populateTransaction.transferTokensWithRelay(
      chainContext.context.parseAddress(tokenAddr, sendingChain),
      parsedAmt,
      BigNumber.from(routeOptions.toNativeToken),
      wh.toChainId(recipientChain),
      chainContext.context.formatAddress(recipientAddress, recipientChain),
    );
    const est = await provider.estimateGas(tx);
    return est.mul(gasPrice);
  }

  async estimateClaimGas(
    destChain: ChainName | ChainId,
    signedMessage?: SignedMessage,
  ): Promise<BigNumber> {
    throw new Error('No claiming for this route!');
  }

  /**
   * These operations have to be implemented in subclasses.
   */
  getMinSendAmount(routeOptions: any): number {
    const { relayerFee, toNativeToken } = routeOptions;
    // has to be slightly higher than the minimum or else tx will revert
    const fees = parseFloat(relayerFee) + parseFloat(toNativeToken);
    const min = (fees * 1.05).toFixed(6);
    return Number.parseFloat(min);
  }

  async send(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    destToken: string,
    routeOptions: any,
  ): Promise<string> {
    const fromChainId = wh.toChainId(sendingChain);
    const fromChainName = wh.toChainName(sendingChain);
    const decimals = getTokenDecimals(fromChainId, token);
    const parsedAmt = utils.parseUnits(amount, decimals);
    const parsedNativeAmt = routeOptions.toNativeToken
      ? utils.parseUnits(routeOptions.toNativeToken.toString(), decimals)
      : BigNumber.from(0);
    // only works on EVM
    const chainContext = wh.getContext(
      sendingChain,
    ) as EthContext<WormholeContext>;
    const circleRelayer =
      chainContext.contracts.mustGetWormholeCircleRelayer(sendingChain);
    const tokenAddr = (token as TokenId).address;

    // approve
    await chainContext.approve(
      sendingChain,
      circleRelayer.address,
      tokenAddr,
      parsedAmt,
    );
    const tx = await circleRelayer.populateTransaction.transferTokensWithRelay(
      chainContext.context.parseAddress(tokenAddr, sendingChain),
      parsedAmt,
      parsedNativeAmt,
      wh.toChainId(recipientChain),
      chainContext.context.formatAddress(recipientAddress, recipientChain),
    );
    const sentTx = await wh.getSigner(fromChainName)?.sendTransaction(tx);
    const rx = await sentTx?.wait();
    if (!rx) throw new Error("Transaction didn't go through");
    const txId = await signAndSendTransaction(
      fromChainName,
      rx,
      TransferWallet.SENDING,
    );
    wh.registerProviders();
    return txId;
  }

  async redeem(
    destChain: ChainName | ChainId,
    messageInfo: SignedMessage,
    payer: string,
  ): Promise<string> {
    // TODO: implement redeemRelay in the WormholeContext for self redemptions
    throw new Error('not implemented');
  }

  public async getPreview(
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
    const sendingChainName = wh.toChainName(sendingChain);
    const receipientChainName = wh.toChainName(receipientChain);
    const sourceGasToken = CHAINS[sendingChainName]?.gasToken;
    const destinationGasToken = CHAINS[receipientChainName]?.gasToken;
    const destinationGasTokenSymbol = destinationGasToken
      ? getDisplayName(TOKENS[destinationGasToken])
      : '';
    const { relayerFee, receiveNativeAmt } = routeOptions;
    const sourceGasTokenSymbol = sourceGasToken
      ? getDisplayName(TOKENS[sourceGasToken])
      : '';

    const sendingGasEstPrice = calculateUSDPrice(
      sendingGasEst,
      tokenPrices,
      TOKENS[sourceGasToken || ''],
    );

    let totalFeesText = '';
    let totalFeesPrice = '';
    if (sendingGasEst && relayerFee) {
      const fee = toFixedDecimals(`${relayerFee}`, 6);
      totalFeesText = `${sendingGasEst} ${sourceGasTokenSymbol} & ${fee} ${getDisplayName(
        token,
      )}`;
      totalFeesPrice = `${sendingGasEstPrice || NO_INPUT} & ${
        calculateUSDPrice(fee, tokenPrices, token) || NO_INPUT
      }`;
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
                TOKENS[destinationGasToken || ''],
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
            valueUSD: sendingGasEstPrice,
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
  ): Promise<BigNumber> {
    const tokenConfig = TOKENS[token];
    if (!tokenConfig) throw new Error('could not get token config');
    const tokenId = tokenConfig.tokenId;

    // only works on EVM
    const chainContext = wh.getContext(
      sourceChain,
    ) as EthContext<WormholeContext>;
    const circleRelayer =
      chainContext.contracts.mustGetWormholeCircleRelayer(sourceChain);
    const destChainId = wh.toChainId(destChain);
    const fee = await circleRelayer.relayerFee(destChainId, tokenId?.address);
    return fee;
  }

  async getMessage(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<RelayCCTPMessage> {
    // only EVM
    // use this as reference
    // https://goerli.etherscan.io/tx/0xe4984775c76b8fe7c2b09cd56fb26830f6e5c5c6b540eb97d37d41f47f33faca#eventlog
    const provider = wh.mustGetProvider(chain);
    const receipt = await provider.getTransactionReceipt(tx);
    if (!receipt) throw new Error(`No receipt for ${tx} on ${chain}`);

    const vaaInfo = await getUnsignedVaaEvm(chain, receipt);

    // Get the CCTP log
    const cctpLog = receipt.logs.filter(
      (log) => log.topics[0] === CCTP_LOG_TokenMessenger_DepositForBurn,
    )[0];

    const parsedCCTPLog = new utils.Interface([
      'event DepositForBurn(uint64 indexed nonce, address indexed burnToken, uint256 amount, address indexed depositor, bytes32 mintRecipient, uint32 destinationDomain, bytes32 destinationTokenMessenger, bytes32 destinationCaller)',
    ]).parseLog(cctpLog);

    const messageLog = receipt.logs.filter(
      (log) => log.topics[0] === CCTP_LOG_MessageSent,
    )[0];

    const message = new utils.Interface([
      'event MessageSent(bytes message)',
    ]).parseLog(messageLog).args.message;

    const recipient = utils.getAddress(
      '0x' + vaaInfo.payload.substring(298 + 64 + 64 + 24, 298 + 64 + 64 + 64),
    );
    const fromChain = wh.toChainName(chain);
    const tokenId: TokenId = {
      chain: fromChain,
      address: parsedCCTPLog.args.burnToken,
    };
    const token = getTokenById(tokenId);
    const decimals = await wh.fetchTokenDecimals(tokenId, fromChain);
    const toChain = getChainNameCCTP(parsedCCTPLog.args.destinationDomain);
    return {
      sendTx: receipt.transactionHash,
      sender: receipt.from,
      amount: parsedCCTPLog.args.amount.toString(),
      payloadID: PayloadType.Automatic,
      recipient: recipient,
      fromChain: fromChain,
      tokenAddress: parsedCCTPLog.args.burnToken,
      tokenChain: fromChain,
      tokenId: tokenId,
      toChain,
      tokenDecimals: decimals,
      tokenKey: token?.key || '',
      receivedTokenKey: getNativeVersionOfToken('USDC', toChain),
      gasFee: receipt.gasUsed.mul(receipt.effectiveGasPrice).toString(),
      block: receipt.blockNumber,
      message,
      relayerPayloadId: 3,
      relayerFee: BigNumber.from(
        '0x' + vaaInfo.payload.substring(298, 298 + 64),
      ).toString(),
      toNativeTokenAmount: BigNumber.from(
        '0x' + vaaInfo.payload.substring(298 + 64, 298 + 64 * 2),
      ).toString(),
      emitterAddress: vaaInfo.emitterAddress,
      sequence: vaaInfo.sequence.toString(),
      to: recipient,
    };
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
    const { gasToken: sourceGasTokenKey } = CHAINS[txData.fromChain]!;
    const sourceGasToken = TOKENS[sourceGasTokenKey];
    const decimals = getTokenDecimals(
      toChainId(sourceGasToken.nativeChain),
      'native',
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
      rows.push({
        title: 'Convert to native gas token',
        value: `≈ ${formattedToNative} ${getDisplayName(
          token,
        )} \u2192 ${getDisplayName(TOKENS[gasToken])}`,
        valueUSD: calculateUSDPrice(formattedToNative, tokenPrices, token),
      });
    }

    return rows;
  }

  async getTransferDestInfo({
    txData: data,
    tokenPrices,
    receiveTx,
  }: TransferDestInfoBaseParams): Promise<TransferDestInfo> {
    const txData: ParsedRelayerMessage = data as ParsedRelayerMessage;

    const token = TOKENS[txData.tokenKey];
    const { gasToken } = CHAINS[txData.toChain]!;

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
          wh.toChainId(txData.toChain),
          'native',
        );
        nativeGasAmt = toDecimals(nativeSwapAmount, decimals, MAX_DECIMALS);
      }
    }
    if (!nativeGasAmt) {
      // get the decimals on the target chain
      const destinationTokenDecimals = getTokenDecimals(
        wh.toChainId(txData.toChain),
        txData.tokenId,
      ); // should be 6

      const amount = await this.nativeTokenAmount(
        txData.toChain,
        txData.tokenId,
        fromNormalizedDecimals(
          BigNumber.from(txData.toNativeTokenAmount),
          destinationTokenDecimals,
        ),
        txData.to,
      );

      // get the decimals on the target chain
      const nativeGasTokenDecimals = getTokenDecimals(
        wh.toChainId(txData.toChain),
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
            ? `${nativeGasAmt} ${getDisplayName(TOKENS[gasToken])}`
            : NO_INPUT,
          valueUSD: calculateUSDPrice(
            nativeGasAmt,
            tokenPrices,
            TOKENS[gasToken],
          ),
        },
      ],
    };
  }

  async nativeTokenAmount(
    destChain: ChainName | ChainId,
    token: TokenId,
    amount: BigNumber,
    walletAddress: string,
  ): Promise<BigNumber> {
    const context: any = wh.getContext(destChain);
    const relayer = context.contracts.mustGetWormholeCircleRelayer(destChain);
    const tokenAddress = getForeignUSDCAddress(destChain);

    return relayer.calculateNativeSwapAmountOut(tokenAddress, amount);
  }

  async maxSwapAmount(
    destChain: ChainName | ChainId,
    token: TokenId,
    walletAddress: string,
  ): Promise<BigNumber> {
    const context: any = wh.getContext(destChain);
    const relayer = context.contracts.mustGetWormholeCircleRelayer(destChain);
    const tokenAddress = getForeignUSDCAddress(destChain);
    return relayer.calculateMaxSwapAmountIn(tokenAddress);
  }

  async tryFetchRedeemTx(
    txData: RelayCCTPMessage,
  ): Promise<string | undefined> {
    let redeemTx: string | undefined = undefined;
    try {
      redeemTx = await fetchRedeemedEvent(txData);
    } catch (e) {
      console.error(e);
    }

    return redeemTx;
  }
}

async function fetchRedeemedEvent(
  txData: RelayCCTPMessage,
): Promise<string | undefined> {
  const provider = wh.mustGetProvider(txData.toChain);
  const context: any = wh.getContext(txData.toChain);
  const chainName = wh.toChainName(txData.toChain) as ChainName;
  const chainConfig = CHAINS[chainName]!;
  const circleMessageTransmitter = context.contracts.mustGetContracts(
    txData.toChain,
  ).cctpContracts?.cctpMessageTransmitter;
  const contract = MessageTransmitter__factory.connect(
    circleMessageTransmitter,
    provider,
  );
  const eventFilter = contract.filters.MessageReceived(
    undefined,
    undefined,
    getNonce(txData.message),
  );
  const currentBlock = await provider.getBlockNumber();
  const events = await contract.queryFilter(
    eventFilter,
    currentBlock - chainConfig.maxBlockSearch,
  );
  return events ? events[0].transactionHash : undefined;
}

async function fetchSwapEvent(txData: ParsedMessage | ParsedRelayerMessage) {
  const { recipient, amount, tokenDecimals } = txData;
  const provider = wh.mustGetProvider(txData.toChain);
  const context: any = wh.getContext(txData.toChain);
  const chainName = wh.toChainName(txData.toChain) as ChainName;
  const chainConfig = CHAINS[chainName]!;
  const relayerContract = context.contracts.mustGetWormholeCircleRelayer(
    txData.toChain,
  );
  const foreignAsset = getForeignUSDCAddress(txData.toChain);
  const eventFilter = relayerContract.filters.SwapExecuted(
    recipient,
    undefined,
    foreignAsset,
  );
  const currentBlock = await provider.getBlockNumber();
  const events = await relayerContract.queryFilter(
    eventFilter,
    currentBlock - chainConfig.maxBlockSearch,
  );
  const match = events.filter((e: any) => {
    const normalized = fromNormalizedDecimals(
      BigNumber.from(amount),
      tokenDecimals,
    );
    return normalized.eq(e.args[3]);
  });
  return match ? match[0]?.args?.[4] : null;
}
