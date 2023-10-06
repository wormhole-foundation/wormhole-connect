import { CHAIN_ID_WORMCHAIN } from '@certusone/wormhole-sdk';
import { MsgExecuteContractEncodeObject } from '@cosmjs/cosmwasm-stargate';
import { calculateFee } from '@cosmjs/stargate';
import {
  ChainId,
  ChainName,
  CosmosTransaction,
  TokenId,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import { BigNumber, utils } from 'ethers';
import { toChainId, wh } from 'utils/sdk';
import { getDisplayName } from 'utils';
import { isCosmWasmChain } from 'utils/cosmos';
import { CHAINS, ROUTES, TOKENS } from 'config';
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
} from '../types';
import {
  UnsignedMessage,
  SignedMessage,
  TransferDestInfoBaseParams,
  TransferInfoBaseParams,
} from '../types';
import { BridgeRoute } from '../bridge/bridge';
import { fetchVaa } from '../../utils/vaa';
import { formatGasFee } from '../utils';
import {
  getTranslatorAddress,
  toCosmos,
  fromCosmos,
  getMessageFromCosmos,
  getMessageFromNonCosmos,
  fetchRedeemedEventCosmosSource,
  fetchRedeemedEventNonCosmosSource,
} from './utils';

export class CosmosGatewayRoute extends BaseRoute {
  readonly NATIVE_GAS_DROPOFF_SUPPORTED: boolean = false;
  readonly AUTOMATIC_DEPOSIT: boolean = false;

  isSupportedChain(chain: ChainName): boolean {
    return isCosmWasmChain(chain);
  }

  async isRouteAvailable(
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
      isCosmWasmChain(wh.toChainId(sourceChain)) ||
      isCosmWasmChain(wh.toChainId(destChain))
    );
  }

  async computeReceiveAmount(
    sendAmount: number | undefined,
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
    routeOptions: any,
  ): Promise<any> {
    const sendingChainId = wh.toChainId(sendingChain);
    const recipientChainId = wh.toChainId(recipientChain);
    const decimals = getTokenDecimals(sendingChainId, token);
    const parsedAmt = utils.parseUnits(amount, decimals);

    if (isCosmWasmChain(sendingChainId)) {
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

    const tx: CosmosTransaction = {
      fee: calculateFee(1000000, '1.0uosmo'),
      msgs: [msg],
      memo: '',
    };

    return signAndSendTransaction(
      wh.toChainName(destChain),
      tx,
      TransferWallet.RECEIVING,
    );
  }

  async redeem(
    destChain: ChainName | ChainId,
    messageInfo: SignedMessage,
    recipient: string,
  ): Promise<string> {
    const chain = wh.toChainId(destChain);

    if (isCosmWasmChain(chain)) {
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
    routeOptions?: any,
  ): Promise<TransferDisplayData> {
    const sendingChainName = wh.toChainName(sendingChain);
    const sourceGasToken = CHAINS[sendingChainName]?.gasToken;
    const sourceGasTokenSymbol = sourceGasToken
      ? getDisplayName(TOKENS[sourceGasToken])
      : '';
    return [
      {
        title: 'Amount',
        value: `${toFixedDecimals(`${amount}`, 6)} ${getDisplayName(
          destToken,
        )}`,
      },
      {
        title: 'Total fee estimates',
        value: `${sendingGasEst} ${sourceGasTokenSymbol}`,
        rows: [
          {
            title: 'Source chain gas estimate',
            value: sendingGasEst
              ? `~ ${sendingGasEst} ${sourceGasTokenSymbol}`
              : '—',
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
    return BigNumber.from(0);
  }

  async isTransferCompleted(
    destChain: ChainName | ChainId,
    message: SignedMessage,
  ): Promise<boolean> {
    if (!isSignedWormholeMessage(message))
      throw new Error('Signed message is not for gateway');

    if (!isCosmWasmChain(destChain)) {
      return new BridgeRoute().isTransferCompleted(destChain, message);
    }

    const destTx = await this.fetchRedeemedEvent(message);
    return !!destTx;
  }

  async getMessage(
    hash: string,
    chain: ChainName | ChainId,
  ): Promise<UnsignedMessage> {
    const name = wh.toChainName(chain);
    return isCosmWasmChain(name)
      ? getMessageFromCosmos(hash, name)
      : getMessageFromNonCosmos(hash, name);
  }

  async getSignedMessage(
    message: TokenTransferMessage | RelayTransferMessage,
  ): Promise<SignedTokenTransferMessage | SignedRelayTransferMessage> {
    const vaa = await fetchVaa({
      ...message,
      // transfers from cosmos vaas are emitted by wormchain and not by the source chain
      fromChain: isCosmWasmChain(message.fromChain)
        ? 'wormchain'
        : message.fromChain,
    });

    if (!vaa) {
      throw new Error('VAA not found');
    }

    return {
      ...message,
      vaa: utils.hexlify(vaa.bytes),
    };
  }

  async fetchRedeemedEvent(message: SignedMessage): Promise<string | null> {
    if (!isSignedWormholeMessage(message)) {
      throw new Error('Signed message is not for gateway');
    }

    return isCosmWasmChain(message.fromChain)
      ? fetchRedeemedEventCosmosSource(message)
      : fetchRedeemedEventNonCosmosSource(message);
  }

  async getTransferSourceInfo({
    txData,
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
      },
      {
        title: 'Gas fee',
        value: formattedGas
          ? `${formattedGas} ${getDisplayName(sourceGasToken)}`
          : '—',
      },
    ];
  }

  async getTransferDestInfo({
    txData,
    receiveTx,
    gasEstimate,
  }: TransferDestInfoBaseParams): Promise<TransferDisplayData> {
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

    return [
      {
        title: 'Amount',
        value: `${formattedAmt} ${getDisplayName(token)}`,
      },
      {
        title: receiveTx ? 'Gas fee' : 'Gas estimate',
        value: gas ? `${gas} ${getDisplayName(TOKENS[gasToken])}` : '—',
      },
    ];
  }

  async tryFetchRedeemTx(txData: SignedMessage): Promise<string | undefined> {
    const hash = await this.fetchRedeemedEvent(txData);
    return hash || undefined;
  }
}
