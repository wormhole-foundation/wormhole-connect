import { AnyAction } from '@reduxjs/toolkit';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { Dispatch } from 'react';
import { store } from 'store';
import { BRIDGE_DEFAULTS, CHAINS, TOKENS } from '../config';
import { SANCTIONED_WALLETS } from '../consts/wallet';
import {
  TransferInputState,
  setValidations,
  touchValidations,
  Route,
} from '../store/transferInput';
import { WalletData, WalletState } from '../store/wallet';
import { walletAcceptedNetworks } from './wallet';
import { RelayState } from 'store/relay';

export type ValidationErr = string;

export type TransferValidations = {
  sendingWallet: ValidationErr;
  receivingWallet: ValidationErr;
  fromNetwork: ValidationErr;
  toNetwork: ValidationErr;
  token: ValidationErr;
  destToken: ValidationErr;
  amount: ValidationErr;
  route: ValidationErr;
  toNativeToken: ValidationErr;
  foreignAsset: ValidationErr;
  associatedTokenAccount: ValidationErr;
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
  amount: number | undefined,
  balance: string | null,
  route: Route,
  minAmt: number | undefined,
): ValidationErr => {
  if (!amount) return 'Enter an amount';
  if (amount <= 0) return 'Amount must be greater than 0';
  if (!balance) return '';
  const b = Number.parseFloat(balance);
  if (amount > b) return 'Amount cannot exceed balance';
  if (route === Route.BRIDGE) return '';
  if (!minAmt) return '';
  if (amount < minAmt) return `Minimum amount is ${minAmt}`;
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

export const validateRoute = (
  route: Route,
  relayAvailable: boolean,
): ValidationErr => {
  if (route === Route.BRIDGE) return '';
  if (!relayAvailable)
    return 'Single transaction payment not available for this transfer';
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

export const getMinAmount = (
  isAutomatic: boolean,
  relayerFee: number = 0,
  toNativeToken: number = 0,
) => {
  // no minimum amount for manual transfers
  if (!isAutomatic) return 0;

  // has to be slightly higher than the minimum or else tx will revert
  const fees = relayerFee + toNativeToken;
  const min = (fees * 1.05).toFixed(6);
  return Number.parseFloat(min);
};

export const validateAll = async (
  transferData: TransferInputState,
  relayData: RelayState,
  walletData: WalletState,
): Promise<TransferValidations> => {
  const {
    fromNetwork,
    toNetwork,
    token,
    destToken,
    automaticRelayAvail,
    amount,
    balances,
    foreignAsset,
    associatedTokenAddress,
    route,
  } = transferData;
  const { maxSwapAmt, toNativeToken, relayerFee } = relayData;
  const { sending, receiving } = walletData;
  const isAutomatic = route === Route.RELAY;
  const minAmt = getMinAmount(isAutomatic, toNativeToken, relayerFee);
  const baseValidations = {
    sendingWallet: await validateWallet(sending, fromNetwork),
    receivingWallet: await validateWallet(receiving, toNetwork),
    fromNetwork: validateFromNetwork(fromNetwork),
    toNetwork: validateToNetwork(toNetwork, fromNetwork),
    token: validateToken(token, fromNetwork),
    destToken: validateDestToken(destToken, toNetwork),
    amount: validateAmount(amount, balances[token], route, minAmt),
    route: validateRoute(route, automaticRelayAvail),
    toNativeToken: '',
    foreignAsset: validateForeignAsset(foreignAsset),
    associatedTokenAccount: validateSolanaTokenAccount(
      toNetwork,
      foreignAsset,
      associatedTokenAddress,
    ),
  };
  if (!isAutomatic) return baseValidations;
  return {
    ...baseValidations,
    amount: validateAmount(amount, balances[token], route, minAmt),
    route: validateRoute(route, automaticRelayAvail),
    toNativeToken: validateToNativeAmt(toNativeToken, maxSwapAmt),
  };
};

export const isTransferValid = (validations: TransferValidations) => {
  for (const validationErr of Object.values(validations)) {
    if (!!validationErr) return false;
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
    transferInput.fromNetwork &&
    transferInput.toNetwork &&
    transferInput.token &&
    transferInput.destToken &&
    transferInput.amount &&
    transferInput.amount >= 0
  ) {
    dispatch(touchValidations());
  }
  dispatch(setValidations(validations));
};
