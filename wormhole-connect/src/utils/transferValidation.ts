import { AnyAction } from '@reduxjs/toolkit';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import fetch from 'node-fetch';
import { Dispatch } from 'react';
import { store } from 'store';
import {
  TransferState,
  setValidations,
  touchValidations,
} from '../store/transfer';
import { WalletData, WalletState } from '../store/wallet';
import { walletAcceptedNetworks } from './wallet';
import { CHAINS, TOKENS, WH_CONFIG, BRIDGE_DEFAULTS } from '../config';
import { PaymentOption } from '../sdk';

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
  foreignAsset: ValidationErr;
  associatedTokenAccount: ValidationErr;
};

let trmCache: any = {};

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
  return '';
};

async function checkAddressIsSanctioned(address: string): Promise<boolean> {
  if (trmCache[address]) {
    return trmCache[address].isSanctioned;
  }
  const defaultAuth =
    'Basic ' + Buffer.from('<username>:<password>').toString('base64');
  const res = await fetch(
    `https://api.trmlabs.com/public/v1/sanctions/screening`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          process.env.REACT_APP_TRM_API_KEY && WH_CONFIG.env === 'MAINNET'
            ? process.env.REACT_APP_TRM_API_KEY
            : defaultAuth,
      },
      body: JSON.stringify([{ address }]),
    },
  );

  if (res.status !== 200 && res.status !== 201) {
    // set cache so it stops making requests
    if (res.status === 429) {
      trmCache[address] = {
        address,
        isSanctioned: false,
      };
    }
    return false;
  }

  const data = await res.json();
  trmCache[address] = data[0];
  return data[0].isSanctioned;
}

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
): ValidationErr => {
  if (payment === PaymentOption.MANUAL) return '';
  if (!relayAvailable)
    return 'Single transaction payment not available for this transfer';
  return '';
};

export const validateDestToken = (
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
  toNativeToken: number,
  relayerFee: number | undefined,
) => {
  return isAutomatic ? toNativeToken + (relayerFee || 0) : 0;
};

export const validateAll = async (
  transferData: TransferState,
  walletData: WalletState,
): Promise<TransferValidations> => {
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
    foreignAsset,
    associatedTokenAddress,
  } = transferData;
  const { sending, receiving } = walletData;
  const isAutomatic = destGasPayment === PaymentOption.AUTOMATIC;
  const minAmt = getMinAmount(isAutomatic, toNativeToken, relayerFee);
  const baseValidations = {
    sendingWallet: await validateWallet(sending, fromNetwork),
    receivingWallet: await validateWallet(receiving, toNetwork),
    fromNetwork: validateFromNetwork(fromNetwork),
    toNetwork: validateToNetwork(toNetwork, fromNetwork),
    token: validateToken(token, fromNetwork),
    amount: validateAmount(amount, balances[token], destGasPayment, minAmt),
    destGasPayment: validateDestGasPayment(destGasPayment, automaticRelayAvail),
    toNativeToken: '',
    foreignAsset: validateDestToken(foreignAsset),
    associatedTokenAccount: validateSolanaTokenAccount(
      toNetwork,
      foreignAsset,
      associatedTokenAddress,
    ),
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

export const validate = async (dispatch: Dispatch<AnyAction>) => {
  const { transfer, wallet } = store.getState();
  const validations = await validateAll(transfer, wallet);
  // if all fields are filled out, show validations
  if (
    wallet.sending.address &&
    wallet.receiving.address &&
    transfer.fromNetwork &&
    transfer.toNetwork &&
    transfer.token &&
    transfer.amount &&
    transfer.amount >= 0
  ) {
    dispatch(touchValidations());
  }
  dispatch(setValidations(validations));
};
