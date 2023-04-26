import { BigNumber, utils } from 'ethers';
import {
  WormholeContext,
  TokenId,
  ChainId,
  ChainName,
  MAINNET_CHAINS,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { toFixedDecimals } from '../utils/balance';
import { GAS_ESTIMATES } from '../config';
import { PaymentOption } from '.';
import { getTokenDecimals } from '../utils';

// simulates a send transaction and returns the estimated fees
const estimateGasFee = async (
  context: WormholeContext,
  token: TokenId | 'native',
  amount: string,
  fromNetwork: ChainName | ChainId,
  fromAddress: string,
  toNetwork: ChainName | ChainId,
  toAddress: string,
  paymentOption: PaymentOption,
  toNativeToken?: string,
): Promise<string> => {
  const fromChainId = context.toChainId(fromNetwork);
  const decimals = getTokenDecimals(fromChainId, token);
  const parsedAmt = utils.parseUnits(amount, decimals);
  const chainContext = context.getContext(fromNetwork) as any;
  const fromChainName = context.toChainName(fromNetwork);
  const gasEstimates = GAS_ESTIMATES[fromChainName]!;
  // Solana gas estimates
  if (fromChainId === MAINNET_CHAINS.solana) {
    return toFixedDecimals(utils.formatUnits(gasEstimates.sendToken, 9), 6);
  }

  // EVM gas estimates
  const provider = context.mustGetProvider(fromNetwork);
  const { gasPrice } = await provider.getFeeData();
  if (!gasPrice)
    throw new Error('gas price not available, cannot estimate fees');
  if (paymentOption === PaymentOption.MANUAL) {
    const tx = await chainContext.prepareSend(
      token,
      parsedAmt.toString(),
      fromNetwork,
      fromAddress,
      toNetwork,
      toAddress,
      undefined,
    );
    const est = await provider.estimateGas(tx);
    const gasFee = est.mul(gasPrice);
    return toFixedDecimals(utils.formatEther(gasFee), 6);
  } else {
    const parsedNativeAmt = toNativeToken
      ? utils.parseUnits(toNativeToken, decimals).toString()
      : '0';
    const tx = await chainContext.prepareSendWithRelay(
      token,
      parsedAmt.toString(),
      parsedNativeAmt,
      fromNetwork,
      fromAddress,
      toNetwork,
      toAddress,
    );
    const est = await provider.estimateGas(tx);
    const gasFee = est.mul(gasPrice);
    return toFixedDecimals(utils.formatEther(gasFee), 6);
  }
};

// gets a fallback gas fee estimate from config
const getGasFeeFallback = async (
  context: WormholeContext,
  token: TokenId | 'native',
  fromNetwork: ChainName | ChainId,
  paymentOption: PaymentOption,
): Promise<string> => {
  const fromChainId = context.toChainId(fromNetwork);
  const fromChainName = context.toChainName(fromNetwork);
  const sendNative = token === 'native';
  const gasEstimates = GAS_ESTIMATES[fromChainName];
  if (!gasEstimates)
    throw new Error(`no gas estimates configured, cannot estimate fees`);

  // Solana gas estimates
  if (fromChainId === MAINNET_CHAINS.solana) {
    return toFixedDecimals(utils.formatUnits(gasEstimates.sendToken, 9), 6);
  }

  // EVM gas estimates
  const provider = context.mustGetProvider(fromNetwork);
  const { gasPrice } = await provider.getFeeData();
  if (!gasPrice)
    throw new Error('gas price not available, cannot estimate fees');
  if (paymentOption === PaymentOption.MANUAL) {
    const gasEst = sendNative
      ? gasEstimates.sendNative
      : gasEstimates.sendToken;
    const gasFees = BigNumber.from(gasEst).mul(gasPrice);
    return toFixedDecimals(utils.formatEther(gasFees), 6);
  } else {
    const gasEst = sendNative
      ? gasEstimates.sendNativeWithRelay
      : gasEstimates.sendTokenWithRelay;
    if (!gasEst)
      throw new Error(
        `gas estimate not configured for relay from ${fromChainName}`,
      );
    const gasFees = BigNumber.from(gasEst).mul(gasPrice);
    return toFixedDecimals(utils.formatEther(gasFees), 6);
  }
};

// returns the gas fees estimate for any send transfer
export const estimateSendFees = async (
  context: WormholeContext,
  token: TokenId | 'native',
  amount: string,
  fromNetwork: ChainName | ChainId,
  fromAddress: string,
  toNetwork: ChainName | ChainId,
  toAddress: string,
  paymentOption: PaymentOption,
  toNativeToken?: string,
): Promise<string> => {
  try {
    const gasFee = await estimateGasFee(
      context,
      token,
      amount,
      fromNetwork,
      fromAddress,
      toNetwork,
      toAddress,
      paymentOption,
      toNativeToken,
    );
    return gasFee;
  } catch (_) {
    return await getGasFeeFallback(context, token, fromNetwork, paymentOption);
  }
};

// returns the gas fee estimates for claiming on the destination chain
export const estimateClaimFees = async (
  context: WormholeContext,
  destChain: ChainName | ChainId,
): Promise<string> => {
  const destChainId = context.toChainId(destChain);
  if (destChainId === MAINNET_CHAINS.solana) {
    const gasEstimates = GAS_ESTIMATES['solana'];
    return toFixedDecimals(utils.formatUnits(gasEstimates?.claim!, 9), 6);
  }

  const provider = context.mustGetProvider(destChain);
  const gasPrice = await provider.getGasPrice();

  const est = BigNumber.from('300000');
  const gasFee = est.mul(gasPrice);
  return toFixedDecimals(utils.formatEther(gasFee), 6);
};
