import {
  ChainId,
  ChainName,
  TokenId,
  EthContext,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber, utils } from 'ethers';

import { CHAINS, TOKENS } from 'config';
import { TokenConfig } from 'config/types';
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
import { NO_INPUT } from 'utils/style';
import { Route } from 'store/transferInput';
import {
  TransferDisplayData,
  TransferInfoBaseParams,
  SignedMessage,
  RelayCCTPMessage,
} from './types';
import { toDecimals, toFixedDecimals } from '../balance';
import { RelayOptions } from './relay';
import { getGasFeeFallback } from '../gasEstimates';
import {
  CCTPTokenSymbol,
  CCTPManual_CHAINS as CCTPRelay_CHAINS,
  CCTP_LOG_MessageSent,
  CCTP_LOG_TokenMessenger_DepositForBurn,
  CCTPManualRoute,
  getChainNameCCTP,
  getForeignUSDCAddress,
} from './cctpManual';
import { getUnsignedVaaEvm } from 'utils/vaa';

interface TransferDestInfoParams {
  txData: ParsedMessage | ParsedRelayerMessage;
  receiveTx?: string;
  transferComplete?: boolean;
}

export class CCTPRelayRoute extends CCTPManualRoute {
  readonly NATIVE_GAS_DROPOFF_SUPPORTED = true;
  readonly AUTOMATIC_DEPOSIT = true;
  async isSupportedSourceToken(
    token: TokenConfig | undefined,
    destToken: TokenConfig | undefined,
    sourceChain?: ChainName | ChainId,
    destChain?: ChainName | ChainId,
  ): Promise<boolean> {
    if (!token) return false;
    const sourceChainName = token.nativeNetwork;
    const sourceChainCCTP =
      CCTPRelay_CHAINS.includes(sourceChainName) &&
      (!sourceChain || wh.toChainName(sourceChain) === sourceChainName);

    if (destToken) {
      const destChainName = destToken.nativeNetwork;
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
    token: TokenConfig | undefined,
    sourceToken: TokenConfig | undefined,
    sourceChain?: ChainName | ChainId,
    destChain?: ChainName | ChainId,
  ): Promise<boolean> {
    if (!token) return false;
    const destChainName = token.nativeNetwork;
    const destChainCCTP =
      CCTPRelay_CHAINS.includes(destChainName) &&
      (!destChain || wh.toChainName(destChain) === destChainName);
    if (sourceToken) {
      const sourceChainName = sourceToken.nativeNetwork;
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
    const { toNativeToken, relayerFee } = routeOptions;
    return sendAmount - (toNativeToken || 0) - (relayerFee || 0);
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
    const tokenAddr = (token as TokenId).address;
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
    routeOptions?: any,
  ): Promise<TransferDisplayData> {
    const sendingChainName = wh.toChainName(sendingChain);
    const receipientChainName = wh.toChainName(receipientChain);
    const sourceGasToken = CHAINS[sendingChainName]?.gasToken;
    const destinationGasToken = CHAINS[receipientChainName]?.gasToken;
    const { relayerFee, receiveNativeAmt } = routeOptions;
    const sourceGasTokenSymbol = sourceGasToken
      ? TOKENS[sourceGasToken].symbol
      : '';
    const destinationGasTokenSymbol = destinationGasToken
      ? TOKENS[destinationGasToken].symbol
      : '';
    const isNative = token.symbol === sourceGasToken;

    let totalFeesText = '';
    if (sendingGasEst && relayerFee !== undefined) {
      const fee = toFixedDecimals(
        `${relayerFee + (isNative ? sendingGasEst : 0)}`,
        6,
      );
      totalFeesText = isNative
        ? `${fee} ${token.symbol}`
        : `${sendingGasEst} ${sourceGasTokenSymbol} & ${fee} ${token.symbol}`;
    }

    const receiveAmt = await this.computeReceiveAmount(amount, routeOptions);

    return [
      {
        title: 'Amount',
        value: `${toFixedDecimals(`${receiveAmt}`, 6)} ${destToken.symbol}`,
      },
      {
        title: 'Native gas on destination',
        value:
          receiveNativeAmt !== undefined
            ? `${receiveNativeAmt} ${destinationGasTokenSymbol}`
            : NO_INPUT,
      },
      {
        title: 'Total fee estimates',
        value: totalFeesText,
        rows: [
          {
            title: 'Source chain gas estimate',
            value: sendingGasEst
              ? `~ ${sendingGasEst} ${sourceGasTokenSymbol}`
              : NO_INPUT,
          },
          {
            title: 'Relayer fee',
            value:
              relayerFee !== undefined
                ? `${relayerFee} ${token.symbol}`
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

    return {
      sendTx: receipt.transactionHash,
      sender: receipt.from,
      amount: parsedCCTPLog.args.amount.toString(),
      payloadID: PayloadType.AUTOMATIC,
      recipient: recipient,
      toChain: getChainNameCCTP(parsedCCTPLog.args.destinationDomain),
      fromChain: fromChain,
      tokenAddress: parsedCCTPLog.args.burnToken,
      tokenChain: fromChain,
      tokenId: tokenId,
      tokenDecimals: decimals,
      tokenKey: token?.key || '',
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
        value: formattedGas
          ? `${formattedGas} ${sourceGasTokenSymbol}`
          : NO_INPUT,
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
    } else {
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
        value: nativeGasAmt ? `${nativeGasAmt} ${gasToken}` : NO_INPUT,
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
