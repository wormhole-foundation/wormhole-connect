import { Dispatch, useEffect, useMemo } from 'react';
import { AnyAction } from '@reduxjs/toolkit';

import config from 'config';
import { TokenConfig } from 'config/types';
import { SANCTIONED_WALLETS } from 'consts/wallet';
import { RootState } from 'store';
import {
  TransferInputState,
  setValidations,
  ValidationErr,
  TransferValidations,
  accessBalance,
} from 'store/transferInput';
import { WalletData, WalletState } from 'store/wallet';
import { RelayState } from 'store/relay';
import { walletAcceptedChains } from './wallet';
import { useDispatch, useSelector } from 'react-redux';
import { useDebounce } from 'use-debounce';
import { DataWrapper } from 'store/helpers';
import { Chain, amount as sdkAmount } from '@wormhole-foundation/sdk';

export const validateFromChain = (chain: Chain | undefined): ValidationErr => {
  if (!chain) return 'Select a source chain';
  const chainConfig = config.chains[chain];
  if (!chainConfig) return 'Select a source chain';
  return '';
};

export const validateToChain = (
  chain: Chain | undefined,
  fromChain: Chain | undefined,
): ValidationErr => {
  if (!chain) return 'Select a destination chain';
  const chainConfig = config.chains[chain];
  if (!chainConfig) return 'Select a destination chain';
  if (fromChain && chain === fromChain)
    return 'Source chain and destination chain cannot be the same';
  if (
    config.ui.defaultInputs &&
    config.ui.defaultInputs.requiredChain &&
    chain &&
    fromChain
  ) {
    const { requiredChain } = config.ui.defaultInputs;
    const requiredConfig = config.chains[requiredChain];
    if (
      requiredConfig &&
      chain !== requiredChain &&
      fromChain !== requiredChain
    )
      return `Must select ${requiredConfig.displayName} as either the source or destination chain`;
  }
  return '';
};

export const validateToken = (
  token: string,
  chain: Chain | undefined,
): ValidationErr => {
  if (!token) return 'Select an asset';
  const tokenConfig = config.tokens[token];
  if (!tokenConfig) return 'Select an asset';
  if (chain) {
    const chainConfig = config.chains[chain];
    if (!chainConfig || !!tokenConfig.tokenId) return '';
    if (!tokenConfig.tokenId && tokenConfig.nativeChain !== chain)
      return `${token} not available on ${chain}, select a different token`;
  }
  return '';
};

export const validateDestToken = (
  token: string,
  chain: Chain | undefined,
  supportedTokens: TokenConfig[],
): ValidationErr => {
  if (!token) return 'Select an asset';
  const tokenConfig = config.tokens[token];
  if (!tokenConfig) return 'Select an asset';
  if (chain) {
    const chainConfig = config.chains[chain];
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
  amount: sdkAmount.Amount | undefined,
  balance: sdkAmount.Amount | null,
): ValidationErr => {
  if (!amount) return '';

  // If user has selected chain, token, and has a balance entry, we can compare
  // their amount input to their balance (using base units)
  const amountBaseUnits = sdkAmount.units(amount);
  if (amountBaseUnits === 0n) {
    return 'Amount must be greater than 0';
  }

  if (balance) {
    const balanceBaseUnits = sdkAmount.units(balance);
    if (amountBaseUnits > balanceBaseUnits) {
      return 'Amount exceeds available balance';
    }
  }
  return '';
};

const checkAddressIsSanctioned = (address: string): boolean =>
  SANCTIONED_WALLETS.has(address) || SANCTIONED_WALLETS.has('0x' + address);

export const validateWallet = async (
  wallet: WalletData,
  chain: Chain | undefined,
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

export const validateRelayerFee = (
  route: string,
  routeOptions: any,
): ValidationErr => {
  if (!route) return '';
  return '';
};

export const validateReceiveAmount = (
  route: string,
  receiveAmount: DataWrapper<string>,
  routeOptions: any,
): ValidationErr => {
  if (!route) return '';
  return '';
};

export const getIsAutomatic = (route?: string): boolean => {
  if (!route) return false;
  const r = config.routes.get(route);
  if (!r) return false;
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
    route,
    supportedDestTokens,
  } = transferData;
  const { maxSwapAmt, toNativeToken } = relayData;
  const { sending, receiving } = walletData;
  const isAutomatic = getIsAutomatic(route);
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
    amount: validateAmount(amount, sendingTokenBalance?.balance || null),
    toNativeToken: '',
    relayerFee: '',
    receiveAmount: '',
  };

  if (isAutomatic) {
    if (route === 'AutomaticNtt') {
      // Ntt does not support native gas drop-off
      return baseValidations;
    }
    return {
      ...baseValidations,
      toNativeToken: validateToNativeAmt(toNativeToken, maxSwapAmt),
    };
  } else {
    return baseValidations;
  }
};

export const isTransferValid = (validations: TransferValidations) => {
  for (const validationErr of Object.values(validations)) {
    if (validationErr) {
      return false;
    }
  }
  return true;
};

export const validate = async (
  {
    transferInput,
    relay,
    wallet,
  }: {
    transferInput: TransferInputState;
    relay: RelayState;
    wallet: WalletState;
  },
  dispatch: Dispatch<AnyAction>,
  isCanceled: () => boolean,
) => {
  const validations = await validateAll(transferInput, relay, wallet);

  // if all fields are filled out, show validations
  const showValidationState =
    wallet.sending.address &&
    wallet.receiving.address &&
    transferInput.fromChain &&
    transferInput.toChain &&
    transferInput.token &&
    transferInput.destToken &&
    transferInput.amount &&
    transferInput.routeStates?.some((rs) => rs.supported) !== undefined
      ? true
      : false;

  if (!isCanceled()) {
    dispatch(setValidations({ validations, showValidationState }));
  }
};

const VALIDATION_DELAY_MS = 250;

export const useValidate = () => {
  const dispatch = useDispatch();
  const transferInput = useSelector((state: RootState) => state.transferInput);
  const relay = useSelector((state: RootState) => state.relay);
  const wallet = useSelector((state: RootState) => state.wallet);
  const stateForValidation = useMemo(
    () => ({ transferInput, relay, wallet }),
    [transferInput, relay, wallet],
  );
  const [debouncedStateForValidation] = useDebounce(
    stateForValidation,
    VALIDATION_DELAY_MS,
  );
  useEffect(() => {
    let canceled = false;
    validate(debouncedStateForValidation, dispatch, () => canceled);
    return () => {
      canceled = true;
    };
  }, [debouncedStateForValidation, dispatch]);
};

export const minutesAndSecondsWithPadding = (
  minutes: number,
  seconds: number,
) => {
  const minsPadded = minutes.toString().padStart(2, '0');
  const secsPadded = seconds.toString().padStart(2, '0');
  return `${minsPadded}:${secsPadded}`;
};

export const millisToMinutesAndSeconds = (millis: number) => {
  const minutes = Math.floor(millis / 60000);
  const seconds = Math.floor((millis % 60000) / 1000);
  return minutesAndSecondsWithPadding(minutes, seconds);
};
