import {
  ChainId,
  ChainName,
  EthContext,
  TokenId,
  TokenMessenger__factory,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber, ethers, utils } from 'ethers';

import config from 'config';
import { TokenConfig, Route } from 'config/types';
import {
  MAX_DECIMALS,
  getTokenDecimals,
  toNormalizedDecimals,
  getDisplayName,
  calculateUSDPrice,
} from 'utils';
import { isEvmChain, toChainId } from 'utils/sdk';
import { TransferWallet, signAndSendTransaction } from 'utils/wallet';
import { NO_INPUT } from 'utils/style';
import { toDecimals } from '../../utils/balance';
import { BaseRoute } from '../bridge/baseRoute';
import {
  ManualCCTPMessage,
  SignedCCTPMessage,
  SignedMessage,
  TransferDestInfo,
  TransferDestInfoBaseParams,
  TransferDisplayData,
  TransferInfoBaseParams,
  UnsignedCCTPMessage,
  isSignedCCTPMessage,
} from '../types';
import { formatGasFee } from '../utils';
import {
  CCTPManual_CHAINS,
  CCTPTokenSymbol,
  getNonce,
  tryGetCircleAttestation,
} from './utils';
import { TokenPrices } from 'store/tokenPrices';
import { getMessageFromEvm, redeemOnEvm, sendFromEvm } from './utils/evm';
import {
  getMessageFromSolana,
  redeemOnSolana,
  sendFromSolana,
} from './utils/solana';
import { getSolanaAssociatedTokenAccount } from '../../utils/solana';

export class CCTPManualRoute extends BaseRoute {
  readonly NATIVE_GAS_DROPOFF_SUPPORTED: boolean = false;
  readonly AUTOMATIC_DEPOSIT: boolean = false;
  readonly TYPE: Route = Route.CCTPManual;

  isSupportedChain(chain: ChainName): boolean {
    return !!config.chains[chain]?.contracts.cctpContracts;
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
      (!sourceChain || config.wh.toChainName(sourceChain) === sourceChainName);

    if (destToken) {
      const destChainName = destToken.nativeChain;
      const destChainCCTP =
        CCTPManual_CHAINS.includes(destChainName) &&
        (!destChain || config.wh.toChainName(destChain) === destChainName);

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
      (!destChain || config.wh.toChainName(destChain) === destChainName);
    if (sourceToken) {
      const sourceChainName = sourceToken.nativeChain;
      const sourceChainCCTP =
        CCTPManual_CHAINS.includes(sourceChainName) &&
        (!sourceChain ||
          config.wh.toChainName(sourceChain) === sourceChainName);
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
    if (!config.routes.includes(Route.CCTPManual)) {
      return false;
    }

    const sourceTokenConfig = config.tokens[sourceToken];
    const destTokenConfig = config.tokens[destToken];

    if (!sourceChain || !destChain || !sourceTokenConfig || !destTokenConfig)
      return false;

    const sourceChainName = config.wh.toChainName(sourceChain);
    const destChainName = config.wh.toChainName(destChain);

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
    const provider = config.wh.mustGetProvider(sendingChain);
    const { gasPrice } = await provider.getFeeData();
    if (!gasPrice)
      throw new Error('gas price not available, cannot estimate fees');

    // only works on EVM
    if (!isEvmChain(sendingChain)) {
      throw new Error('No support for non EVM cctp currently');
    }
    const chainContext = config.wh.getContext(
      sendingChain,
    ) as EthContext<WormholeContext>;
    const tokenMessenger =
      config.wh.mustGetContracts(sendingChain).cctpContracts
        ?.cctpTokenMessenger;
    const circleSender = TokenMessenger__factory.connect(
      tokenMessenger!,
      config.wh.getSigner(sendingChain)!,
    );
    const tokenAddr = (token as TokenId).address;
    const toChainName = config.wh.toChainName(recipientChain)!;
    const decimals = getTokenDecimals(config.wh.toChainId(sendingChain), token);
    const parsedAmt = utils.parseUnits(`${amount}`, decimals);
    const destinationDomain = config.wh.conf.chains[toChainName]?.cctpDomain;
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
    const recipientAccount =
      config.wh.toChainName(recipientChain) === 'solana'
        ? await getSolanaAssociatedTokenAccount(
            token,
            sendingChain,
            recipientAddress,
          )
        : recipientAddress;

    const tx = isEvmChain(sendingChain)
      ? await sendFromEvm(
          token,
          amount,
          sendingChain,
          senderAddress,
          recipientChain,
          recipientAccount,
        )
      : await sendFromSolana(
          token,
          amount,
          sendingChain,
          senderAddress,
          recipientChain,
          recipientAccount,
        );
    const txId = await signAndSendTransaction(
      config.wh.toChainName(sendingChain),
      tx,
      TransferWallet.SENDING,
    );
    config.wh.registerProviders();
    return txId;
  }

  async redeem(
    destChain: ChainName | ChainId,
    message: SignedMessage,
    payer: string,
  ): Promise<string> {
    const tx = isEvmChain(destChain)
      ? await redeemOnEvm(destChain, message)
      : await redeemOnSolana(message, payer);
    const txId = await signAndSendTransaction(
      config.wh.toChainName(destChain),
      tx,
      TransferWallet.RECEIVING,
    );
    config.wh.registerProviders();
    return txId;
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
    // Calculate the USD value of the gas
    const sendingGasEstPrice = calculateUSDPrice(
      sendingGasEst,
      tokenPrices,
      config.tokens[sourceGasToken || ''],
    );
    const claimingGasEstPrice = calculateUSDPrice(
      claimingGasEst,
      tokenPrices,
      config.tokens[destinationGasToken || ''],
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
    const addr = config.tokensArr.find(
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
    return isEvmChain(chain)
      ? getMessageFromEvm(tx, chain)
      : getMessageFromSolana(tx);
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
    const { gasToken: sourceGasTokenKey } = config.chains[txData.fromChain]!;
    const sourceGasToken = config.tokens[sourceGasTokenKey];
    const decimals = getTokenDecimals(
      toChainId(sourceGasToken.nativeChain),
      'native',
    );
    const formattedGas =
      txData.gasFee && toDecimals(txData.gasFee, decimals, MAX_DECIMALS);
    const token = config.tokens[txData.tokenKey];

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
    const token = config.tokens[txData.tokenKey];
    const { gasToken } = config.chains[txData.toChain]!;

    let gas = gasEstimate;
    if (receiveTx) {
      const gasFee = await config.wh.getTxGasFee(txData.toChain, receiveTx);
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
          value: gas
            ? `${gas} ${getDisplayName(config.tokens[gasToken])}`
            : NO_INPUT,
          valueUSD: calculateUSDPrice(
            gas,
            tokenPrices,
            config.tokens[gasToken],
          ),
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
    const context: any = config.wh.getContext(destChain);
    const circleMessageTransmitter =
      context.contracts.mustGetContracts(destChain).cctpContracts
        ?.cctpMessageTransmitter;
    const connection = config.wh.mustGetProvider(destChain);
    const iface = new utils.Interface([
      'function usedNonces(bytes32 domainNonceHash) view returns (uint256)',
    ]);
    const contract = new ethers.Contract(
      circleMessageTransmitter,
      iface,
      connection,
    );

    const cctpDomain = config.wh.conf.chains[messageInfo.fromChain]?.cctpDomain;
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
