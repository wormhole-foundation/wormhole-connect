import { BigNumber, utils, ethers } from 'ethers';
import {
  ChainId,
  ChainName,
  TokenId,
  EthContext,
  WormholeContext,
  TokenMessenger__factory,
  MessageTransmitter__factory,
} from '@wormhole-foundation/wormhole-connect-sdk';

import { CHAINS, ROUTES, TOKENS, TOKENS_ARR, sdkConfig } from 'config';
import { TokenConfig, Route } from 'config/types';
import {
  MAX_DECIMALS,
  getTokenById,
  getTokenDecimals,
  toNormalizedDecimals,
  getDisplayName,
  calculateUSDPrice,
} from 'utils';
import { isEvmChain, toChainId, wh, PayloadType } from 'utils/sdk';
import { TransferWallet, signAndSendTransaction } from 'utils/wallet';
import { NO_INPUT } from 'utils/style';
import {
  SignedMessage,
  TransferDisplayData,
  isSignedCCTPMessage,
  SignedCCTPMessage,
  ManualCCTPMessage,
  UnsignedCCTPMessage,
  TransferInfoBaseParams,
  TransferDestInfoBaseParams,
  TransferDestInfo,
} from '../types';
import { BaseRoute } from '../bridge/baseRoute';
import { toDecimals } from '../../utils/balance';
import { formatGasFee } from '../utils';
import { getNativeVersionOfToken } from 'store/transferInput';
import {
  CCTPManual_CHAINS,
  CCTPTokenSymbol,
  CCTP_LOG_MessageSent,
  CCTP_LOG_TokenMessenger_DepositForBurn,
  getChainNameCCTP,
  getNonce,
  tryGetCircleAttestation,
} from './utils';
import { TokenPrices } from 'store/tokenPrices';

export class CCTPManualRoute extends BaseRoute {
  readonly NATIVE_GAS_DROPOFF_SUPPORTED: boolean = false;
  readonly AUTOMATIC_DEPOSIT: boolean = false;
  readonly TYPE: Route = Route.CCTPManual;

  isSupportedChain(chain: ChainName): boolean {
    return !!sdkConfig.chains[chain]?.contracts.cctpContracts;
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
      CCTPManual_CHAINS.includes(sourceChainName) &&
      (!sourceChain || wh.toChainName(sourceChain) === sourceChainName);

    if (destToken) {
      const destChainName = destToken.nativeChain;
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
    token?: TokenConfig,
    sourceToken?: TokenConfig,
    sourceChain?: ChainName | ChainId,
    destChain?: ChainName | ChainId,
  ): Promise<boolean> {
    if (!token) return false;
    const destChainName = token.nativeChain;
    const destChainCCTP =
      CCTPManual_CHAINS.includes(destChainName) &&
      (!destChain || wh.toChainName(destChain) === destChainName);
    if (sourceToken) {
      const sourceChainName = sourceToken.nativeChain;
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

  async isRouteSupported(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    if (!ROUTES.includes(Route.CCTPManual)) {
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

    return (
      CCTPManual_CHAINS.includes(sourceChainName) &&
      CCTPManual_CHAINS.includes(destChainName)
    );
  }

  async computeReceiveAmount(
    sendAmount: number,
    token: string,
    destToken: string,
    sendingChain: ChainName | undefined,
    recipientChain: ChainName | undefined,
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
    routeOptions?: any,
  ): Promise<BigNumber> {
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
    const tokenAddr = (token as TokenId).address;
    const toChainName = wh.toChainName(recipientChain)!;
    const decimals = getTokenDecimals(wh.toChainId(sendingChain), token);
    const parsedAmt = utils.parseUnits(`${amount}`, decimals);
    const destinationDomain = wh.conf.chains[toChainName]?.cctpDomain;
    if (destinationDomain === undefined)
      throw new Error(`CCTP not supported on ${toChainName}`);
    const tx = await circleSender.populateTransaction.depositForBurn(
      parsedAmt,
      destinationDomain,
      chainContext.context.formatAddress(recipientAddress, recipientChain),
      chainContext.context.parseAddress(tokenAddr, sendingChain),
    );
    const est = await provider.estimateGas(tx);
    return est.mul(gasPrice);

    // maybe put this in a try catch and add fallback!
  }

  async estimateClaimGas(
    destChain: ChainName | ChainId,
    signedMessage?: SignedMessage,
  ): Promise<BigNumber> {
    throw new Error('not implemented');
  }

  /**
   * These operations have to be implemented in subclasses.
   */
  getMinSendAmount(routeOptions: any): number {
    return 0;
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
    const tokenAddr = (token as TokenId).address;
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
    message: SignedMessage,
    payer: string,
  ): Promise<string> {
    if (!isSignedCCTPMessage(message))
      throw new Error('Signed message is not for CCTP');
    const context: any = wh.getContext(destChain);
    const circleMessageTransmitter =
      context.contracts.mustGetContracts(destChain).cctpContracts
        ?.cctpMessageTransmitter;
    const connection = wh.mustGetSigner(destChain);
    const contract = MessageTransmitter__factory.connect(
      circleMessageTransmitter,
      connection,
    );
    if (!message.attestation) {
      throw new Error('No signed attestation');
    }
    const tx = await contract.receiveMessage(
      message.message,
      message.attestation,
    );
    await tx.wait();
    return tx.hash;
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
    const sourceGasTokenSymbol = sourceGasToken
      ? getDisplayName(TOKENS[sourceGasToken])
      : '';
    const destinationGasTokenSymbol = destinationGasToken
      ? getDisplayName(TOKENS[destinationGasToken])
      : '';
    // Calculate the USD value of the gas
    const sendingGasEstPrice = calculateUSDPrice(
      sendingGasEst,
      tokenPrices,
      TOKENS[sourceGasToken || ''],
    );
    const claimingGasEstPrice = calculateUSDPrice(
      claimingGasEst,
      tokenPrices,
      TOKENS[destinationGasToken || ''],
    );

    return [
      {
        title: 'Amount',
        value: `${!isNaN(amount) ? amount : '0'} ${getDisplayName(destToken)}`,
        valueUSD: calculateUSDPrice(amount, tokenPrices, destToken),
      },
      {
        title: 'Total fee estimates',
        value:
          sendingGasEst && claimingGasEst
            ? `${sendingGasEst} ${sourceGasTokenSymbol} & ${claimingGasEst} ${destinationGasTokenSymbol}`
            : '',
        valueUSD:
          sendingGasEst && claimingGasEst
            ? `${sendingGasEstPrice || NO_INPUT} & ${
                claimingGasEstPrice || NO_INPUT
              }`
            : '',
        rows: [
          {
            title: 'Source chain gas estimate',
            value: sendingGasEst
              ? `~ ${sendingGasEst} ${sourceGasTokenSymbol}`
              : 'Not available',
            valueUSD: sendingGasEstPrice,
          },
          {
            title: 'Destination chain gas estimate',
            value: claimingGasEst
              ? `~ ${claimingGasEst} ${destinationGasTokenSymbol}`
              : 'Not available',
            valueUSD: claimingGasEstPrice,
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
        t.nativeChain === chain &&
        t.tokenId?.chain === chain,
    )?.tokenId?.address;
    if (!addr) throw new Error('USDC not found');
    return addr;
  }

  async getMessage(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<ManualCCTPMessage> {
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

    const recipient = '0x' + parsedCCTPLog.args.mintRecipient.substring(26);
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
      payloadID: PayloadType.Manual,
      recipient: recipient,
      toChain,
      fromChain: fromChain,
      tokenAddress: parsedCCTPLog.args.burnToken,
      tokenChain: fromChain,
      tokenId: tokenId,
      tokenDecimals: decimals,
      tokenKey: token?.key || '',
      receivedTokenKey: getNativeVersionOfToken('USDC', toChain),
      gasFee: receipt.gasUsed.mul(receipt.effectiveGasPrice).toString(),
      block: receipt.blockNumber,
      message,

      // manual CCTP does not use wormhole
      emitterAddress: '',
      sequence: '',
    };
  }

  async getSignedMessage(
    unsigned: UnsignedCCTPMessage,
  ): Promise<SignedCCTPMessage> {
    const { message } = unsigned;

    const messageHash = utils.keccak256(message);
    const signedAttestation = await tryGetCircleAttestation(messageHash);
    if (!signedAttestation) throw new Error('Could not get attestation');

    return {
      ...unsigned,
      attestation: signedAttestation,
    };
  }

  async getTransferSourceInfo({
    txData,
    tokenPrices,
  }: TransferInfoBaseParams): Promise<TransferDisplayData> {
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
    ];
  }

  async getTransferDestInfo({
    txData,
    tokenPrices,
    receiveTx,
    gasEstimate,
  }: TransferDestInfoBaseParams): Promise<TransferDestInfo> {
    const token = TOKENS[txData.tokenKey];
    const { gasToken } = CHAINS[txData.toChain]!;

    let gas = gasEstimate;
    if (receiveTx) {
      const gasFee = await wh.getTxGasFee(txData.toChain, receiveTx);
      if (gasFee) {
        gas = formatGasFee(txData.toChain, gasFee);
      }
    }

    const formattedAmt = toNormalizedDecimals(
      txData.amount,
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
          title: receiveTx ? 'Gas fee' : 'Gas estimate',
          value: gas ? `${gas} ${getDisplayName(TOKENS[gasToken])}` : NO_INPUT,
          valueUSD: calculateUSDPrice(gas, tokenPrices, TOKENS[gasToken]),
        },
      ],
    };
  }

  async isTransferCompleted(
    destChain: ChainName | ChainId,
    messageInfo: SignedCCTPMessage,
  ): Promise<boolean> {
    if (!isSignedCCTPMessage(messageInfo))
      throw new Error('Signed message is not for CCTP');
    const nonce = getNonce(messageInfo.message);
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

  async tryFetchRedeemTx(
    txData: UnsignedCCTPMessage,
  ): Promise<string | undefined> {
    return undefined; // only for automatic routes
  }
}
