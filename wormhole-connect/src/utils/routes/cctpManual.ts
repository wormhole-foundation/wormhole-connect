import {
  ChainId,
  ChainName,
  TokenId,
  EthContext,
  WormholeContext,
  TokenMessenger__factory,
  MessageTransmitter__factory,
  CCTPInfo,
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
  isEvmChain,
  toChainId,
  wh,
} from 'utils/sdk';
import { calculateGas } from 'utils/gas';
import { TransferWallet, signAndSendTransaction } from 'utils/wallet';
import { TransferDisplayData } from './types';
import { BaseRoute } from './baseRoute';
import { toDecimals, toFixedDecimals } from '../balance';
import { TransferInfoBaseParams } from './routeAbstract';
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

export const CCTPTokenSymbol = 'USDC';
export const CCTPManual_CHAINS: ChainName[] = [
  'ethereum',
  'avalanche',
  'fuji',
  'goerli',
];
export const CCTP_LOG_TokenMessenger_DepositForBurn =
  '0x2fa9ca894982930190727e75500a97d8dc500233a5065e0f3126c48fbe0343c0';
export const CCTP_LOG_MessageSent =
  '0x8c5261668696ce22758910d05bab8f186d6eb247ceac2af2e82c7dc17669b036';

interface TransferDestInfoParams {
  txData: ParsedMessage | ParsedRelayerMessage;
  receiveTx?: string;
}

export function getForeignUSDCAddress(chain: ChainName | ChainId) {
  const usdcToken = TOKENS_ARR.find(
    (t) =>
      t.symbol === CCTPTokenSymbol &&
      t.nativeNetwork === wh.toChainName(chain) &&
      t.tokenId?.chain === wh.toChainName(chain),
  );
  if (!usdcToken) {
    throw new Error('No foreign native USDC address');
  }
  return usdcToken.tokenId?.address;
}

async function sleep(timeout: number) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

const CIRCLE_ATTESTATION = isMainnet
  ? 'https://iris-api.circle.com/attestations/'
  : 'https://iris-api-sandbox.circle.com/attestations/';

export async function getCircleAttestation(messageHash: BytesLike) {
  while (true) {
    // get the post
    const response = await tryGetCircleAttestation(messageHash);

    if (response) {
      return response;
    }

    await sleep(6500);
  }
}

export async function tryGetCircleAttestation(
  messageHash: BytesLike,
): Promise<string | undefined> {
  return await axios
    .get(`${CIRCLE_ATTESTATION}${messageHash}`)
    .catch((reason) => {
      return undefined;
    })
    .then(async (response: AxiosResponse | undefined) => {
      if (
        response &&
        response.status === 200 &&
        response.data.status === 'complete'
      ) {
        return response.data.attestation as string;
      }

      return undefined;
    });
}

export function getChainNameCCTP(domain: number): ChainName {
  switch (domain) {
    case 0:
      return isMainnet ? 'ethereum' : 'goerli';
    case 1:
      return isMainnet ? 'avalanche' : 'fuji';
  }
  throw new Error('Invalid CCTP domain');
}

export class CCTPManualRoute extends BaseRoute {
  NATIVE_GAS_DROPOFF_SUPPORTED = false;
  async isSupportedSourceToken(
    token: TokenConfig | undefined,
    destToken: TokenConfig | undefined,
    sourceChain?: ChainName | ChainId,
    destChain?: ChainName | ChainId,
  ): Promise<boolean> {
    if (!token) return false;
    const sourceChainName = token.nativeNetwork;
    const sourceChainCCTP =
      CCTPManual_CHAINS.includes(sourceChainName) &&
      (!sourceChain || wh.toChainName(sourceChain) === sourceChainName);

    if (destToken) {
      const destChainName = destToken.nativeNetwork;
      const destChainCCTP =
        CCTPManual_CHAINS.includes(destChainName) &&
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
      CCTPManual_CHAINS.includes(destChainName) &&
      (!destChain || wh.toChainName(destChain) === destChainName);
    if (sourceToken) {
      const sourceChainName = sourceToken.nativeNetwork;
      const sourceChainCCTP =
        CCTPManual_CHAINS.includes(sourceChainName) &&
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
    if (!isEvmChain(sendingChain)) {
      throw new Error('No support for non EVM cctp currently');
    }
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
    const toChainName = wh.toChainName(recipientChain)!;
    const decimals = getTokenDecimals(wh.toChainId(sendingChain), token);
    const parsedAmt = utils.parseUnits(`${amount}`, decimals);
    const destinationDomain = wh.conf.chains[toChainName]?.cctpDomain;
    if (destinationDomain === undefined)
      throw new Error(`CCTP not supported on ${toChainName}`);
    try {
      const tx = await circleSender.populateTransaction.depositForBurn(
        parsedAmt,
        destinationDomain,
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
    const fromChainId = wh.toChainId(sendingChain);
    const fromChainName = wh.toChainName(sendingChain);
    const decimals = getTokenDecimals(fromChainId, token);
    const parsedAmt = utils.parseUnits(amount, decimals);

    // only works on EVM
    if (!isEvmChain(sendingChain)) {
      throw new Error('No support for non EVM cctp currently');
    }
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
    const recipientChainName = wh.toChainName(recipientChain);
    const destinationDomain = wh.conf.chains[recipientChainName]?.cctpDomain;
    if (destinationDomain === undefined)
      throw new Error(`No CCTP on ${recipientChainName}`);
    const tx = await circleTokenMessenger.populateTransaction.depositForBurn(
      parsedAmt,
      destinationDomain,
      chainContext.context.formatAddress(recipientAddress, recipientChain),
      chainContext.context.parseAddress(tokenAddr, sendingChain),
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
    const context: any = wh.getContext(destChain);
    const circleMessageTransmitter =
      context.contracts.mustGetContracts(destChain).cctpContracts
        ?.cctpMessageTransmitter;
    const connection = wh.mustGetSigner(destChain);
    const contract = MessageTransmitter__factory.connect(
      circleMessageTransmitter,
      connection,
    );
    if (!messageInfo.signedAttestation) {
      throw new Error('No signed attestation');
    }
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
      payloadID: PayloadType.MANUAL,
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
      (t) =>
        t.symbol === CCTPTokenSymbol &&
        t.nativeNetwork === chain &&
        t.tokenId?.chain === chain,
    )?.tokenId?.address;
    if (!addr) throw new Error('USDC not found');
    return addr;
  }

  async getMessageInfo(
    tx: string,
    chain: ChainName | ChainId,
    unsigned?: boolean,
  ): Promise<CCTPInfo | undefined> {
    // only EVM
    // use this as reference
    // https://goerli.etherscan.io/tx/0xe4984775c76b8fe7c2b09cd56fb26830f6e5c5c6b540eb97d37d41f47f33faca#eventlog
    const provider = wh.mustGetProvider(chain);

    const receipt = await provider.getTransactionReceipt(tx);
    if (!receipt) throw new Error(`No receipt for ${tx} on ${chain}`);

    // Get the CCTP log
    const cctpLog = receipt.logs.filter(
      (log) => log.topics[0] === CCTP_LOG_TokenMessenger_DepositForBurn,
    )[0];

    const parsedCCTPLog =
      TokenMessenger__factory.createInterface().parseLog(cctpLog);

    const messageLog = receipt.logs.filter(
      (log) => log.topics[0] === CCTP_LOG_MessageSent,
    )[0];

    const message =
      MessageTransmitter__factory.createInterface().parseLog(messageLog).args
        .message;

    const messageHash = utils.keccak256(message);
    let signedAttestation;
    if (!unsigned) {
      signedAttestation = await tryGetCircleAttestation(messageHash);
      // If no attestion, and attestation was requested, return undefined
      if (!signedAttestation) return undefined;
    }

    const result = {
      fromChain: wh.toChainName(chain),
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      effectiveGasPrice: receipt.effectiveGasPrice.toString(),
      burnToken: parsedCCTPLog.args.burnToken,
      depositor: receipt.from,
      amount: parsedCCTPLog.args.amount.toString(),
      recipient: '0x' + parsedCCTPLog.args.mintRecipient.substring(26),
      destinationDomain: parsedCCTPLog.args.destinationDomain,
      destinationCaller: parsedCCTPLog.args.destinationCaller,
      destinationTokenMessenger: parsedCCTPLog.args.destinationTokenMessenger,
      message,
      messageHash,
      signedAttestation,
    };

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

    const cctpDomain = wh.conf.chains[messageInfo.fromChain]?.cctpDomain;
    if (cctpDomain === undefined)
      throw new Error(`CCTP not supported on ${messageInfo.fromChain}`);

    const hash = ethers.utils.keccak256(
      ethers.utils.solidityPack(['uint32', 'uint64'], [cctpDomain, nonce]),
    );
    const result = await contract.usedNonces(hash);
    return result.toString() === '1';
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
}
