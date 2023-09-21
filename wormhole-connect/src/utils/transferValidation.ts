import { Dispatch } from 'react';
import { AnyAction } from '@reduxjs/toolkit';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';

import { BRIDGE_DEFAULTS, CHAINS, TOKENS } from 'config';
import { Route, TokenConfig } from 'config/types';
import { SANCTIONED_WALLETS } from 'consts/wallet';
import { store } from 'store';
import {
  TransferInputState,
  setValidations,
  touchValidations,
  ValidationErr,
  TransferValidations,
  accessBalance,
} from 'store/transferInput';
import { WalletData, WalletState } from 'store/wallet';
import { RelayState } from 'store/relay';
import { walletAcceptedChains } from './wallet';
import RouteOperator from './routes/operator';

export const validateFromChain = (
  chain: ChainName | undefined,
): ValidationErr => {
  if (!chain) return 'Select a source chain';
  const chainConfig = CHAINS[chain];
  if (!chainConfig) return 'Select a source chain';
  return '';
};

export const validateToChain = (
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
    if (!tokenConfig.tokenId && tokenConfig.nativeChain !== chain)
      return `${token} not available on ${chain}, select a different token`;
  }
  return '';
};

export const validateDestToken = (
  token: string,
  chain: ChainName | undefined,
  supportedTokens: TokenConfig[],
): ValidationErr => {
  if (!token) return 'Select an asset';
  const tokenConfig = TOKENS[token];
  if (!tokenConfig) return 'Select an asset';
  if (chain) {
    const chainConfig = CHAINS[chain];
    if (!chainConfig || !!tokenConfig.tokenId) return '';
    if (!tokenConfig.tokenId && tokenConfig.nativeChain !== chain)
      return `${token} not available on ${chain}, select a different token`;
  }
  if (!supportedTokens.some((t) => t.key === token)) {
    return 'No route available for this token, please select another';
  }
  return '';
};

export const validateAmount = (
  amount: string,
  balance: string | null,
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
  const acceptedChains = walletAcceptedChains(wallet.type);
  if (chain && !acceptedChains.includes(chain))
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
  route: Route | undefined,
  availableRoutes: string[] | undefined,
): ValidationErr => {
  if (!route || !availableRoutes || !availableRoutes.includes(route)) {
    return 'No bridge or swap route available for selected tokens';
  }
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
  route: Route | undefined,
): ValidationErr => {
  if (destChain !== 'solana') return '';
  if (route === Route.Relay) return '';
  if (!destTokenAddr) return '';
  if (destTokenAddr && !solanaTokenAccount) {
    return 'The associated token account for this asset does not exist on Solana, you must create it first';
  }
  return '';
};

export const getMinAmt = (route: Route | undefined, relayData: any): number => {
  if (!route) return 0;
  const r = RouteOperator.getRoute(route);
  return r.getMinSendAmount(relayData);
};

export const getIsAutomatic = (route: Route | undefined): boolean => {
  if (!route) return false;
  const r = RouteOperator.getRoute(route);
  return r.AUTOMATIC_DEPOSIT;
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
    balances,
    foreignAsset,
    route,
    supportedDestTokens,
    availableRoutes,
  } = transferData;
  const { maxSwapAmt, toNativeToken } = relayData;
  const { sending, receiving } = walletData;
  const isAutomatic = getIsAutomatic(route);
  const minAmt = getMinAmt(route, relayData);
  const sendingTokenBalance = accessBalance(
    balances,
    sending.address,
    fromChain,
    token,
  );

  const baseValidations = {
    sendingWallet: await validateWallet(sending, fromChain),
    receivingWallet: await validateWallet(receiving, toChain),
    fromChain: validateFromChain(fromChain),
    toChain: validateToChain(toChain, fromChain),
    token: validateToken(token, fromChain),
    destToken: validateDestToken(destToken, toChain, supportedDestTokens),
    amount: validateAmount(amount, sendingTokenBalance, minAmt),
    route: validateRoute(route, availableRoutes),
    toNativeToken: '',
    foreignAsset: validateForeignAsset(foreignAsset),
  };
  if (!isAutomatic) return baseValidations;
  return {
    ...baseValidations,
    amount: validateAmount(amount, sendingTokenBalance, minAmt),
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
    Number.parseFloat(transferInput.amount) >= 0 &&
    transferInput.availableRoutes !== undefined
  ) {
    dispatch(touchValidations());
  }
  dispatch(setValidations(validations));
};
