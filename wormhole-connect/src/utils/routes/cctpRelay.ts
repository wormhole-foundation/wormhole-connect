import {
  ChainId,
  ChainName,
  TokenId,
  EthContext,
  WormholeContext,
  VaaInfo,
  CircleIntegration__factory,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { CHAINS, TOKENS } from 'config';
import { TokenConfig } from 'config/types';
import { BigNumber, utils, BytesLike, ethers } from 'ethers';
import axios, { AxiosResponse } from 'axios';
import {
  MAX_DECIMALS,
  getTokenById,
  getTokenDecimals,
  toNormalizedDecimals,
  fromNormalizedDecimals,
  getWrappedTokenId,
} from 'utils';
import { isMainnet } from 'config';
import {
  ParsedMessage,
  ParsedRelayerMessage,
  PayloadType,
  toChainId,
  wh,
  calculateNativeTokenAmt,
} from 'utils/sdk';
import { TransferWallet, signAndSendTransaction } from 'utils/wallet';
import { TransferDisplayData } from './types';
import { BaseRoute } from './baseRoute';
import { toDecimals, toFixedDecimals } from '../balance';
import { TransferInfoBaseParams, CCTPInfo } from './routeAbstract';
import { RelayOptions } from './relay';
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

async function sleep(timeout: number) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

const CIRCLE_ATTESTATION = isMainnet
  ? 'https://iris-api.circle.com/attestations/'
  : 'https://iris-api-sandbox.circle.com/attestations/';

async function getCircleAttestation(messageHash: BytesLike) {
  while (true) {
    // get the post
    const response = await tryGetCircleAttestation(messageHash);

    if (response !== null) {
      return response;
    }

    await sleep(6500);
  }
}

async function tryGetCircleAttestation(
  messageHash: BytesLike,
): Promise<string | null> {
  return await axios
    .get(`${CIRCLE_ATTESTATION}${messageHash}`)
    .catch((reason) => {
      return null;
    })
    .then(async (response: AxiosResponse | null) => {
      if (
        response !== null &&
        response.status === 200 &&
        response.data.status === 'complete'
      ) {
        return response.data.attestation as string;
      }

      return null;
    });
}

export class CCTPRelayRoute extends BaseRoute {
  async isSupportedSourceToken(
    token: TokenConfig | undefined,
    destToken: TokenConfig | undefined,
  ): Promise<boolean> {
    if (!token) return false;
    if (destToken) {
      return destToken.symbol === 'USDC' && token.symbol === 'USDC';
    }
    return token.symbol === 'USDC';
  }

  async isSupportedDestToken(
    token: TokenConfig | undefined,
    sourceToken: TokenConfig | undefined,
  ): Promise<boolean> {
    if (!token) return false;
    if (sourceToken) {
      return sourceToken.symbol === 'USDC' && token.symbol === 'USDC';
    }
    return token.symbol === 'USDC';
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

    if (sourceTokenConfig.symbol !== 'USDC') return false;
    if (destTokenConfig.symbol !== 'USDC') return false;

    const CCTPRelay_CHAINS: ChainName[] = ['ethereum', 'avalanche'];
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
    const tx = await circleRelayer.populateTransaction.transferTokensWithRelay(
      chainContext.context.parseAddress(tokenAddr, sendingChain),
      parsedAmt,
      BigNumber.from(routeOptions.toNativeToken),
      wh.toChainId(recipientChain),
      chainContext.context.formatAddress(recipientAddress, recipientChain),
    );
    const est = await provider.estimateGas(tx);
    const gasFee = est.mul(gasPrice);
    return toFixedDecimals(utils.formatEther(gasFee), 6);

    // maybe put this in a try catch and add fallback!
  }

  async estimateClaimGas(destChain: ChainName | ChainId): Promise<string> {
    throw Error('No claiming for this route!');
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
    const tx = await circleRelayer.populateTransaction.transferTokensWithRelay(
      chainContext.context.parseAddress(tokenAddr, sendingChain),
      parsedAmt,
      BigNumber.from(routeOptions.toNativeToken),
      wh.toChainId(recipientChain),
      chainContext.context.formatAddress(recipientAddress, recipientChain),
    );
    const txId = await signAndSendTransaction(
      fromChainName,
      tx,
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

  private getChainNameCCTP(domain: number): ChainName {
    switch (domain) {
      case 0:
        return 'ethereum';
      case 1:
        return 'avalanche';
    }
    throw Error('Invalid CCTP domain');
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
        to: messageInfo.mintRecipient,
        relayerFee: messageInfo.relayerFee,
        toNativeTokenAmount: messageInfo.toNativeTokenAmount,
      };
    }
    return {
      sendTx: messageInfo.transactionReceipt.transactionHash,
      sender: messageInfo.depositor,
      amount: messageInfo.amount.toString(),
      payloadID: PayloadType.AUTOMATIC,
      recipient: messageInfo.mintRecipient,
      toChain: this.getChainNameCCTP(messageInfo.destinationDomain),
      fromChain: messageInfo.fromChain,
      tokenAddress: messageInfo.burnToken,
      tokenChain: messageInfo.fromChain,
      tokenId: tokenId,
      tokenDecimals: decimals,
      tokenKey: token?.key || '',
      emitterAddress: 'circle',
      sequence: '0',
      block: messageInfo.transactionReceipt.blockNumber,
      gasFee: messageInfo.transactionReceipt.gasUsed
        .mul(messageInfo.transactionReceipt.effectiveGasPrice)
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

  public getNativeBalance(
    address: string,
    network: ChainName | ChainId,
  ): Promise<BigNumber | null> {
    return wh.getNativeBalance(address, network);
  }

  public getTokenBalance(
    address: string,
    tokenId: TokenId,
    network: ChainName | ChainId,
  ): Promise<BigNumber | null> {
    return wh.getTokenBalance(address, tokenId, network);
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
    return await circleRelayer.relayerFee(destChainId, tokenId?.address);
  }

  async getForeignAsset(
    token: TokenId,
    chain: ChainName | ChainId,
  ): Promise<string | null> {
    return wh.getForeignAsset(token, chain);
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
      (log) =>
        log.topics[0] ===
        '0x2fa9ca894982930190727e75500a97d8dc500233a5065e0f3126c48fbe0343c0',
    )[0];

    const parsedCCTPLog =
      CircleIntegration__factory.createInterface().parseLog(cctpLog);

    const messageLog = receipt.logs.filter(
      (log) =>
        log.topics[0] ===
        '0x8c5261668696ce22758910d05bab8f186d6eb247ceac2af2e82c7dc17669b036',
    )[0];

    const message = new utils.Interface([
      'event MessageSent(bytes message)',
    ]).parseLog(messageLog).args.message;

    const messageHash = utils.keccak256(message);
    const signedAttestation = await getCircleAttestation(messageHash);

    return {
      fromChain: wh.toChainName(chain),
      transactionReceipt: receipt,
      burnToken: parsedCCTPLog.args.burnToken, // '0x' + payload.substring(26, 66)
      depositor: receipt.from,
      amount: parsedCCTPLog.args.amount,
      mintRecipient: parsedCCTPLog.args.mintRecipient,
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

  async isTransferCompleted(
    destChain: ChainName | ChainId,
    messageInfo: CCTPInfo,
  ): Promise<boolean> {
    const nonce = BigNumber.from(
      '0x' + messageInfo.message.substring(24, 40),
    ).toNumber();
    const context: any = wh.getContext(destChain);
    const circleMessageTransmitter =
      context.contracts.mustGetContracts(destChain).cctpContracts
        ?.cctpMessageTransmitter;
    const connection = context.mustGetConnection(destChain);
    const iface = new utils.Interface([
      'function usedNonces(bytes32 nonce) returns (uint256)',
    ]);
    const contract = new ethers.Contract(
      circleMessageTransmitter,
      iface,
      connection,
    );
    const result = await contract.usedNonces(nonce);
    return result === 1;
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
