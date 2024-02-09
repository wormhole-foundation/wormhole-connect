import { CHAIN_ID_WORMCHAIN } from '@certusone/wormhole-sdk';
import { MsgExecuteContractEncodeObject } from '@cosmjs/cosmwasm-stargate';
import { calculateFee } from '@cosmjs/stargate';
import {
  ChainId,
  ChainName,
  CosmosTransaction,
  TokenId,
  getNativeDenom,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import { BigNumber, utils } from 'ethers';
import { calculateUSDPrice, getDisplayName } from 'utils';
import { toChainId, wh } from 'utils/sdk';
import { isGatewayChain } from 'utils/cosmos';
import { CHAINS, ENV, ROUTES, TOKENS } from 'config';
import { Route, TokenConfig } from 'config/types';
import {
  MAX_DECIMALS,
  getTokenDecimals,
  toNormalizedDecimals,
} from '../../utils';
import { toDecimals, toFixedDecimals } from '../../utils/balance';
import { TransferWallet, signAndSendTransaction } from '../../utils/wallet';
import { BaseRoute } from '../bridge/baseRoute';
import {
  RelayTransferMessage,
  SignedRelayTransferMessage,
  SignedTokenTransferMessage,
  TokenTransferMessage,
  TransferDisplayData,
  isSignedWormholeMessage,
  UnsignedMessage,
  SignedMessage,
  TransferDestInfoBaseParams,
  TransferInfoBaseParams,
  TransferDestInfo,
} from '../types';
import { BridgeRoute } from '../bridge/bridge';
import { fetchVaa } from '../../utils/vaa';
import { formatGasFee } from '../utils';
import {
  fetchRedeemedEventCosmosSource,
  fetchRedeemedEventNonCosmosSource,
  fromCosmos,
  getMessageFromWormchain,
  getUnsignedMessageFromNonCosmos,
  getTranslatorAddress,
  toCosmos,
  getUnsignedMessageFromCosmos,
} from './utils';
import { TokenPrices } from 'store/tokenPrices';

export class CosmosGatewayRoute extends BaseRoute {
  readonly NATIVE_GAS_DROPOFF_SUPPORTED: boolean = false;
  readonly AUTOMATIC_DEPOSIT: boolean = false;
  readonly TYPE: Route = Route.CosmosGateway;

  isSupportedChain(chain: ChainName): boolean {
    return isGatewayChain(chain);
  }

  async isRouteSupported(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    if (!ROUTES.includes(Route.CosmosGateway)) {
      return false;
    }

    return (
      isGatewayChain(wh.toChainId(sourceChain)) ||
      isGatewayChain(wh.toChainId(destChain))
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
    return sendAmount || 0;
  }

  async computeSendAmount(
    receiveAmount: number | undefined,
    routeOptions: any,
  ): Promise<number> {
    return receiveAmount || 0;
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
    const gasFee = await wh.estimateSendGas(
      token,
      amount,
      sendingChain,
      senderAddress,
      CHAIN_ID_WORMCHAIN,
      getTranslatorAddress(),
    );

    if (!gasFee) throw new Error('could not estimate gas fee');

    return gasFee;
  }

  async estimateClaimGas(
    destChain: ChainName | ChainId,
    signedMessage?: SignedMessage,
  ): Promise<BigNumber> {
    if (!signedMessage)
      throw new Error('Cannot estimate gas without a signed message');
    throw new Error('not implemented');
  }

  getForeignAsset(
    token: TokenId,
    chain: ChainId | ChainName,
  ): Promise<string | null> {
    return wh.getForeignAsset(token, chain);
  }

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
  ): Promise<any> {
    const sendingChainId = wh.toChainId(sendingChain);
    const recipientChainId = wh.toChainId(recipientChain);
    const decimals = getTokenDecimals(sendingChainId, token);
    const parsedAmt = utils.parseUnits(amount, decimals);

    if (isGatewayChain(sendingChainId)) {
      return fromCosmos(
        token,
        parsedAmt.toString(),
        sendingChainId,
        senderAddress,
        recipientChainId,
        recipientAddress,
        routeOptions,
      );
    }

    return toCosmos(
      token,
      parsedAmt.toString(),
      sendingChainId,
      senderAddress,
      recipientChainId,
      recipientAddress,
      routeOptions,
    );
  }

  private async manualRedeem(
    destChain: ChainName | ChainId,
    message: SignedMessage,
    recipient: string,
  ): Promise<string> {
    if (!isSignedWormholeMessage(message))
      throw new Error('Signed message is not for gateway');
    const vaa = Buffer.from(message.vaa).toString('base64');
    const msg: MsgExecuteContractEncodeObject = {
      typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
      value: MsgExecuteContract.fromPartial({
        contract: getTranslatorAddress(),
        msg: Buffer.from(
          JSON.stringify({ complete_transfer_and_convert: { vaa } }),
        ),
      }),
    };

    const destChainName = wh.toChainName(destChain);
    const gasDenom = getNativeDenom(destChainName, ENV);

    const tx: CosmosTransaction = {
      fee: calculateFee(1000000, `1.0${gasDenom}`),
      msgs: [msg],
      memo: '',
    };

    return signAndSendTransaction(destChainName, tx, TransferWallet.RECEIVING);
  }

  async redeem(
    destChain: ChainName | ChainId,
    messageInfo: SignedMessage,
    recipient: string,
  ): Promise<string> {
    const chain = wh.toChainId(destChain);

    if (isGatewayChain(chain)) {
      return this.manualRedeem(CHAIN_ID_WORMCHAIN, messageInfo, recipient);
    }

    // for non-cosmos chains, the redeem behavior is the same as the bridge route (manual)
    return new BridgeRoute().redeem(destChain, messageInfo, recipient);
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
    routeOptions?: any,
  ): Promise<TransferDisplayData> {
    const sendingChainName = wh.toChainName(sendingChain);
    const sourceGasToken = CHAINS[sendingChainName]?.gasToken;
    const sourceGasTokenSymbol = sourceGasToken
      ? getDisplayName(TOKENS[sourceGasToken])
      : '';
    // Calculate the USD value of the gas
    const sendingGasEstPrice = calculateUSDPrice(
      sendingGasEst,
      tokenPrices,
      TOKENS[sourceGasToken || ''],
    );

    return [
      {
        title: 'Amount',
        value: `${toFixedDecimals(`${amount}`, 6)} ${getDisplayName(
          destToken,
        )}`,
        valueUSD: calculateUSDPrice(amount, tokenPrices, destToken),
      },
      {
        title: 'Total fee estimates',
        value: `${sendingGasEst} ${sourceGasTokenSymbol}`,
        valueUSD: sendingGasEstPrice,
        rows: [
          {
            title: 'Source chain gas estimate',
            value: sendingGasEst
              ? `~ ${sendingGasEst} ${sourceGasTokenSymbol}`
              : '—',
            valueUSD: sendingGasEstPrice,
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

  async isTransferCompleted(
    destChain: ChainName | ChainId,
    message: SignedMessage,
  ): Promise<boolean> {
    if (!isSignedWormholeMessage(message))
      throw new Error('Signed message is not for gateway');

    if (!isGatewayChain(destChain)) {
      return new BridgeRoute().isTransferCompleted(destChain, message);
    }

    const destTx = await this.fetchRedeemTx(message);
    return !!destTx;
  }

  async getMessage(
    hash: string,
    chain: ChainName | ChainId,
  ): Promise<UnsignedMessage> {
    const name = wh.toChainName(chain);
    return isGatewayChain(name)
      ? getUnsignedMessageFromCosmos(hash, name)
      : getUnsignedMessageFromNonCosmos(hash, name);
  }

  async getSignedMessage(
    unsignedMessage: TokenTransferMessage | RelayTransferMessage,
  ): Promise<SignedTokenTransferMessage | SignedRelayTransferMessage> {
    // if both chains are cosmos gateway chains, no vaa is emitted
    if (
      isGatewayChain(unsignedMessage.fromChain) &&
      isGatewayChain(unsignedMessage.toChain)
    ) {
      return {
        ...unsignedMessage,
        vaa: '',
      };
    }

    // If the message comes from an external chain, it will already have the info to fetch the VAA
    // If it comes from a gateway chain, it will not, since the unsigned message is generated
    // for the first ibc transfer, before it reaches wormchain, so at that time there is no VAA info available
    // so at this point we have to query wormchain to check if the IBC transfer was relayed and the contract was called
    const signedMessage = isGatewayChain(unsignedMessage.fromChain)
      ? await getMessageFromWormchain(
          unsignedMessage.sendTx,
          unsignedMessage.fromChain,
        )
      : unsignedMessage;
    const vaa = await fetchVaa({
      ...signedMessage,
      // transfers from cosmos vaas are emitted by wormchain and not by the source chain
      fromChain: isGatewayChain(signedMessage.fromChain)
        ? 'wormchain'
        : signedMessage.fromChain,
    });

    if (!vaa) {
      throw new Error('VAA not found');
    }

    return {
      ...signedMessage,
      vaa: utils.hexlify(vaa.bytes),
    };
  }

  async fetchRedeemTx(message: SignedMessage): Promise<string | null> {
    if (!isSignedWormholeMessage(message)) {
      throw new Error('Signed message is not for gateway');
    }

    return isGatewayChain(message.fromChain)
      ? await fetchRedeemedEventCosmosSource(message)
      : await fetchRedeemedEventNonCosmosSource(message);
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
          : '—',
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
          value: gas ? `${gas} ${getDisplayName(TOKENS[gasToken])}` : '—',
          valueUSD: calculateUSDPrice(gas, tokenPrices, TOKENS[gasToken]),
        },
      ],
    };
  }

  nativeTokenAmount(
    destChain: ChainId | ChainName,
    token: TokenId,
    amount: BigNumber,
    walletAddress: string,
  ): Promise<BigNumber> {
    throw new Error('Native gas drop-off not supported by this route');
  }

  maxSwapAmount(
    destChain: ChainId | ChainName,
    token: TokenId,
    walletAddress: string,
  ): Promise<BigNumber> {
    throw new Error('Native gas drop-off not supported by this route');
  }

  async tryFetchRedeemTx(txData: SignedMessage): Promise<string | undefined> {
    const hash = await this.fetchRedeemTx(txData);
    return hash || undefined;
  }
}
