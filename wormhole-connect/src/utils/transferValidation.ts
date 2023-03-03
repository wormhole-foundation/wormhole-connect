import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { PaymentOption, TransferState } from 'store/transfer';
import { WalletData, WalletState } from 'store/wallet';
import { walletAcceptedNetworks } from 'utils/wallet';
import { CHAINS, TOKENS } from '../sdk/config';

export type Error = string;
export type Validation = [boolean, Error];

export type TransferValidations = {
  sendingWallet: Validation | undefined,
  receivingWallet: Validation | undefined,
  fromNetwork: Validation | undefined,
  toNetwork: Validation | undefined,
  token: Validation | undefined,
  amount: Validation | undefined,
  destGasPayment: Validation | undefined,
  toNativeToken: Validation | undefined,
}

export let validations: TransferValidations = {
  sendingWallet: undefined,
  receivingWallet: undefined,
  fromNetwork: undefined,
  toNetwork: undefined,
  token: undefined,
  amount: undefined,
  destGasPayment: undefined,
  toNativeToken: undefined,
}

export const required = (val: number | string | undefined): Validation => {
  if (!val) return [false, 'Required'];
  if (typeof val === 'number') {
    if (val <= 0) return [false, 'Amount must be greater than zero'];
    return [true, ''];
  }
  if (val.length === 0) return [false, 'Required'];
  return [true, ''];
}

export const validateFromNetwork = (chain: ChainName | undefined): Validation => {
  if (!chain) return [false, 'Select a source chain'];
  const chainConfig = CHAINS[chain];
  if (!chainConfig) return [false, 'Select a source chain'];
  return [true, ''];
}

export const validateToNetwork = (chain: ChainName | undefined, fromChain: ChainName | undefined): Validation => {
  if (!chain) return [false, 'Select a destination chain'];
  const chainConfig = CHAINS[chain];
  if (!chainConfig) return [false, 'Select a destination chain'];
  if (fromChain && chain === fromChain) return [false, 'Source chain and destination chain cannot be the same'];
  return [true, ''];
}

export const validateToken = (token: string, chain: ChainName | undefined): Validation => {
  if (!token) return [false, 'Select a token'];
  const tokenConfig = TOKENS[token];
  if (!tokenConfig) return [false, 'Select a token'];
  if (chain) {
    const chainConfig = CHAINS[chain];
    if (!chainConfig || !!tokenConfig.tokenId) return [true, ''];
    if (!tokenConfig.tokenId && tokenConfig.nativeNetwork !== chain) return [false, `${token} not available on ${chain}, select a different token`];
  }
  return [true, ''];
}

export const validateAmount = (amount: number | undefined, balance: string | null, minAmt: number | undefined): Validation => {
  if (!amount) return [false, 'Enter an amount'];
  if (amount <= 0) return [false, 'Amount must be greater than 0'];
  console.log('TODO: validate min/max amount', amount, balance, minAmt)
  // const amountBN = BigNumber.from(amount)
  // if (balance && BigNumber.from(balance).lt(amountBN)) return [false, 'Amount cannot exceed balance'];
  // if (minAmt && amountBN.lt(BigNumber.from(minAmt))) return [false, `Minimum amount is ${minAmt}`];
  return [true, ''];
}

export const validateWallet = (wallet: WalletData, chain: ChainName | undefined): Validation => {
  if (!wallet.address) return [false, 'Wallet not connected'];
  if (wallet.currentAddress && wallet.currentAddress !== wallet.address) return [false, 'Switch to connected wallet'];
  const acceptedNetworks = walletAcceptedNetworks[wallet.type];
  if (chain && !acceptedNetworks.includes(chain)) return [false, `Connected wallet is not supported for ${chain}`];
  return [true, ''];
}

export const validateGasPaymentOption = (destGasPayment: PaymentOption, relayAvailable: boolean): Validation => {
  if (destGasPayment === PaymentOption.AUTOMATIC && !relayAvailable) return [false, 'Single transaction gas payment not available for this transaction'];
  return [true, ''];
}

export const validateToNativeAmt = (amount: number, max: number | undefined): Validation => {
  if (amount < 0) return [false, 'Amount must be equal to or greater than zero'];
  if (max && amount > max) return [false, 'Amount exceeds maximum amount'];
  return [true, ''];
}

export const validateAll = (transferData: TransferState, walletData: WalletState) => {
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
    balances
  } = transferData;
  const { sending, receiving } = walletData;
  const isAutomatic = destGasPayment === PaymentOption.AUTOMATIC;
  const minAmt = isAutomatic ? toNativeToken + relayerFee! : 0;
  const baseValidations = {
    sendingWallet: validateWallet(sending, fromNetwork),
    receivingWallet: validateWallet(receiving, toNetwork),
    fromNetwork: validateFromNetwork(fromNetwork),
    toNetwork: validateToNetwork(toNetwork, fromNetwork),
    token: validateToken(token, fromNetwork),
    amount: validateAmount(amount, balances[token], minAmt),
    destGasPayment: [destGasPayment === PaymentOption.MANUAL, ''] as Validation,
    toNativeToken: undefined,
  }
  if (!isAutomatic) return baseValidations;
  return {
    ...baseValidations,
    destGasPayment: validateGasPaymentOption(destGasPayment, automaticRelayAvail),
    toNativeToken: validateToNativeAmt(toNativeToken, maxSwapAmt),
  }
}

export const setValidations = (transferData: TransferState, walletData: WalletState): void => {
  const v = validateAll(transferData, walletData);
  validations = v;
}

export const isTransferValid = (validations: TransferValidations) => {
  for (const validation of Object.values(validations)) {
    if (!!validation && validation[0] === false) return false;
  };
  return true;
}
