import { BigNumber, ethers } from 'ethers';
import {
  ChainId,
  ChainName,
  EthContext,
  TokenId,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { TokenConfig } from 'config/types';
import {
  SignedMessage,
  UnsignedMessage,
  TokenTransferMessage,
  SignedTokenTransferMessage,
  TransferDisplayData,
  TransferInfoBaseParams,
} from '../types';
import { fetchGlobalTx, fetchVaa, getEmitterAndSequence } from 'utils/vaa';
import { hexZeroPad, hexlify, parseUnits } from 'ethers/lib/utils.js';
import { BaseRoute } from '../bridge';
import { PayloadType, isEvmChain, toChainId, toChainName, wh } from 'utils/sdk';
import { CHAINS, ROUTES, TOKENS, isMainnet } from 'config';
import {
  MAX_DECIMALS,
  calculateUSDPrice,
  getChainConfig,
  getDisplayName,
  getGasToken,
  getTokenById,
  getTokenDecimals,
  getWrappedToken,
  isEqualCaseInsensitive,
  toNormalizedDecimals,
} from 'utils';
import {
  CreateOrderRequest,
  CreateOrderResponse,
  PorticoTransferDestInfo,
  PorticoDestTxInfo,
  RelayerQuoteRequest,
  RelayerQuoteResponse,
} from './types';
import axios from 'axios';
import { TransferWallet, signAndSendTransaction } from 'utils/wallet';
import { porticoSwapFinishedEvent } from './abis';
import { getQuote } from './uniswapQuoter';
import { toDecimals } from 'utils/balance';
import {
  BPS_PER_HUNDRED_PERCENT,
  CREATE_ORDER_API_URL,
  FEE_TIER,
  RELAYER_FEE_API_URL,
  SLIPPAGE_BPS,
  SWAP_ERROR,
} from './consts';
import { adaptParsedMessage } from 'routes/utils';
import { TransferDestInfoParams } from 'routes/relay';
import { NO_INPUT } from 'utils/style';
import {
  getCanonicalTokenAddress,
  parsePorticoPayload,
  parseTradeParameters,
  validateCreateOrderResponse,
} from './utils';
import { PorticoBridgeState, PorticoSwapAmounts } from 'store/porticoBridge';
import { TokenPrices } from 'store/tokenPrices';

export abstract class PorticoBridge extends BaseRoute {
  readonly NATIVE_GAS_DROPOFF_SUPPORTED: boolean = false;
  readonly AUTOMATIC_DEPOSIT: boolean = false;

  constructor(
    protected supportedTokenSymbols: string[],
    protected maxAmount: number,
  ) {
    super();
  }

  isSupportedChain(chain: ChainName): boolean {
    const { portico, uniswapQuoterV2 } = wh.getContracts(chain) || {};
    return !!(portico && uniswapQuoterV2);
  }

  async isSupportedSourceToken(
    token?: TokenConfig,
    destToken?: TokenConfig,
    sourceChain?: ChainName | ChainId,
    destChain?: ChainName | ChainId,
  ): Promise<boolean> {
    if (!token || !sourceChain || !this.isSupportedToken(token, sourceChain)) {
      return false;
    }
    if (
      destChain &&
      destToken &&
      !this.isSupportedToken(destToken, destChain)
    ) {
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
    if (!token || !destChain || !this.isSupportedToken(token, destChain)) {
      return false;
    }
    if (
      sourceChain &&
      sourceToken &&
      !this.isSupportedToken(sourceToken, sourceChain)
    ) {
      return false;
    }
    return true;
  }

  isSupportedToken(token: TokenConfig, chain: ChainName | ChainId): boolean {
    return (
      this.isSupportedChain(token.nativeChain) &&
      this.supportedTokenSymbols.includes(token.symbol) &&
      toChainName(chain) === token.nativeChain
    );
  }

  async isRouteSupported(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    if (!isMainnet || !ROUTES.includes(this.TYPE)) {
      return false;
    }
    const sourceTokenConfig = TOKENS[sourceToken];
    if (
      !sourceTokenConfig ||
      !this.isSupportedToken(sourceTokenConfig, sourceChain)
    ) {
      return false;
    }
    const destTokenConfig = TOKENS[destToken];
    if (
      !destTokenConfig ||
      !this.isSupportedToken(destTokenConfig, destChain)
    ) {
      return false;
    }
    return true;
  }

  async computeSwapAmounts(
    sendAmount: number,
    token: string,
    destToken: string,
    sendingChain: ChainName | undefined,
    recipientChain: ChainName | undefined,
  ): Promise<PorticoSwapAmounts> {
    if (!sendAmount || !destToken || !sendingChain || !recipientChain) {
      throw new Error('Invalid params');
    }
    const startToken = getWrappedToken(TOKENS[token]);
    if (!startToken.tokenId) {
      throw new Error('Unable to get start token');
    }
    const finishToken = getWrappedToken(TOKENS[destToken]);
    if (!finishToken.tokenId) {
      throw new Error('Unable to get finish token');
    }
    const [startCanonicalToken, finishCanonicalToken] = await Promise.all([
      getCanonicalTokenAddress(startToken),
      getCanonicalTokenAddress(finishToken),
    ]);
    const startTokenDecimals = getTokenDecimals(
      toChainId(sendingChain),
      startToken.tokenId,
    );
    const parsedSendAmount = parseUnits(
      sendAmount.toString(),
      startTokenDecimals,
    );
    const startQuote = await getQuote(
      sendingChain,
      startToken.tokenId.address,
      startCanonicalToken,
      parsedSendAmount,
      FEE_TIER,
    );
    const startSlippage = startQuote.amountOut
      .mul(SLIPPAGE_BPS)
      .div(BPS_PER_HUNDRED_PERCENT);
    if (startSlippage.gte(startQuote.amountOut)) {
      throw new Error('Start slippage too high');
    }
    const minAmountStart = startQuote.amountOut.sub(startSlippage);
    const finishQuote = await getQuote(
      recipientChain,
      finishCanonicalToken,
      finishToken.tokenId.address,
      minAmountStart,
      FEE_TIER,
    );
    const finishSlippage = finishQuote.amountOut
      .mul(SLIPPAGE_BPS)
      .div(BPS_PER_HUNDRED_PERCENT);
    if (finishSlippage.gte(finishQuote.amountOut)) {
      throw new Error('Finish slippage too high');
    }
    const minAmountFinish = finishQuote.amountOut.sub(finishSlippage);
    const amountFinishQuote = await getQuote(
      recipientChain,
      finishCanonicalToken,
      finishToken.tokenId.address,
      startQuote.amountOut, // no slippage
      FEE_TIER,
    );
    // the expected receive amount is the amount out from the swap
    // minus 5bps slippage
    const amountFinishSlippage = amountFinishQuote.amountOut
      .mul(5)
      .div(BPS_PER_HUNDRED_PERCENT);
    if (amountFinishSlippage.gte(amountFinishQuote.amountOut)) {
      throw new Error('Amount finish slippage too high');
    }
    const amountFinish = amountFinishQuote.amountOut.sub(amountFinishSlippage);
    if (amountFinish.lte(minAmountFinish)) {
      throw new Error('Amount finish too low');
    }
    return {
      minAmountStart: minAmountStart.toString(),
      minAmountFinish: minAmountFinish.toString(),
      amountFinish: amountFinish.toString(),
    };
  }

  async computeReceiveAmount(
    sendAmount: number,
    token: string,
    destToken: string,
    sendingChain: ChainName | undefined,
    recipientChain: ChainName | undefined,
    routeOptions: PorticoBridgeState,
  ): Promise<number> {
    return this.computeReceiveAmountInternal(
      sendAmount,
      token,
      destToken,
      sendingChain,
      recipientChain,
      routeOptions,
      false,
    );
  }

  async computeReceiveAmountInternal(
    sendAmount: number,
    token: string,
    destToken: string,
    sendingChain: ChainName | undefined,
    recipientChain: ChainName | undefined,
    routeOptions: PorticoBridgeState,
    includeFees = false,
  ): Promise<number> {
    if (
      !sendAmount ||
      !destToken ||
      !sendingChain ||
      !recipientChain ||
      !routeOptions.relayerFee.data ||
      !routeOptions.swapAmounts.data ||
      !(await this.isRouteSupported(
        token,
        destToken,
        sendAmount.toString(),
        sendingChain,
        recipientChain,
      ))
    ) {
      throw new Error('Error computing receive amount');
    }
    const finishToken = TOKENS[destToken];
    const minAmountFinish = BigNumber.from(
      routeOptions.swapAmounts.data.minAmountFinish,
    );
    // the relayer fee is paid out in the finish token
    // the min amount finish must be greater than the relayer fee
    // to pay it out
    const relayerFee = BigNumber.from(routeOptions.relayerFee.data);
    if (minAmountFinish.lte(relayerFee)) {
      throw new Error(`Min amount too low, try increasing the send amount`);
    }
    const finishTokenDecimals = getTokenDecimals(
      toChainId(recipientChain),
      finishToken.tokenId,
    );
    let amountFinish = BigNumber.from(
      routeOptions.swapAmounts.data.amountFinish,
    );
    if (includeFees) {
      amountFinish = amountFinish.sub(relayerFee);
    }
    return Number(toDecimals(amountFinish, finishTokenDecimals, MAX_DECIMALS));
  }

  async computeReceiveAmountWithFees(
    sendAmount: number,
    token: string,
    destToken: string,
    sendingChain: ChainName | undefined,
    recipientChain: ChainName | undefined,
    routeOptions: PorticoBridgeState,
  ): Promise<number> {
    return this.computeReceiveAmountInternal(
      sendAmount,
      token,
      destToken,
      sendingChain,
      recipientChain,
      routeOptions,
      true,
    );
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
    routeOptions?: any,
  ): Promise<BigNumber> {
    throw new Error('not implemented');
  }

  async estimateClaimGas(
    destChain: ChainName | ChainId,
    signedMessage?: SignedMessage,
  ): Promise<BigNumber> {
    throw new Error('not implemented');
  }

  getMinSendAmount(routeOptions: PorticoBridgeState): number {
    return 0;
  }

  getMaxSendAmount(): number {
    return this.maxAmount;
  }

  async send(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    destToken: string,
    routeOptions: PorticoBridgeState,
  ): Promise<string> {
    if (!isEvmChain(sendingChain) || !isEvmChain(recipientChain)) {
      throw new Error('Only EVM chains are supported');
    }
    const { swapAmounts, relayerFee } = routeOptions;
    if (!swapAmounts.data || swapAmounts.error) {
      throw new Error('swapAmounts is required');
    }
    if (!relayerFee.data || relayerFee.error) {
      throw new Error('relayerFee is required');
    }
    const { minAmountStart, minAmountFinish } = swapAmounts.data;
    if (!minAmountStart || !minAmountFinish) {
      throw new Error('Invalid min swap amount');
    }
    if (BigNumber.from(minAmountStart).eq(0)) {
      throw new Error('Invalid min swap amount');
    }
    if (BigNumber.from(minAmountFinish).eq(0)) {
      throw new Error('Invalid min swap amount');
    }
    const sourceChainConfig = getChainConfig(sendingChain);
    const destChainConfig = getChainConfig(recipientChain);
    const sourceGasToken = getGasToken(sendingChain);
    const isStartTokenNative =
      token === 'native' || getTokenById(token)?.key === sourceGasToken.key;
    const startToken = isStartTokenNative
      ? getWrappedToken(sourceGasToken)
      : getTokenById(token);
    if (!startToken?.tokenId) {
      throw new Error('Unsupported start token');
    }
    const destGasToken = getGasToken(recipientChain);
    const isDestTokenNative =
      destToken === 'native' || destToken === destGasToken.key;
    const finalToken = isDestTokenNative
      ? getWrappedToken(destGasToken)
      : TOKENS[destToken];
    if (!finalToken?.tokenId) {
      throw new Error('Unsupported dest token');
    }
    const porticoAddress = wh.mustGetContracts(sendingChain).portico;
    if (!porticoAddress) {
      throw new Error('Portico address not found');
    }
    const destinationPorticoAddress =
      wh.mustGetContracts(recipientChain).portico;
    if (!destinationPorticoAddress) {
      throw new Error('Destination portico address not found');
    }
    const decimals = getTokenDecimals(toChainId(sendingChain), token);
    const parsedAmount = parseUnits(amount, decimals);

    // Prevent user from transferring if the output amount is too low
    const minThresholdAmountOutSlippage = parsedAmount
      .mul(50)
      .div(BPS_PER_HUNDRED_PERCENT);
    if (
      BigNumber.from(minAmountFinish).lt(
        parsedAmount.sub(minThresholdAmountOutSlippage),
      )
    ) {
      throw new Error('Output amount too low, please try again later.');
    }

    const context = wh.getContext(sendingChain) as EthContext<WormholeContext>;
    const core = context.contracts.mustGetCore(sendingChain);
    const messageFee = await core.messageFee();

    // Create the order
    const request: CreateOrderRequest = {
      startingChainId: Number(sourceChainConfig.chainId),
      startingToken: startToken.tokenId.address,
      startingTokenAmount: parsedAmount.toString(),
      destinationToken: finalToken.tokenId.address,
      destinationAddress: recipientAddress,
      destinationChainId: Number(destChainConfig.chainId),
      relayerFee: relayerFee.data,
      feeTierStart: FEE_TIER,
      feeTierEnd: FEE_TIER,
      minAmountStart,
      minAmountEnd: minAmountFinish,
      bridgeNonce: new Date().valueOf(),
      shouldWrapNative: isStartTokenNative,
      shouldUnwrapNative: isDestTokenNative,
      porticoAddress,
      destinationPorticoAddress,
    };
    const response = await axios.post<CreateOrderResponse>(
      CREATE_ORDER_API_URL,
      request,
    );
    if (response.status !== 200) {
      throw new Error(`Error creating order: ${response.statusText}`);
    }

    // Validate the response
    await validateCreateOrderResponse(response.data, request, startToken);

    // Approve the token if necessary
    if (!isStartTokenNative) {
      const sendingContext = wh.getContext(
        sendingChain,
      ) as EthContext<WormholeContext>;
      await sendingContext.approve(
        sendingChain,
        porticoAddress,
        startToken.tokenId.address,
        parsedAmount,
      );
    }

    // Sign and send the transaction
    const signer = wh.mustGetSigner(sendingChain);
    const transaction = {
      to: porticoAddress,
      data: response.data.transactionData,
      value: messageFee.add(isStartTokenNative ? parsedAmount : 0),
    };
    try {
      const tx = await signer.sendTransaction(transaction);
      const receipt = await tx.wait();
      const txId = await signAndSendTransaction(
        toChainName(sendingChain),
        receipt,
        TransferWallet.SENDING,
      );
      return txId;
    } catch (e: any) {
      let reason = '';
      if (e.reason?.startsWith('execution reverted: ')) {
        reason = reason.substr('execution reverted: '.length);
      }
      const swapErrors = [
        'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT',
        'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT',
        'Too little received',
        'Too much requested',
        'STF',
      ];
      if (swapErrors.includes(reason)) {
        throw new Error(SWAP_ERROR);
      }
      throw e;
    }
  }

  async redeem(
    destChain: ChainName | ChainId,
    message: SignedTokenTransferMessage,
    payer: string,
  ): Promise<string> {
    // allow manual redeems in case it wasn't relayed
    const signer = wh.mustGetSigner(destChain);
    const { portico } = wh.mustGetContracts(destChain);
    if (!portico) {
      throw new Error('Portico address not found');
    }
    const contract = new ethers.Contract(
      portico,
      ['function receiveMessageAndSwap(bytes)'],
      signer,
    );
    const transaction =
      await contract.populateTransaction.receiveMessageAndSwap(message.vaa);
    const tx = await signer.sendTransaction(transaction);
    const receipt = await tx.wait();
    const txId = await signAndSendTransaction(
      toChainName(destChain),
      receipt,
      TransferWallet.RECEIVING,
    );
    return txId;
  }

  async getRelayerFee(
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    token: string,
    destToken: string,
  ): Promise<BigNumber> {
    if (!destToken) {
      throw new Error('destToken is required');
    }
    const startToken = getWrappedToken(TOKENS[token]);
    if (!startToken.tokenId) {
      throw new Error('Unable to get start token');
    }
    const finalToken = getWrappedToken(TOKENS[destToken]);
    if (!finalToken.tokenId) {
      throw new Error('Unable to get final token');
    }
    const destCanonicalTokenAddress = await getCanonicalTokenAddress(
      finalToken,
    );
    const request: RelayerQuoteRequest = {
      targetChain: toChainId(destChain),
      sourceToken: hexZeroPad(destCanonicalTokenAddress, 32).slice(2),
      targetToken: hexZeroPad(finalToken.tokenId.address, 32).slice(2),
    };
    const response = await axios.post<RelayerQuoteResponse>(
      RELAYER_FEE_API_URL,
      request,
    );
    if (response.status !== 200) {
      throw new Error(`Error getting relayer fee: ${response.statusText}`);
    }
    return BigNumber.from(response.data.fee);
  }

  async getForeignAsset(
    token: TokenId,
    chain: ChainName | ChainId,
  ): Promise<string | null> {
    return await wh.getForeignAsset(token, chain);
  }

  async getMessage(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<UnsignedMessage> {
    const message = await wh.getMessage(tx, chain, false);
    const adaptedMessage = await adaptParsedMessage(message);
    if (adaptedMessage.payloadID !== PayloadType.Automatic) {
      throw new Error('Invalid payload type');
    }
    const payloadBuffer = Buffer.from(adaptedMessage.payload!.slice(2), 'hex');
    const { recipientAddress } = parsePorticoPayload(payloadBuffer);
    adaptedMessage.recipient = recipientAddress;
    const provider = wh.mustGetProvider(chain);
    const { data } = await provider.getTransaction(tx);
    adaptedMessage.inputData = data;
    return adaptedMessage;
  }

  async getSignedMessage(
    message: TokenTransferMessage,
  ): Promise<SignedTokenTransferMessage> {
    const vaa = await fetchVaa(message);

    if (!vaa) {
      throw new Error('VAA not found');
    }

    return {
      ...message,
      vaa: hexlify(vaa.bytes),
    };
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
    const redeemTx = await fetchGlobalTx(txData);
    if (redeemTx) {
      return redeemTx;
    }
    const { emitterChain, emitterAddress, sequence } =
      getEmitterAndSequence(txData);
    const context = wh.getContext(
      txData.toChain,
    ) as EthContext<WormholeContext>;
    const tokenBridge = context.contracts.mustGetBridge(txData.toChain);
    const { maxBlockSearch } = CHAINS[txData.toChain]!;
    const filter = tokenBridge.filters.TransferRedeemed(
      emitterChain,
      `0x${emitterAddress}`,
      sequence,
    );
    try {
      const currentBlock = await context.getCurrentBlock(txData.toChain);
      const events = await tokenBridge.queryFilter(
        filter,
        currentBlock - maxBlockSearch,
      );
      if (events.length > 0) {
        return events[0].transactionHash;
      }
    } catch (e) {
      console.error(e);
    }
    return undefined;
  }

  async getTransferSourceInfo({
    txData,
    tokenPrices,
  }: TransferInfoBaseParams): Promise<TransferDisplayData> {
    // skip 0x prefix and the function selector (2 + 8 = 10 bytes)
    const inputDataBuffer = Buffer.from(txData.inputData!.slice(10), 'hex');
    const { amountSpecified, startTokenAddress } =
      parseTradeParameters(inputDataBuffer);
    const payloadBuffer = Buffer.from(txData.payload!.slice(2), 'hex');
    const {
      flagSet: { shouldWrapNative, shouldUnwrapNative },
      relayerFee,
      finalTokenAddress,
      minAmountFinish,
    } = parsePorticoPayload(payloadBuffer);
    const startToken = getTokenById({
      chain: txData.fromChain,
      address: startTokenAddress,
    });
    if (!startToken) {
      throw new Error('Unable to find start token');
    }
    const gasToken = getGasToken(txData.fromChain);
    const gasTokenDecimals = getTokenDecimals(
      toChainId(gasToken.nativeChain),
      'native',
    );
    const tokenSent = shouldWrapNative ? gasToken : startToken;
    const finalToken = shouldUnwrapNative
      ? getGasToken(txData.toChain)
      : getTokenById({ chain: txData.toChain, address: finalTokenAddress });
    if (!finalToken) {
      throw new Error('Unable to find dest token');
    }
    const startTokenDecimals = getTokenDecimals(
      toChainId(txData.fromChain),
      startToken.tokenId,
    );
    const formattedAmount = toDecimals(
      amountSpecified,
      startTokenDecimals,
      MAX_DECIMALS,
    );
    const destTokenDecimals = getTokenDecimals(
      toChainId(txData.toChain),
      finalToken.tokenId,
    );
    const minAmountOut = minAmountFinish.sub(relayerFee);
    const formattedMinAmount = toDecimals(
      minAmountOut,
      destTokenDecimals,
      MAX_DECIMALS,
    );
    const formattedGasFee =
      txData.gasFee &&
      toDecimals(txData.gasFee, gasTokenDecimals, MAX_DECIMALS);
    return [
      {
        title: 'Amount',
        value: `${formattedAmount} ${getDisplayName(tokenSent)}`,
        valueUSD: calculateUSDPrice(formattedAmount, tokenPrices, tokenSent),
      },
      {
        title: 'Gas fee',
        value: formattedGasFee
          ? `${formattedGasFee} ${getDisplayName(gasToken)}`
          : NO_INPUT,
        valueUSD: calculateUSDPrice(formattedGasFee, tokenPrices, gasToken),
      },
      {
        title: 'Min receive amount',
        value: `${formattedMinAmount} ${getDisplayName(finalToken)}`,
        valueUSD: calculateUSDPrice(
          formattedMinAmount,
          tokenPrices,
          finalToken,
        ),
      },
    ];
  }

  async getTransferDestInfo({
    txData,
    tokenPrices,
    receiveTx,
    transferComplete,
  }: TransferDestInfoParams): Promise<PorticoTransferDestInfo> {
    if (!receiveTx) {
      return {
        route: this.TYPE,
        displayData: [],
        destTxInfo: { receivedTokenKey: '' },
      };
    }
    const provider = wh.mustGetProvider(txData.toChain);
    const receipt = await provider.getTransactionReceipt(receiveTx);
    const payloadBuffer = Buffer.from(txData.payload!.slice(2), 'hex');
    const {
      finalTokenAddress,
      flagSet: { shouldUnwrapNative },
    } = parsePorticoPayload(payloadBuffer);
    const swapFinishedLog = receipt.logs.find(
      (log) => log.topics[0] === porticoSwapFinishedEvent,
    );
    if (!swapFinishedLog) {
      throw new Error('Swap finished log not found');
    }
    // handle the case for when the swap failed
    const swapCompleted = swapFinishedLog.data.slice(0, 66).endsWith('1');
    if (
      !swapCompleted &&
      !isEqualCaseInsensitive(finalTokenAddress, txData.tokenAddress)
    ) {
      const decimals = getTokenDecimals(
        toChainId(txData.toChain),
        txData.tokenId,
      );
      const formattedAmount = toNormalizedDecimals(
        txData.amount,
        decimals,
        MAX_DECIMALS,
      );
      const receivedTokenDisplayName = getDisplayName(
        TOKENS[txData.receivedTokenKey],
      );
      const canonicalTokenAddress = await wh.getForeignAsset(
        txData.tokenId,
        txData.toChain,
      );
      if (!canonicalTokenAddress) {
        throw new Error('Canonical token address not found');
      }
      const destTxInfo: PorticoDestTxInfo = {
        receivedTokenKey: txData.receivedTokenKey,
        swapFailed: {
          canonicalTokenAddress,
          finalTokenAddress,
        },
      };
      return {
        route: this.TYPE,
        displayData: [
          {
            title: 'Amount',
            value: `${formattedAmount} ${receivedTokenDisplayName}`,
            valueUSD: calculateUSDPrice(
              formattedAmount,
              tokenPrices,
              TOKENS[txData.receivedTokenKey],
            ),
          },
          {
            title: 'Relayer fee',
            value: NO_INPUT,
          },
        ],
        destTxInfo,
      };
    }
    // if we get here then the swap succeeded or did not occur if the destination chain is Ethereum.
    // no swap needs to be done on Ethereum since the canonical/bridged token is the final token
    const finalUserAmount = BigNumber.from(
      `0x${swapFinishedLog.data.slice(66, 130)}`,
    );
    const relayerFeeAmount = BigNumber.from(
      `0x${swapFinishedLog.data.slice(130, 194)}`,
    );
    const finalToken = shouldUnwrapNative
      ? getGasToken(txData.toChain)
      : getTokenById({ chain: txData.toChain, address: finalTokenAddress })!;
    const decimals = getTokenDecimals(
      toChainId(txData.toChain),
      shouldUnwrapNative ? 'native' : finalToken.tokenId,
    );
    const formattedFinalUserAmount = toDecimals(
      finalUserAmount,
      decimals,
      MAX_DECIMALS,
    );
    const formattedRelayerFee = toDecimals(
      relayerFeeAmount,
      decimals,
      MAX_DECIMALS,
    );
    const finalTokenDisplayName = getDisplayName(finalToken);
    const destTxInfo: PorticoDestTxInfo = {
      receivedTokenKey: finalToken.key,
    };
    return {
      route: this.TYPE,
      displayData: [
        {
          title: 'Amount received',
          value: `${formattedFinalUserAmount} ${finalTokenDisplayName}`,
          valueUSD: calculateUSDPrice(
            formattedFinalUserAmount,
            tokenPrices,
            finalToken,
          ),
        },
        {
          title: 'Relayer fee',
          value: `${formattedRelayerFee} ${finalTokenDisplayName}`,
          valueUSD: calculateUSDPrice(
            formattedRelayerFee,
            tokenPrices,
            finalToken,
          ),
        },
      ],
      destTxInfo,
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
    routeOptions: PorticoBridgeState,
  ): Promise<TransferDisplayData> {
    const { relayerFee, swapAmounts } = routeOptions;
    const sendingChainName = toChainName(sendingChain);
    const gasToken = getGasToken(sendingChainName);
    const gasTokenDisplayName = getDisplayName(gasToken);
    const destTokenDisplayName = getDisplayName(destToken);
    const destChainConfig = getChainConfig(receipientChain);
    const destTokenDecimals =
      destToken.key === destChainConfig.gasToken
        ? destChainConfig.nativeTokenDecimals
        : getTokenDecimals(toChainId(receipientChain), destToken.tokenId);

    let totalFeesText = '';
    let totalFeesPrice = '';
    let fee = '';
    if (sendingGasEst && relayerFee.data) {
      fee = toDecimals(relayerFee.data, destTokenDecimals, MAX_DECIMALS);
      totalFeesText = `${sendingGasEst} ${gasTokenDisplayName} & ${fee} ${destTokenDisplayName}`;
      totalFeesPrice = `${
        calculateUSDPrice(sendingGasEst, tokenPrices, gasToken) || NO_INPUT
      } & ${calculateUSDPrice(fee, tokenPrices, destToken) || NO_INPUT}`;
    }

    const feePrice = calculateUSDPrice(fee, tokenPrices, destToken);
    const sendingGasEstPrice = calculateUSDPrice(
      sendingGasEst,
      tokenPrices,
      gasToken,
    );
    let expectedAmount = '';
    let minimumAmount = '';
    if (relayerFee.data && swapAmounts.data) {
      expectedAmount = toDecimals(
        BigNumber.from(swapAmounts.data.amountFinish).sub(relayerFee.data),
        destTokenDecimals,
        MAX_DECIMALS,
      );
      minimumAmount = toDecimals(
        BigNumber.from(swapAmounts.data.minAmountFinish).sub(relayerFee.data),
        destTokenDecimals,
        MAX_DECIMALS,
      );
    }
    return [
      {
        title: 'Expected to receive',
        value: `${expectedAmount} ${destTokenDisplayName}`,
        valueUSD: calculateUSDPrice(expectedAmount, tokenPrices, destToken),
      },
      {
        title: 'Minimum to receive',
        value: `${minimumAmount} ${destTokenDisplayName}`,
        valueUSD: calculateUSDPrice(minimumAmount, tokenPrices, destToken),
      },
      {
        title: 'Total fee estimates',
        value: totalFeesText,
        valueUSD: totalFeesPrice,
        rows: [
          {
            title: 'Source chain gas estimate',
            value: sendingGasEst
              ? `~ ${sendingGasEst} ${gasTokenDisplayName}`
              : NO_INPUT,
            valueUSD: sendingGasEstPrice,
          },
          {
            title: 'Relayer fee',
            value: fee ? `${fee} ${destTokenDisplayName}` : NO_INPUT,
            valueUSD: feePrice,
          },
        ],
      },
    ];
  }
}
