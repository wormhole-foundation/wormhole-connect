import {
  ChainId,
  ChainName,
  TokenId,
  EthContext,
  WormholeContext,
  TokenMessenger__factory,
  MessageTransmitter__factory,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { CHAINS, TOKENS, TOKENS_ARR } from 'config';
import { TokenConfig } from 'config/types';
import { BigNumber, utils, BytesLike, ethers } from 'ethers';
import axios, { AxiosResponse } from 'axios';
import {
  MAX_DECIMALS,
  getTokenById,
  getTokenDecimals,
  toNormalizedDecimals,
} from 'utils';
import { isMainnet } from 'config';
import {
  ParsedMessage,
  ParsedRelayerMessage,
  PayloadType,
  toChainId,
  wh,
} from 'utils/sdk';
import { calculateGas } from 'utils/gas';
import { TransferWallet, signAndSendTransaction } from 'utils/wallet';
import { TransferDisplayData } from './types';
import { BaseRoute } from './baseRoute';
import { toDecimals, toFixedDecimals } from '../balance';
import { TransferInfoBaseParams, CCTPInfo } from './routeAbstract';
import { getGasFeeFallback } from '../gasEstimates';
import { Route } from 'store/transferInput';
export interface CCTPManualPreviewParams {
  destToken: TokenConfig;
  sourceGasToken: string;
  destinationGasToken: string;
  receiveAmount: number;
  sendingGasEst: string;
  destGasEst: string;
}

interface TransferDestInfoParams {
  txData: ParsedMessage | ParsedRelayerMessage;
  receiveTx?: string;
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

function getChainNameCCTP(domain: number): ChainName {
  switch (domain) {
    case 0:
      return isMainnet ? 'ethereum' : 'goerli';
    case 1:
      return isMainnet ? 'avalanche' : 'fuji';
  }
  throw Error('Invalid CCTP domain');
}
function getDomainCCTP(chain: ChainName | ChainId): number {
  const chainId = wh.toChainId(chain);
  switch (chainId) {
    case 2:
      return 0;
    case 6:
      return 1;
  }
  throw Error('Invalid CCTP domain');
}

export class CCTPManualRoute extends BaseRoute {
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

    console.log(
      `about to check symbols ${sourceTokenConfig.symbol} ${destTokenConfig.symbol}`,
    );

    if (sourceTokenConfig.symbol !== 'USDC') return false;
    if (destTokenConfig.symbol !== 'USDC') return false;

    console.log(`about to check names ${sourceChainName} ${destChainName}`);

    const CCTPManual_CHAINS: ChainName[] = [
      'ethereum',
      'avalanche',
      'fuji',
      'goerli',
    ];
    return (
      CCTPManual_CHAINS.includes(sourceChainName) &&
      CCTPManual_CHAINS.includes(destChainName)
    );
  }

  async computeReceiveAmount(
    sendAmount: number | undefined,
    routeOptions: any,
  ): Promise<number> {
    if (!sendAmount) return 0;
    return sendAmount;
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
    const tokenMessenger =
      wh.mustGetContracts(sendingChain).cctpContracts?.cctpTokenMessenger;
    const circleSender = TokenMessenger__factory.connect(
      tokenMessenger!,
      wh.getSigner(sendingChain)!,
    );
    const tokenAddr = await wh.mustGetForeignAsset(
      token as TokenId,
      sendingChain,
    );
    const toChainId = wh.toChainId(recipientChain);
    const decimals = getTokenDecimals(wh.toChainId(sendingChain), token);
    const parsedAmt = utils.parseUnits(`${amount}`, decimals);

    try {
      const tx = await circleSender.populateTransaction.depositForBurn(
        parsedAmt,
        getDomainCCTP(toChainId),
        chainContext.context.formatAddress(recipientAddress, recipientChain),
        chainContext.context.parseAddress(tokenAddr, sendingChain),
      );
      const est = await provider.estimateGas(tx);
      const gasFee = est.mul(gasPrice);
      return toFixedDecimals(utils.formatEther(gasFee), 6);
    } catch (Error) {
      return getGasFeeFallback(token, sendingChain, Route.CCTPManual);
    }

    // maybe put this in a try catch and add fallback!
  }

  async estimateClaimGas(destChain: ChainName | ChainId): Promise<string> {
    // Note: This hardcodes 300000 gas - just as is done for the token bridge claim route
    const provider = wh.mustGetProvider(destChain);
    const gasPrice = await provider.getGasPrice();

    const est = BigNumber.from('300000');
    const gasFee = est.mul(gasPrice);
    return toFixedDecimals(utils.formatEther(gasFee), 6);
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
    console.log('About to send');

    const fromChainId = wh.toChainId(sendingChain);
    const fromChainName = wh.toChainName(sendingChain);
    const decimals = getTokenDecimals(fromChainId, token);
    const parsedAmt = utils.parseUnits(amount, decimals);
    console.log('About to send 1');
    // only works on EVM
    const chainContext = wh.getContext(
      sendingChain,
    ) as EthContext<WormholeContext>;
    const tokenMessenger =
      wh.mustGetContracts(sendingChain).cctpContracts?.cctpTokenMessenger;
    const circleTokenMessenger = await TokenMessenger__factory.connect(
      tokenMessenger!,
      wh.getSigner(fromChainId)!,
    );
    const tokenAddr = await wh.mustGetForeignAsset(
      token as TokenId,
      sendingChain,
    );

    // approve
    await chainContext.approve(
      sendingChain,
      circleTokenMessenger.address,
      tokenAddr,
      parsedAmt,
    );

    console.log('About to send 2');
    const tx = await circleTokenMessenger.populateTransaction.depositForBurn(
      parsedAmt,
      getDomainCCTP(wh.toChainId(recipientChain)),
      chainContext.context.formatAddress(recipientAddress, recipientChain),
      chainContext.context.parseAddress(tokenAddr, sendingChain),
    );

    const sentTx = await wh.getSigner(fromChainName)?.sendTransaction(tx);
    const rx = await sentTx?.wait();
    if (!rx) throw "Transaction didn't go through";
    const txId = await signAndSendTransaction(
      fromChainName,
      rx,
      TransferWallet.SENDING,
    );
    console.log('signed and sent');
    wh.registerProviders();
    return txId;
  }

  async redeem(
    destChain: ChainName | ChainId,
    messageInfo: CCTPInfo,
    payer: string,
  ): Promise<string> {
    const context: any = wh.getContext(destChain);
    const circleMessageTransmitter =
      context.contracts.mustGetContracts(destChain).cctpContracts
        ?.cctpMessageTransmitter;
    const connection = wh.mustGetSigner(destChain);
    const contract = MessageTransmitter__factory.connect(
      circleMessageTransmitter,
      connection,
    );
    const tx = await contract.receiveMessage(
      messageInfo.message,
      messageInfo.signedAttestation,
    );
    await tx.wait();
    return tx.hash;
  }

  async parseMessage(
    messageInfo: CCTPInfo,
  ): Promise<ParsedMessage | ParsedRelayerMessage> {
    console.log('here is the message to parse');
    console.log(JSON.stringify(messageInfo));
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
      sendTx: messageInfo.transactionHash,
      sender: messageInfo.depositor,
      amount: messageInfo.amount.toString(),
      payloadID: PayloadType.MANUAL,
      recipient: messageInfo.mintRecipient,
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
    destToken,
    sourceGasToken,
    destinationGasToken,
    receiveAmount: amount,
    sendingGasEst,
    destGasEst,
  }: CCTPManualPreviewParams): Promise<TransferDisplayData> {
    return [
      {
        title: 'Amount',
        value: `${amount} ${destToken.symbol}`,
      },
      {
        title: 'Total fee estimates',
        value:
          sendingGasEst && destGasEst
            ? `${sendingGasEst} ${sourceGasToken} & ${destGasEst} ${destinationGasToken}`
            : '',
        rows: [
          {
            title: 'Source chain gas estimate',
            value: sendingGasEst
              ? `~ ${sendingGasEst} ${sourceGasToken}`
              : 'Not available',
          },
          {
            title: 'Destination chain gas estimate',
            value: destGasEst
              ? `~ ${destGasEst} ${destinationGasToken}`
              : 'Not available',
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
    return BigNumber.from(0);
  }

  async getForeignAsset(
    token: TokenId,
    chain: ChainName | ChainId,
  ): Promise<string | null> {
    // assumes USDC
    const addr = TOKENS_ARR.find(
      (t) => t.symbol === 'USDC' && t.nativeNetwork === chain,
    )?.tokenId?.address;
    if (!addr) throw 'USDC not found';
    return addr;
  }

  async getMessageInfo(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<CCTPInfo> {
    // only EVM
    // use this as reference
    // https://goerli.etherscan.io/tx/0xe4984775c76b8fe7c2b09cd56fb26830f6e5c5c6b540eb97d37d41f47f33faca#eventlog
    const provider = wh.mustGetProvider(chain);

    console.log(`transaction hash: ${tx}`);
    const receipt = await provider.getTransactionReceipt(tx);
    if (!receipt) throw new Error(`No receipt for ${tx} on ${chain}`);

    // Get the CCTP log
    const cctpLog = receipt.logs.filter(
      (log) =>
        log.topics[0] ===
        '0x2fa9ca894982930190727e75500a97d8dc500233a5065e0f3126c48fbe0343c0',
    )[0];

    const parsedCCTPLog =
      TokenMessenger__factory.createInterface().parseLog(cctpLog);

    const messageLog = receipt.logs.filter(
      (log) =>
        log.topics[0] ===
        '0x8c5261668696ce22758910d05bab8f186d6eb247ceac2af2e82c7dc17669b036',
    )[0];

    const message =
      MessageTransmitter__factory.createInterface().parseLog(messageLog).args
        .message;

    const messageHash = utils.keccak256(message);
    const signedAttestation = await getCircleAttestation(messageHash);

    const result = {
      fromChain: wh.toChainName(chain),
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      effectiveGasPrice: receipt.effectiveGasPrice.toString(),
      burnToken: parsedCCTPLog.args.burnToken,
      depositor: receipt.from,
      amount: parsedCCTPLog.args.amount.toString(),
      mintRecipient: '0x' + parsedCCTPLog.args.mintRecipient.substring(26),
      destinationDomain: parsedCCTPLog.args.destinationDomain,
      destinationCaller: parsedCCTPLog.args.destinationCaller,
      destinationTokenMessenger: parsedCCTPLog.args.destinationTokenMessenger,
      message,
      messageHash,
      signedAttestation,
    };
    console.log(result.mintRecipient);
    console.log(parsedCCTPLog.args.mintRecipient);
    return result;
  }

  async getTransferSourceInfo({
    txData,
  }: TransferInfoBaseParams): Promise<TransferDisplayData> {
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

    return [
      {
        title: 'Amount',
        value: `${formattedAmt} ${token.symbol}`,
      },
      {
        title: 'Gas fee',
        value: formattedGas ? `${formattedGas} ${sourceGasTokenSymbol}` : '—',
      },
    ];
  }

  async getTransferDestInfo({
    txData,
    receiveTx,
  }: TransferDestInfoParams): Promise<TransferDisplayData> {
    const token = TOKENS[txData.tokenKey];
    const { gasToken } = CHAINS[txData.toChain]!;
    const gas = await calculateGas(txData.toChain, Route.CCTPManual, receiveTx);

    const formattedAmt = toNormalizedDecimals(
      txData.amount,
      txData.tokenDecimals,
      MAX_DECIMALS,
    );
    return [
      {
        title: 'Amount',
        value: `${formattedAmt} ${token.symbol}`,
      },
      {
        title: receiveTx ? 'Gas fee' : 'Gas estimate',
        value: gas ? `${gas} ${gasToken}` : '—',
      },
    ];
  }

  async isTransferCompleted(
    destChain: ChainName | ChainId,
    messageInfo: CCTPInfo,
  ): Promise<boolean> {
    const nonce = BigNumber.from(
      '0x' + messageInfo.message.substring(26, 42),
    ).toNumber();
    const context: any = wh.getContext(destChain);
    const circleMessageTransmitter =
      context.contracts.mustGetContracts(destChain).cctpContracts
        ?.cctpMessageTransmitter;
    const connection = wh.mustGetProvider(destChain);
    const iface = new utils.Interface([
      'function usedNonces(bytes32 domainNonceHash) view returns (uint256)',
    ]);
    const contract = new ethers.Contract(
      circleMessageTransmitter,
      iface,
      connection,
    );
    const hash = ethers.utils.keccak256(
      ethers.utils.solidityPack(
        ['uint32', 'uint64'],
        [getDomainCCTP(messageInfo.fromChain), nonce],
      ),
    );
    console.log(
      ethers.utils.solidityPack(
        ['uint32', 'uint64'],
        [getDomainCCTP(messageInfo.fromChain), nonce],
      ),
    );
    console.log(hash);
    const result = await contract.usedNonces(hash);
    console.log(JSON.stringify(result));
    return result.toString() === '1';
  }
}
