import {
  ChainId,
  ChainName,
  TokenId,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber, utils } from 'ethers';

import config from 'config';
import { TokenConfig, Route } from 'config/types';
import {
  MAX_DECIMALS,
  getTokenDecimals,
  toNormalizedDecimals,
  getDisplayName,
  calculateUSDPrice,
} from 'utils';
import { isEvmChain, toChainId, toChainName } from 'utils/sdk';
import { TransferWallet, signAndSendTransaction } from 'utils/wallet';
import { NO_INPUT } from 'utils/style';
import { toDecimals } from '../../utils/balance';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { BaseRoute } from '../bridge/baseRoute';
import {
  ManualCCTPMessage,
  RelayerFee,
  SignedCCTPMessage,
  SignedMessage,
  TransferDestInfo,
  TransferDestInfoBaseParams,
  TransferDisplayData,
  TransferInfoBaseParams,
  UnsignedCCTPMessage,
} from '../types';
import { formatGasFee } from '../utils';
import ManualCCTP from './chains/abstract';
import ManualCCTPEvmImpl from './chains/evm';
import { ManualCCTPSolanaImpl } from './chains/solana';
import {
  CCTPManual_CHAINS,
  CCTPTokenSymbol,
  tryGetCircleAttestation,
} from './utils';
import { TokenPrices } from 'store/tokenPrices';
import { getNativeVersionOfToken } from 'store/transferInput';
import { PublicKey } from '@solana/web3.js';

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
    return this.getImplementation(sendingChain).estimateSendGas(
      token,
      amount,
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
      routeOptions,
    );
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
    let recipientAccount = recipientAddress;
    if (toChainName(recipientChain) === 'solana') {
      const tokenKey = getNativeVersionOfToken('USDC', 'solana');
      const tokenConfig = config.tokens[tokenKey];
      if (!tokenConfig || !tokenConfig.tokenId) {
        throw new Error('Solana USDC not found');
      }
      recipientAccount = (
        await getAssociatedTokenAddress(
          new PublicKey(tokenConfig.tokenId.address),
          new PublicKey(recipientAddress),
        )
      ).toString();
    }
    const tx = await this.getImplementation(sendingChain).send(
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
    const tx = await this.getImplementation(destChain).redeem(
      destChain,
      message,
      payer,
    );
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
  ): Promise<RelayerFee | null> {
    return null;
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
    return this.getImplementation(chain).getMessage(tx, chain);
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
    return this.getImplementation(destChain).isTransferCompleted(
      destChain,
      messageInfo,
    );
  }

  async tryFetchRedeemTx(
    txData: UnsignedCCTPMessage,
  ): Promise<string | undefined> {
    return undefined; // only for automatic routes
  }

  private getImplementation(chain: ChainId | ChainName): ManualCCTP {
    if (isEvmChain(chain)) {
      return new ManualCCTPEvmImpl();
    } else if (config.wh.toChainName(chain) === 'solana') {
      return new ManualCCTPSolanaImpl();
    }
    throw new Error(`No CCTP implementation for chain ${chain}`);
  }
}
