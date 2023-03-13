import { AnyAction } from '@reduxjs/toolkit';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { Dispatch } from 'react';
import { store } from 'store';
import { TransferState, validateTransfer } from 'store/transfer';
import { WalletData, WalletState } from 'store/wallet';
import { walletAcceptedNetworks } from 'utils/wallet';
import { CHAINS, TOKENS } from '../sdk/config';
import { PaymentOption } from 'sdk/sdk';

export type Error = string;
export type ValidationErr = string;

export type TransferValidations = {
  sendingWallet: ValidationErr;
  receivingWallet: ValidationErr;
  fromNetwork: ValidationErr;
  toNetwork: ValidationErr;
  token: ValidationErr;
  amount: ValidationErr;
  destGasPayment: ValidationErr;
  toNativeToken: ValidationErr;
};

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
  return '';
};

export const validateToken = (
  token: string,
  chain: ChainName | undefined,
): ValidationErr => {
  if (!token) return 'Select a token';
  const tokenConfig = TOKENS[token];
  if (!tokenConfig) return 'Select a token';
  if (chain) {
    const chainConfig = CHAINS[chain];
    if (!chainConfig || !!tokenConfig.tokenId) return '';
    if (!tokenConfig.tokenId && tokenConfig.nativeNetwork !== chain)
      return `${token} not available on ${chain}, select a different token`;
  }
  return '';
};

export const validateAmount = (
  amount: number | undefined,
  balance: string | null,
  paymentOption: PaymentOption,
  minAmt: number | undefined,
): ValidationErr => {
  if (!amount) return 'Enter an amount';
  if (amount <= 0) return 'Amount must be greater than 0';
  if (!balance) return '';
  const b = Number.parseFloat(balance);
  if (amount > b) return 'Amount cannot exceed balance';
  if (paymentOption === PaymentOption.MANUAL) return '';
  if (!minAmt) return '';
  if (amount < minAmt) return `Minimum amount is ${minAmt}`;
  if (amount + minAmt > b)
    return 'Amount plus estimated fees exceeds the wallet balance';
  return '';
};

export const validateWallet = (
  wallet: WalletData,
  chain: ChainName | undefined,
): ValidationErr => {
  if (!wallet.address) return 'Wallet not connected';
  if (wallet.currentAddress && wallet.currentAddress !== wallet.address)
    return 'Switch to connected wallet';
  const acceptedNetworks = walletAcceptedNetworks[wallet.type];
  if (chain && !acceptedNetworks.includes(chain))
    return `Connected wallet is not supported for ${chain}`;
  return '';
};

export const validateGasPaymentOption = (
  destGasPayment: PaymentOption,
  relayAvailable: boolean,
): ValidationErr => {
  if (destGasPayment === PaymentOption.AUTOMATIC && !relayAvailable)
    return 'Single transaction gas payment not available for this transaction';
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

export const validateDestGasPayment = (
  payment: PaymentOption,
  relayAvailable: boolean,
) => {
  if (payment === PaymentOption.MANUAL) return '';
  if (!relayAvailable)
    return 'Single transaction payment not available for this transfer';
  return '';
};

export const validateAll = (
  transferData: TransferState,
  walletData: WalletState,
) => {
  const {
    fromNetwork,
    toNetwork,
    token,
    automaticRelayAvail,
    amount,
    destGasPayment,
    maxSwapAmt,
    toNativeToken,
    relayerFee,
    balances,
  } = transferData;
  const { sending, receiving } = walletData;
  const isAutomatic = destGasPayment === PaymentOption.AUTOMATIC;
  const minAmt = isAutomatic ? toNativeToken + (relayerFee || 0) : 0;
  const baseValidations = {
    sendingWallet: validateWallet(sending, fromNetwork),
    receivingWallet: validateWallet(receiving, toNetwork),
    fromNetwork: validateFromNetwork(fromNetwork),
    toNetwork: validateToNetwork(toNetwork, fromNetwork),
    token: validateToken(token, fromNetwork),
    amount: validateAmount(amount, balances[token], destGasPayment, minAmt),
    destGasPayment: validateDestGasPayment(destGasPayment, automaticRelayAvail),
    toNativeToken: '',
  };
  if (!isAutomatic) return baseValidations;
  return {
    ...baseValidations,
    amount: validateAmount(amount, balances[token], destGasPayment, minAmt),
    destGasPayment: validateGasPaymentOption(
      destGasPayment,
      automaticRelayAvail,
    ),
    toNativeToken: validateToNativeAmt(toNativeToken, maxSwapAmt),
  };
};

export const isTransferValid = (validations: TransferValidations) => {
  for (const validationErr of Object.values(validations)) {
    if (!!validationErr) return false;
  }
  return true;
};

export const validate = (dispatch: Dispatch<AnyAction>) => {
  const state = store.getState();
  dispatch(validateTransfer(state.wallet));
};
