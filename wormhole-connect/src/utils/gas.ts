import { BigNumber, utils } from 'ethers';
import {
  ChainName,
  ChainId,
  Context,
  TokenId,
  NATIVE,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { CHAINS, GAS_ESTIMATES } from 'config';
import { GasEstimateOptions, Route } from 'config/types';
import { wh } from './sdk';
import RouteOperator from './routes/operator';
import { formatGasFee } from './routes';

export const simulateRelayAmount = (
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
): BigNumber => {
  const chainName = wh.toChainName(chain);
  const routeGasFallbacks = GAS_ESTIMATES[chainName]?.[route];
  if (!routeGasFallbacks || !routeGasFallbacks[operation])
    return BigNumber.from(0);
  return BigNumber.from(routeGasFallbacks[operation]);
};

export const estimateSendGas = async (
  route: Route,
  token: TokenId | typeof NATIVE,
  amount: string,
  sendingChain: ChainName | ChainId,
  senderAddress: string,
  recipientChain: ChainName | ChainId,
  recipientAddress: string,
  routeOptions?: any,
): Promise<string> => {
  let gas: BigNumber;
  try {
    const r = RouteOperator.getRoute(route);
    gas = await r.estimateSendGas(
      token,
      amount,
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
      routeOptions,
    );
  } catch (_) {
    if (token === NATIVE) {
      gas = getGasFallback(sendingChain, route, 'sendNative');
    } else {
      gas = getGasFallback(sendingChain, route, 'sendToken');
    }
  }
  if (!gas) throw new Error('could not estimate send gas');
  return formatGasFee(sendingChain, gas);
};

export const estimateClaimGas = async (
  route: Route,
  destChain: ChainName | ChainId,
  VAA?: Uint8Array,
): Promise<string> => {
  let gas: BigNumber;
  try {
    const r = RouteOperator.getRoute(route);
    gas = await r.estimateClaimGas(destChain, VAA);
  } catch (_) {
    gas = getGasFallback(destChain, route, 'claim');

    // gas estimates for evm come in gwei
    const config = CHAINS[wh.toChainName(destChain)];
    if (config?.context === Context.ETH) {
      gas = utils.parseUnits(gas.toString(), 'gwei');
    }
  }
  if (!gas) throw new Error('could not estimate send gas');
  return formatGasFee(destChain, gas);
};
