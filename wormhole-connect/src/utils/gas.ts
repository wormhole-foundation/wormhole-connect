import { BigNumber, utils } from 'ethers';
import {
  ChainName,
  ChainId,
  TokenId,
  NATIVE,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { GAS_ESTIMATES } from 'config';
import { GasEstimateOptions, Route } from 'config/types';
import { wh } from './sdk';
import RouteOperator from './routes/operator';

const simulateRelayAmount = (
  route: Route,
  amount: number,
  relayerFee: number,
  toNativeToken: number,
  tokenDecimals: number,
): BigNumber => {
  const r = RouteOperator.getRoute(route);
  const min = r.getMinSendAmount({ relayerFee, toNativeToken });
  if (min === 0) return BigNumber.from(0);
  const amountOrMin = Math.max(amount, min);
  return utils.parseUnits(`${amountOrMin}`, tokenDecimals);
};

export const getGasFallback = (
  chain: ChainName | ChainId,
  route: Route,
  operation: GasEstimateOptions,
) => {
  const chainName = wh.toChainName(chain);
  const routeGasFallbacks = GAS_ESTIMATES[chainName]?.[route];
  if (!routeGasFallbacks || !routeGasFallbacks[operation]) return 0;
  return routeGasFallbacks[operation];
};

export const estimateSendGas = async (
  token: TokenId | typeof NATIVE,
  amount: string,
  sendingChain: ChainName | ChainId,
  senderAddress: string,
  recipientChain: ChainName | ChainId,
  recipientAddress: string,
) => {
  try {
    const gas = await wh.estimateSendGas(
      token,
      amount,
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
    );
    if (gas) return gas;
  } catch (_) {
    if (token === NATIVE) {
      getGasFallback(sendingChain, Route.Bridge, 'sendNative');
    } else {
      getGasFallback(sendingChain, Route.Bridge, 'sendToken');
    }
  }
};

export const estimateSendWithRelayGas = async (
  token: TokenId | typeof NATIVE,
  amount: string,
  sendingChain: ChainName | ChainId,
  senderAddress: string,
  recipientChain: ChainName | ChainId,
  recipientAddress: string,
  relayerFee: any,
  toNativeToken: string,
) => {
  const relayAmount = simulateRelayAmount(
    Route.Relay,
    Number.parseFloat(amount),
    relayerFee,
    Number.parseFloat(toNativeToken),
    18, // TODO: decimals,
  );
  try {
    const gas = await wh.estimateSendWithRelayGas(
      token,
      relayAmount.toString(),
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
      relayerFee,
      toNativeToken,
    );
    if (gas) return gas;
  } catch (_) {
    if (token === NATIVE) {
      getGasFallback(sendingChain, Route.Relay, 'sendNative');
    } else {
      getGasFallback(sendingChain, Route.Relay, 'sendToken');
    }
  }
};

// TODO: estimate claim gas
