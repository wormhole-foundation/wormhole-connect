import { BigNumber, BigNumberish, utils } from 'ethers';
import {
  ChainName,
  ChainId,
  Context,
  TokenId,
  NATIVE,
} from '@wormhole-foundation/wormhole-connect-sdk';
import config from 'config';
import { GasEstimateOptions, Route } from 'config/types';
import RouteOperator from '../routes/operator';
import { SignedMessage, formatGasFee } from '../routes';

export const getGasFallback = (
  chain: ChainName | ChainId,
  route: Route,
  operation: GasEstimateOptions,
): BigNumber => {
  const chainName = config.wh.toChainName(chain);
  const routeGasFallbacks = config.gasEstimates[chainName]?.[route];
  if (!routeGasFallbacks || !routeGasFallbacks[operation])
    return BigNumber.from(0);
  const gas = BigNumber.from(routeGasFallbacks[operation]);

  // gas estimates for evm come in gwei
  const chainConfig = config.chains[chainName]!;
  if (chainConfig.context === Context.ETH) {
    return utils.parseUnits(gas.toString(), 'gwei');
  }
  return gas;
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
  signedMessage?: SignedMessage,
): Promise<string> => {
  let gas: BigNumber;
  try {
    const r = RouteOperator.getRoute(route);
    gas = await r.estimateClaimGas(destChain, signedMessage);
  } catch (_) {
    gas = getGasFallback(destChain, route, 'claim');
  }
  if (!gas) throw new Error('could not estimate send gas');
  return formatGasFee(destChain, gas);
};
