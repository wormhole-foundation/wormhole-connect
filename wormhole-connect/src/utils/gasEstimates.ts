import { BigNumber, utils } from 'ethers';
import {
  WormholeContext,
  TokenId,
  ChainId,
  ChainName,
  MAINNET_CHAINS,
  AptosContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import {
  JsonRpcProvider,
  TransactionBlock,
  getTotalGasUsed,
} from '@mysten/sui.js';
import { AptosClient } from 'aptos';

import { CHAINS, GAS_ESTIMATES } from 'config';
import { Route } from 'config/types';
import { getMinAmount } from 'utils/transferValidation';
import { TransferWallet, simulateSeiTransaction } from 'utils/wallet';
import { wh } from 'utils/sdk';
import { isCosmWasmChain } from './cosmos';
import { toFixedDecimals } from './balance';
import { getTokenDecimals } from '.';
import Operator from './routes';

const simulateRelayAmount = (
  route: Route,
  amount: number,
  relayerFee: number,
  toNativeToken: number,
  tokenDecimals: number,
): BigNumber => {
  const r = new Operator().getRoute(route);
  // TODO: get min amount from the routes
  if (r.AUTOMATIC_DEPOSIT && r.NATIVE_GAS_DROPOFF_SUPPORTED) {
    const min = getMinAmount(true, relayerFee, toNativeToken);
    const amountOrMin = Math.max(amount, min);
    return utils.parseUnits(`${amountOrMin}`, tokenDecimals);
  }
  return BigNumber.from(0);
};

// simulates a send transaction and returns the estimated fees
const estimateGasFee = async (
  token: TokenId | 'native',
  amount: number,
  fromNetwork: ChainName | ChainId,
  fromAddress: string,
  toNetwork: ChainName | ChainId,
  toAddress: string,
  route: Route,
  relayerFee: number = 0,
  toNativeToken: number = 0,
): Promise<string> => {
  const fromChainId = wh.toChainId(fromNetwork);
  const decimals = getTokenDecimals(fromChainId, token);
  const parsedAmt = utils.parseUnits(`${amount}`, decimals);
  const chainContext = wh.getContext(fromNetwork) as any;
  const fromChainName = wh.toChainName(fromNetwork);
  const gasEstimates = GAS_ESTIMATES[fromChainName]!;
  const parsedNativeAmt = utils
    .parseUnits(`${toNativeToken}`, decimals)
    .toString();
  const relayAmount = simulateRelayAmount(
    route,
    amount,
    relayerFee,
    toNativeToken,
    decimals,
  );
  const nativeDecimals = CHAINS[fromChainName]!.nativeTokenDecimals;

  // Solana gas estimates
  if (fromChainId === MAINNET_CHAINS.solana) {
    return toFixedDecimals(
      utils.formatUnits(gasEstimates.sendToken, nativeDecimals),
      6,
    );
  }

  if (fromChainId === MAINNET_CHAINS.sei) {
    const tx = await chainContext.send(
      token,
      parsedAmt.toString(),
      fromNetwork,
      fromAddress,
      toNetwork,
      toAddress,
      undefined,
    );
    // the cosmos client requires a signer (i.e. a wallet) for transaction simulation
    // so we must rely on the wallet to estimate the gas fee
    const estimate = await simulateSeiTransaction(tx, TransferWallet.SENDING);
    return toFixedDecimals(utils.formatUnits(estimate, nativeDecimals), 6);
  }

  // Sui gas estimates
  if (fromChainId === MAINNET_CHAINS.sui) {
    const provider = chainContext.provider as JsonRpcProvider;
    if (!provider) throw new Error('no provider');
    let tx: TransactionBlock;
    if (route === Route.Bridge) {
      tx = await chainContext.send(
        token,
        parsedAmt,
        fromNetwork,
        fromAddress,
        toNetwork,
        toAddress,
        undefined,
      );
    } else {
      tx = await chainContext.sendWithRelay(
        token,
        relayAmount.toString(),
        parsedNativeAmt,
        fromNetwork,
        fromAddress,
        toNetwork,
        toAddress,
      );
    }
    tx.setSenderIfNotSet(fromAddress);
    const dryRunTxBytes = await tx.build({
      provider,
    });
    const response = await provider.dryRunTransactionBlock({
      transactionBlock: dryRunTxBytes,
    });
    const gasFee = getTotalGasUsed(response.effects);
    if (!gasFee) throw new Error('cannot estimate gas fee');
    const result = toFixedDecimals(
      utils.formatUnits(gasFee, nativeDecimals),
      6,
    );
    return result;
  }

  // Aptos gas estimates
  if (fromChainId === MAINNET_CHAINS.aptos) {
    // TODO: the account's public key is needed for AptosClient.simulateTransaction
    throw new Error('Aptos estimateGasFee not implemented');
  }

  // EVM gas estimates
  const provider = wh.mustGetProvider(fromNetwork);
  const { gasPrice } = await provider.getFeeData();
  if (!gasPrice)
    throw new Error('gas price not available, cannot estimate fees');
  if (route === Route.Bridge) {
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
    const tx = await chainContext.prepareSendWithRelay(
      token,
      relayAmount.toString(),
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
export const getGasFeeFallback = async (
  token: TokenId | 'native',
  fromNetwork: ChainName | ChainId,
  route: Route,
): Promise<string> => {
  const fromChainId = wh.toChainId(fromNetwork);
  const fromChainName = wh.toChainName(fromNetwork);
  const sendNative = token === 'native';
  const gasEstimates = GAS_ESTIMATES[fromChainName];
  if (!gasEstimates)
    throw new Error(`no gas estimates configured, cannot estimate fees`);
  const nativeDecimals = CHAINS[fromChainName]!.nativeTokenDecimals;

  // Solana gas estimates
  if (fromChainId === MAINNET_CHAINS.solana) {
    return toFixedDecimals(
      utils.formatUnits(gasEstimates.sendToken, nativeDecimals),
      6,
    );
  }

  // Sui gas estimates
  if (fromChainId === MAINNET_CHAINS.sui) {
    if (route === Route.Bridge) {
      return toFixedDecimals(
        utils.formatUnits(gasEstimates.sendToken, nativeDecimals),
        6,
      );
    } else {
      // TODO: automatic payment gas fee est. fallback
      throw new Error('cannot estimate gas fee');
    }
  }

  // Aptos gas estimates
  if (fromChainId === MAINNET_CHAINS.aptos) {
    if (route === Route.Bridge) {
      const aptosClient = (
        wh.getContext(fromChainId) as AptosContext<WormholeContext>
      ).aptosClient as AptosClient;
      const gasPrice = await aptosClient.estimateGasPrice();
      const gasEst = sendNative
        ? gasEstimates.sendNative
        : gasEstimates.sendToken;
      const gasFees = BigNumber.from(gasEst).mul(gasPrice.gas_estimate);
      return toFixedDecimals(utils.formatUnits(gasFees, nativeDecimals), 6);
    } else {
      // TODO: automatic payment gas fee est. fallback
      throw new Error('cannot estimate gas fee');
    }
  }

  if (fromChainId === MAINNET_CHAINS.sei) {
    return toFixedDecimals(
      utils.formatUnits(gasEstimates.sendToken, nativeDecimals),
      6,
    );
  }

  // EVM gas estimates
  const provider = wh.mustGetProvider(fromNetwork);
  const { gasPrice } = await provider.getFeeData();
  let gasEst;
  switch (route) {
    case Route.Bridge:
      gasEst = sendNative ? gasEstimates.sendNative : gasEstimates.sendToken;
      break;
    case Route.Relay:
      gasEst = sendNative
        ? gasEstimates.sendNativeWithRelay
        : gasEstimates.sendTokenWithRelay;
      break;
    case Route.CCTPManual:
      gasEst = gasEstimates.sendCCTPManual;
      break;
    case Route.CCTPRelay:
      gasEst = gasEstimates.sendCCTPWithRelay;
      break;
    default:
      throw new Error('Invalid Route');
  }
  if (!gasPrice)
    throw new Error('gas price not available, cannot estimate fees');
  const gasFees = BigNumber.from(gasEst).mul(gasPrice);
  return toFixedDecimals(utils.formatEther(gasFees), 6);
};

// returns the gas fees estimate for any send transfer
export const estimateSendGasFees = async (
  token: TokenId | 'native',
  amount: number,
  fromNetwork: ChainName | ChainId,
  fromAddress: string,
  toNetwork: ChainName | ChainId,
  toAddress: string,
  route: Route,
  relayerFee: number = 0,
  toNativeToken: number = 0,
): Promise<string> => {
  try {
    const gasFee = await estimateGasFee(
      token,
      amount,
      fromNetwork,
      fromAddress,
      toNetwork,
      toAddress,
      route,
      relayerFee,
      toNativeToken,
    );
    return gasFee;
  } catch (_) {
    return await getGasFeeFallback(token, fromNetwork, route);
  }
};

// returns the gas fee estimates for claiming on the destination chain
export const estimateClaimGasFees = async (
  destChain: ChainName | ChainId,
): Promise<string> => {
  const nativeDecimals = CHAINS[wh.toChainName(destChain)]!.nativeTokenDecimals;
  const name = wh.toChainName(destChain);
  const destChainId = wh.toChainId(destChain);

  if (destChainId === MAINNET_CHAINS.solana) {
    const gasEstimates = GAS_ESTIMATES['solana'];
    return toFixedDecimals(
      utils.formatUnits(gasEstimates?.claim!, nativeDecimals),
      6,
    );
  }

  if (isCosmWasmChain(destChain)) {
    const gasEstimates = GAS_ESTIMATES[name];
    return toFixedDecimals(
      utils.formatUnits(gasEstimates?.claim!, nativeDecimals),
      6,
    );
  }

  if (destChainId === MAINNET_CHAINS.sui) {
    const gasEstimates = GAS_ESTIMATES['sui'];
    return toFixedDecimals(
      utils.formatUnits(gasEstimates?.claim!, nativeDecimals),
      6,
    );
  }

  if (destChainId === MAINNET_CHAINS.aptos) {
    const aptosClient = (
      wh.getContext('aptos') as AptosContext<WormholeContext>
    ).aptosClient;
    const gasPrice = await aptosClient.estimateGasPrice();
    const gasEstimates = GAS_ESTIMATES['aptos'];
    const gasFee = BigNumber.from(gasEstimates?.claim || 0).mul(
      gasPrice.gas_estimate,
    );
    return toFixedDecimals(utils.formatUnits(gasFee, nativeDecimals), 6);
  }

  const provider = wh.mustGetProvider(destChain);
  const gasPrice = await provider.getGasPrice();

  const est = BigNumber.from('300000');
  const gasFee = est.mul(gasPrice);
  return toFixedDecimals(utils.formatEther(gasFee), 6);
};
