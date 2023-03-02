import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber } from 'ethers';
import { PaymentOption, TransferState } from 'store/transfer';
import { WalletData } from 'store/wallet';
import { WalletType, walletAcceptedNetworks } from 'utils/wallet';
import { CHAINS, TOKENS } from './sdk/config';

export type Error = string;
export type Validation = [boolean, Error];

export type TransferValidations = {
  fromNetwork: Validation | undefined,
  toNetwork: Validation | undefined,
  token: Validation | undefined,
  amount: Validation | undefined,
  destGasPayment: Validation | undefined,
  toNativeToken: Validation | undefined,
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
  const amountBN = BigNumber.from(amount)
  if (balance && BigNumber.from(balance).lt(amountBN)) return [false, 'Amount cannot exceed balance'];
  if (minAmt && amountBN.lt(BigNumber.from(minAmt))) return [false, `Minimum amount is ${minAmt}`];
  return [true, ''];
}

export const validateWallet = (wallet: WalletData, chain: ChainName | undefined): Validation => {
  if (wallet.type === WalletType.NONE) return [false, 'Connect wallet'];
  if (!wallet.address || !wallet.currentAddress) return [false, 'Connect wallet'];
  // if (wallet.currentAddress !== wallet.address) return [false, 'Switch to connected wallet'];
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
  const amountBN = BigNumber.from(amount);
  if (amountBN.gt(BigNumber.from(max))) return [false, 'Amount exceeds maximum amount'];
  return [true, ''];
}

export const validateAll = (data: TransferState) => {
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
  } = data;
  const isAutomatic = destGasPayment === PaymentOption.AUTOMATIC;
  const minAmt = isAutomatic ? toNativeToken + relayerFee! : 0;
  const baseValidations = {
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

export const isTransferValid = (validations: TransferValidations) => {
  Object.values(validations).forEach((validation) => {
    if (!!validation && validation[0] === false) return false;
  });
  return true;
}
