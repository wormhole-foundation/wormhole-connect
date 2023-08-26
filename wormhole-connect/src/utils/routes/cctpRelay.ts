import {
  ChainId,
  ChainName,
  TokenId,
  EthContext,
  WormholeContext,
  VaaInfo,
  CCTPInfo,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { CHAINS, TOKENS } from 'config';
import { TokenConfig } from 'config/types';
import { BigNumber, utils } from 'ethers';
import {
  MAX_DECIMALS,
  getTokenDecimals,
  toNormalizedDecimals,
  fromNormalizedDecimals,
  getWrappedTokenId,
  getTokenById,
} from 'utils';
import {
  ParsedMessage,
  ParsedRelayerMessage,
  toChainId,
  wh,
  PayloadType,
} from 'utils/sdk';
import { TransferWallet, signAndSendTransaction } from 'utils/wallet';
import { TransferDisplayData } from './types';
import { toDecimals, toFixedDecimals } from '../balance';
import { TransferInfoBaseParams } from './routeAbstract';
import { RelayOptions } from './relay';
import { getGasFeeFallback } from '../gasEstimates';
import { Route } from 'store/transferInput';
import {
  CCTPTokenSymbol,
  CCTPManual_CHAINS as CCTPRelay_CHAINS,
  CCTP_LOG_MessageSent,
  CCTP_LOG_TokenMessenger_DepositForBurn,
  getCircleAttestation,
  CCTPManualRoute,
  getChainNameCCTP,
} from './cctpManual';
export interface CCTPRelayPreviewParams {
  destToken: TokenConfig;
  sourceGasToken: string;
  destinationGasToken: string;
  receiveAmount: number;
  sendingGasEst: string;
  destGasEst: string;
  token: TokenConfig;
  receiveNativeAmt: number;
  relayerFee: number;
}

interface TransferDestInfoParams {
  txData: ParsedMessage | ParsedRelayerMessage;
  receiveTx?: string;
  transferComplete?: boolean;
}

export class CCTPRelayRoute extends CCTPManualRoute {
  async isSupportedSourceToken(
    token: TokenConfig | undefined,
    destToken: TokenConfig | undefined,
  ): Promise<boolean> {
    if (!token) return false;
    const sourceChainName = token.nativeNetwork;
    const sourceChainCCTP = CCTPRelay_CHAINS.includes(sourceChainName);
    if (destToken) {
      const destChainName = token.nativeNetwork;
      const destChainCCTP = CCTPRelay_CHAINS.includes(destChainName);

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
    token: TokenConfig | undefined,
    sourceToken: TokenConfig | undefined,
  ): Promise<boolean> {
    if (!token) return false;
    const destChainName = token.nativeNetwork;
    const destChainCCTP = CCTPRelay_CHAINS.includes(destChainName);
    if (sourceToken) {
      const sourceChainName = token.nativeNetwork;
      const sourceChainCCTP = CCTPRelay_CHAINS.includes(sourceChainName);

      return (
        sourceToken.symbol === CCTPTokenSymbol &&
        token.symbol === CCTPTokenSymbol &&
        sourceChainCCTP &&
        destChainCCTP
      );
    }
    return token.symbol === CCTPTokenSymbol && destChainCCTP;
  }

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

    const sourceChainName = wh.toChainName(sourceChain);
    const destChainName = wh.toChainName(destChain);

    console.log(sourceChainName);
    console.log(destChainName);
    console.log(sourceTokenConfig.symbol);
    console.log(destTokenConfig.symbol);
    if (sourceChainName === destChainName) return false;

    if (sourceTokenConfig.symbol !== CCTPTokenSymbol) return false;
    if (destTokenConfig.symbol !== CCTPTokenSymbol) return false;
    if (sourceTokenConfig.nativeNetwork !== sourceChainName) return false;
    if (destTokenConfig.nativeNetwork !== destChainName) return false;

    return (
      CCTPRelay_CHAINS.includes(sourceChainName) &&
      CCTPRelay_CHAINS.includes(destChainName)
    );
  }

  async computeReceiveAmount(
    sendAmount: number | undefined,
    routeOptions: RelayOptions,
  ): Promise<number> {
    if (!sendAmount) return 0;
    return sendAmount - (routeOptions?.toNativeToken || 0);
  }
  async computeSendAmount(
    receiveAmount: number | undefined,
    routeOptions: RelayOptions,
  ): Promise<number> {
    if (!receiveAmount) return 0;
    return receiveAmount + (routeOptions?.toNativeToken || 0);
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

    try {
      const tx =
        await circleRelayer.populateTransaction.transferTokensWithRelay(
          chainContext.context.parseAddress(tokenAddr, sendingChain),
          parsedAmt,
          BigNumber.from(routeOptions.toNativeToken),
          wh.toChainId(recipientChain),
          chainContext.context.formatAddress(recipientAddress, recipientChain),
        );
      const est = await provider.estimateGas(tx);
      const gasFee = est.mul(gasPrice);
      return toFixedDecimals(utils.formatEther(gasFee), 6);
    } catch (Error) {
      return getGasFeeFallback(token, sendingChain, Route.CCTPRelay);
    }

    // maybe put this in a try catch and add fallback!
  }

  async estimateClaimGas(destChain: ChainName | ChainId): Promise<string> {
    throw new Error('No claiming for this route!');
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
    const parsedNativeAmt = routeOptions.toNativeToken
      ? utils.parseUnits(routeOptions.toNativeToken.toString(), decimals)
      : BigNumber.from(0);
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
    messageInfo: CCTPInfo,
    payer: string,
  ): Promise<string> {
    // TODO: implement redeemRelay in the WormholeContext for self redemptions
    throw new Error('not implemented');
  }

  async parseMessage(
    messageInfo: CCTPInfo,
  ): Promise<ParsedMessage | ParsedRelayerMessage> {
    const tokenId: TokenId = {
      chain: messageInfo.fromChain,
      address: messageInfo.burnToken,
    };
    const token = getTokenById(tokenId);
    const decimals = await wh.fetchTokenDecimals(
      tokenId,
      messageInfo.fromChain,
    );
    let relayerPart = undefined;
    if (messageInfo.relayerPayloadId !== undefined) {
      relayerPart = {
        relayerPayloadId: messageInfo.relayerPayloadId,
        to: messageInfo.recipient,
        relayerFee: messageInfo.relayerFee,
        toNativeTokenAmount: messageInfo.toNativeTokenAmount,
      };
    }
    return {
      sendTx: messageInfo.transactionHash,
      sender: messageInfo.depositor,
      amount: messageInfo.amount.toString(),
      payloadID: PayloadType.AUTOMATIC,
      recipient: messageInfo.recipient,
      toChain: getChainNameCCTP(messageInfo.destinationDomain),
      fromChain: messageInfo.fromChain,
      tokenAddress: messageInfo.burnToken,
      tokenChain: messageInfo.fromChain,
      tokenId: tokenId,
      tokenDecimals: decimals,
      tokenKey: token?.key || '',
      emitterAddress: messageInfo.vaaEmitter,
      sequence: messageInfo.vaaSequence,
      block: messageInfo.blockNumber,
      gasFee: BigNumber.from(messageInfo.gasUsed)
        .mul(messageInfo.effectiveGasPrice)
        .toString(),
      ...relayerPart,
    };
  }

  public async getPreview({
    token,
    destToken,
    sourceGasToken,
    destinationGasToken,
    receiveAmount,
    receiveNativeAmt,
    sendingGasEst,
    relayerFee,
  }: CCTPRelayPreviewParams): Promise<TransferDisplayData> {
    const isNative = token.symbol === sourceGasToken;
    let totalFeesText = '';
    if (sendingGasEst && relayerFee) {
      const fee = toFixedDecimals(
        `${relayerFee + (isNative ? Number.parseFloat(sendingGasEst) : 0)}`,
        6,
      );
      totalFeesText = isNative
        ? `${fee} ${token.symbol}`
        : `${sendingGasEst} ${sourceGasToken} & ${fee} ${token.symbol}`;
    }

    return [
      {
        title: 'Amount',
        value: `${toFixedDecimals(`${receiveAmount}`, 6)} ${destToken.symbol}`,
      },
      {
        title: 'Native gas on destination',
        value:
          receiveNativeAmt > 0
            ? `${receiveNativeAmt} ${destinationGasToken}`
            : '-',
      },
      {
        title: 'Total fee estimates',
        value: totalFeesText,
        rows: [
          {
            title: 'Source chain gas estimate',
            value: sendingGasEst ? `~ ${sendingGasEst} ${sourceGasToken}` : '—',
          },
          {
            title: 'Relayer fee',
            value: relayerFee ? `${relayerFee} ${token.symbol}` : '—',
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
    console.log(destChainId);
    console.log('ToKen address');
    console.log(tokenId?.address);
    const fee = await circleRelayer.relayerFee(destChainId, tokenId?.address);
    return fee;
  }

  async getMessageInfo(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<CCTPInfo> {
    // only EVM
    // use this as reference
    // https://goerli.etherscan.io/tx/0xe4984775c76b8fe7c2b09cd56fb26830f6e5c5c6b540eb97d37d41f47f33faca#eventlog
    const provider = wh.mustGetProvider(chain);

    const receipt = await provider.getTransactionReceipt(tx);
    if (!receipt) throw new Error(`No receipt for ${tx} on ${chain}`);

    const vaaInfo: VaaInfo = await wh.getVaa(tx, chain);
    const payload = vaaInfo.vaa.payload.toString('hex');

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

    const messageHash = utils.keccak256(message);
    const signedAttestation = await getCircleAttestation(messageHash);

    const result = {
      fromChain: wh.toChainName(chain),
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      effectiveGasPrice: receipt.effectiveGasPrice.toString(),
      burnToken: parsedCCTPLog.args.burnToken, // '0x' + payload.substring(26, 66)
      depositor: receipt.from,
      amount: parsedCCTPLog.args.amount.toString(),
      recipient:
        '0x' + payload.substring(296 + 64 + 64 + 24, 296 + 64 + 64 + 64),
      destinationDomain: parsedCCTPLog.args.destinationDomain,
      destinationCaller: parsedCCTPLog.args.destinationCaller,
      destinationTokenMessenger: parsedCCTPLog.args.destinationTokenMessenger,
      message,
      messageHash,
      signedAttestation,
      relayerPayloadId: 3,
      relayerFee: BigNumber.from(
        '0x' + payload.substring(296, 296 + 64),
      ).toString(),
      toNativeTokenAmount: BigNumber.from(
        '0x' + payload.substring(296 + 64, 296 + 64 * 2),
      ).toString(),
      vaaEmitter: vaaInfo.vaa.emitterAddress.toString('hex'),
      vaaSequence: vaaInfo.vaa.sequence.toString(),
    };
    return result;
  }

  async getTransferSourceInfo({
    txData: data,
  }: TransferInfoBaseParams): Promise<TransferDisplayData> {
    const txData = data as ParsedRelayerMessage;

    const formattedAmt = toNormalizedDecimals(
      txData.amount,
      txData.tokenDecimals,
      MAX_DECIMALS,
    );
    const { gasToken: sourceGasTokenSymbol } = CHAINS[txData.fromChain]!;
    const sourceGasToken = TOKENS[sourceGasTokenSymbol];
    const decimals = getTokenDecimals(
      toChainId(sourceGasToken.nativeNetwork),
      sourceGasToken.tokenId,
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
    return [
      {
        title: 'Amount',
        value: `${formattedAmt} ${token.symbol}`,
      },
      {
        title: 'Gas fee',
        value: formattedGas ? `${formattedGas} ${sourceGasTokenSymbol}` : '—',
      },
      {
        title: 'Relayer fee',
        value: `${formattedFee} ${token.symbol}`,
      },
      {
        title: 'Convert to native gas token',
        value: `≈ ${formattedToNative} ${token.symbol} \u2192 ${gasToken}`,
      },
    ];
  }

  async getTransferDestInfo({
    txData: data,
    receiveTx,
    transferComplete,
  }: TransferDestInfoParams): Promise<TransferDisplayData> {
    const txData: ParsedRelayerMessage = data as ParsedRelayerMessage;

    const token = TOKENS[txData.tokenKey];
    const { gasToken } = CHAINS[txData.toChain]!;

    // calculate the amount of native gas received
    let nativeGasAmt: string | undefined;
    const nativeGasToken = TOKENS[gasToken];
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
          nativeGasToken.tokenId,
        );
        nativeGasAmt = toDecimals(nativeSwapAmount, decimals, MAX_DECIMALS);
      }
    } else if (!transferComplete) {
      // get the decimals on the target chain
      const destinationTokenDecimals = getTokenDecimals(
        wh.toChainId(txData.toChain),
        txData.tokenId,
      ); // should be 6

      const amount = this.nativeTokenAmount(
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
        wh.toChainId(txData.toChain),
        getWrappedTokenId(nativeGasToken),
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

    return [
      {
        title: 'Amount',
        value: `${formattedAmt} ${token.symbol}`,
      },
      {
        title: 'Native gas token',
        value: nativeGasAmt ? `${nativeGasAmt} ${gasToken}` : '—',
      },
    ];
  }

  async nativeTokenAmount(
    destChain: ChainName | ChainId,
    token: TokenId,
    amount: BigNumber,
    walletAddress: string,
  ): Promise<BigNumber> {
    const context: any = wh.getContext(destChain);
    const relayer = context.contracts.mustGetWormholeCircleRelayer(destChain);
    const tokenAddress = await wh.mustGetForeignAsset(token, destChain);
    console.log(
      `relayer calculating native swap amount out ${tokenAddress} ${amount}`,
    );
    return relayer.calculateNativeSwapAmountOut(tokenAddress, amount);
  }

  async maxSwapAmount(
    destChain: ChainName | ChainId,
    token: TokenId,
    walletAddress: string,
  ): Promise<BigNumber> {
    const context: any = wh.getContext(destChain);
    const relayer = context.contracts.mustGetWormholeCircleRelayer(destChain);
    const tokenAddress = await wh.mustGetForeignAsset(token, destChain);
    return relayer.calculateMaxSwapAmountIn(tokenAddress);
  }
}

async function fetchSwapEvent(txData: ParsedMessage | ParsedRelayerMessage) {
  const { tokenId, recipient, amount, tokenDecimals } = txData;
  const provider = wh.mustGetProvider(txData.toChain);
  const context: any = wh.getContext(txData.toChain);
  const chainName = wh.toChainName(txData.toChain) as ChainName;
  const chainConfig = CHAINS[chainName]!;
  const relayerContract = context.contracts.mustGetWormholeCircleRelayer(
    txData.toChain,
  );
  const foreignAsset = await context.getForeignAsset(tokenId, txData.toChain);
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
