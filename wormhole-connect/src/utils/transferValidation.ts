import { Dispatch } from 'react';
import { AnyAction } from '@reduxjs/toolkit';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';

import { BRIDGE_DEFAULTS, CHAINS, TOKENS } from 'config';
import { Route } from 'config/types';
import { SANCTIONED_WALLETS } from 'consts/wallet';
import { store } from 'store';
import {
  TransferInputState,
  setValidations,
  touchValidations,
  ValidationErr,
  TransferValidations,
} from '../store/transferInput';
import { WalletData, WalletState } from '../store/wallet';
import { walletAcceptedNetworks } from './wallet';
import { RelayState } from 'store/relay';
import RouteOperator from './routes/operator';

export const validateFromNetwork = (
  chain: ChainName | undefined,
): ValidationErr => {
  if (!chain) return 'Select a source chain';
  const chainConfig = CHAINS[chain];
  if (!chainConfig) return 'Select a source chain';
  return '';
};

export const validateToNetwork = (
  chain: ChainName | undefined,
  fromChain: ChainName | undefined,
): ValidationErr => {
  if (!chain) return 'Select a destination chain';
  const chainConfig = CHAINS[chain];
  if (!chainConfig) return 'Select a destination chain';
  if (fromChain && chain === fromChain)
    return 'Source chain and destination chain cannot be the same';
  if (
    BRIDGE_DEFAULTS &&
    BRIDGE_DEFAULTS.requiredNetwork &&
    chain &&
    fromChain
  ) {
    const { requiredNetwork } = BRIDGE_DEFAULTS;
    const requiredConfig = CHAINS[requiredNetwork];
    if (
      requiredConfig &&
      chain !== requiredNetwork &&
      fromChain !== requiredNetwork
    )
      return `Must select ${requiredConfig.displayName} as either the source or destination chain`;
  }
  return '';
};

export const validateToken = (
  token: string,
  chain: ChainName | undefined,
): ValidationErr => {
  if (!token) return 'Select an asset';
  const tokenConfig = TOKENS[token];
  if (!tokenConfig) return 'Select an asset';
  if (chain) {
    const chainConfig = CHAINS[chain];
    if (!chainConfig || !!tokenConfig.tokenId) return '';
    if (!tokenConfig.tokenId && tokenConfig.nativeNetwork !== chain)
      return `${token} not available on ${chain}, select a different token`;
  }
  return '';
};

export const validateDestToken = (
  token: string,
  chain: ChainName | undefined,
): ValidationErr => {
  if (!token) return 'Select an asset';
  const tokenConfig = TOKENS[token];
  if (!tokenConfig) return 'Select an asset';
  if (chain) {
    const chainConfig = CHAINS[chain];
    if (!chainConfig || !!tokenConfig.tokenId) return '';
    if (!tokenConfig.tokenId && tokenConfig.nativeNetwork !== chain)
      return `${token} not available on ${chain}, select a different token`;
  }
  return '';
};

export const validateAmount = (
  amount: string,
  balance: string | null,
  route: Route,
  minAmt: number | undefined,
): ValidationErr => {
  const numAmount = Number.parseFloat(amount);
  if (!numAmount) return 'Enter an amount';
  if (numAmount <= 0) return 'Amount must be greater than 0';
  if (balance) {
    const b = Number.parseFloat(balance);
    if (numAmount > b) return 'Amount cannot exceed balance';
  }
  if (!minAmt) return '';
  if (numAmount < minAmt) return `Minimum amount is ${minAmt}`;
  return '';
};

const checkAddressIsSanctioned = (address: string): boolean =>
  SANCTIONED_WALLETS.has(address) || SANCTIONED_WALLETS.has('0x' + address);

export const validateWallet = async (
  wallet: WalletData,
  chain: ChainName | undefined,
): Promise<ValidationErr> => {
  if (!wallet.address) return 'Wallet not connected';
  try {
    const isSanctioned = await checkAddressIsSanctioned(wallet.address);
    if (isSanctioned)
      return 'This address is sanctioned, bridging is not available';
  } catch (e) {
    // TODO: how do we want to handle if we get an error from the API?
    console.error(e);
  }
  if (wallet.currentAddress && wallet.currentAddress !== wallet.address)
    return 'Switch to connected wallet';
  const acceptedNetworks = walletAcceptedNetworks(wallet.type);
  if (chain && !acceptedNetworks.includes(chain))
    return `Connected wallet is not supported for ${chain}`;
  return '';
};

export const validateToNativeAmt = (
  amount: number,
  max: number | undefined,
): ValidationErr => {
  if (amount < 0) return 'Amount must be equal to or greater than zero';
  if (max && amount > max) return 'Amount exceeds maximum amount';
  return '';
};

export const validateRoute = (route: Route): ValidationErr => {
  // TODO: better validation
  return '';
};

export const validateForeignAsset = (
  destTokenAddr: string | undefined,
): ValidationErr => {
  if (!destTokenAddr) {
    return 'No wrapped asset exists for this token';
  }
  return '';
};

export const validateSolanaTokenAccount = (
  destChain: string | undefined,
  destTokenAddr: string,
  solanaTokenAccount: string,
): ValidationErr => {
  if (destChain !== 'solana') return '';
  if (!destTokenAddr) return '';
  if (destTokenAddr && !solanaTokenAccount) {
    return 'The associated token account for this asset does not exist on Solana, you must create it first';
  }
  return '';
};

export const validateAll = async (
  transferData: TransferInputState,
  relayData: RelayState,
  walletData: WalletState,
): Promise<TransferValidations> => {
  const {
    fromChain,
    toChain,
    token,
    destToken,
    amount,
    sourceBalances: balances,
    foreignAsset,
    associatedTokenAddress,
    route,
  } = transferData;
  const { maxSwapAmt, toNativeToken } = relayData;
  const { sending, receiving } = walletData;
  if (!route) throw new Error('no route selected');
  const r = RouteOperator.getRoute(route);
  const isAutomatic = r.AUTOMATIC_DEPOSIT;
  const minAmt = r.getMinSendAmount(relayData);
  const baseValidations = {
    sendingWallet: await validateWallet(sending, fromChain),
    receivingWallet: await validateWallet(receiving, toChain),
    fromChain: validateFromNetwork(fromChain),
    toChain: validateToNetwork(toChain, fromChain),
    token: validateToken(token, fromChain),
    destToken: validateDestToken(destToken, toChain),
    amount: validateAmount(amount, balances[token], route, minAmt),
    route: validateRoute(route),
    toNativeToken: '',
    foreignAsset: validateForeignAsset(foreignAsset),
    associatedTokenAccount: validateSolanaTokenAccount(
      toChain,
      foreignAsset,
      associatedTokenAddress,
    ),
  };
  if (!isAutomatic) return baseValidations;
  return {
    ...baseValidations,
    amount: validateAmount(amount, balances[token], route, minAmt),
    route: validateRoute(route),
    toNativeToken: validateToNativeAmt(toNativeToken, maxSwapAmt),
  };
};

export const isTransferValid = (validations: TransferValidations) => {
  for (const validationErr of Object.values(validations)) {
    if (!!validationErr) {
      return false;
    }
  }
  return true;
};

export const validate = async (dispatch: Dispatch<AnyAction>) => {
  const { transferInput, relay, wallet } = store.getState();
  const validations = await validateAll(transferInput, relay, wallet);
  // if all fields are filled out, show validations
  if (
    wallet.sending.address &&
    wallet.receiving.address &&
    transferInput.fromChain &&
    transferInput.toChain &&
    transferInput.token &&
    transferInput.destToken &&
    transferInput.amount &&
    Number.parseFloat(transferInput.amount) >= 0
  ) {
    dispatch(touchValidations());
  }
  dispatch(setValidations(validations));
};
