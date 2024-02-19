import { Dispatch, useEffect, useMemo } from 'react';
import { AnyAction } from '@reduxjs/toolkit';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';

import { BRIDGE_DEFAULTS, CHAINS, TOKENS } from 'config';
import { Route, TokenConfig } from 'config/types';
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
import RouteOperator from '../routes/operator';
import { useDispatch, useSelector } from 'react-redux';
import { useDebounce } from 'use-debounce';
import { isPorticoRoute } from 'routes/porticoBridge/utils';
import { PorticoBridgeState } from 'store/porticoBridge';
import { DataWrapper } from 'store/helpers';
import { CCTPManual_CHAINS as CCTP_CHAINS } from 'routes/cctpManual';
import { CCTP_MAX_TRANSFER_LIMIT } from 'consts';

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
  maxAmount: number,
  isCctp?: boolean,
): ValidationErr => {
  if (amount === '') return '';
  const numAmount = Number.parseFloat(amount);
  if (isNaN(numAmount)) return 'Amount must be a number';
  if (numAmount <= 0) return 'Amount must be greater than 0';
  if (balance) {
    const b = Number.parseFloat(balance);
    if (numAmount > b) return 'Amount cannot exceed balance';
  }
  if (isCctp && numAmount >= CCTP_MAX_TRANSFER_LIMIT)
    return `Your transaction exceeds the maximum transfer limit of ${Intl.NumberFormat(
      'en-EN',
    ).format(CCTP_MAX_TRANSFER_LIMIT)} USDC. Please use a different amount.`;
  if (numAmount > maxAmount) {
    return `At the moment, amount cannot exceed ${maxAmount}`;
  }
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
  if (route === Route.Relay || route === Route.TBTC) return '';
  if (!destTokenAddr) return '';
  if (destTokenAddr && !solanaTokenAccount) {
    return 'The associated token account for this asset does not exist on Solana, you must create it first';
  }
  return '';
};

export const validateRelayerFee = (
  route: Route | undefined,
  routeOptions: any,
): ValidationErr => {
  if (!route) return '';
  if (isPorticoRoute(route) && routeOptions.relayerFee.error) {
    return 'Error fetching relayer fee';
  }
  return '';
};

export const validateReceiveAmount = (
  route: Route | undefined,
  receiveAmount: DataWrapper<string>,
  routeOptions: any,
): ValidationErr => {
  if (!route) return '';
  if (
    isPorticoRoute(route) &&
    // the portico receive amount depends on the relayer fee
    routeOptions.relayerFee.data &&
    !routeOptions.swapAmounts.isFetching &&
    receiveAmount.error
  ) {
    return receiveAmount.error;
  }
  return '';
};

export const getMinAmt = (
  route: Route | undefined,
  routeOptions: any,
): number => {
  if (!route) return 0;
  const r = RouteOperator.getRoute(route);
  return r.getMinSendAmount(routeOptions);
};

export const getMaxAmt = (route: Route | undefined): number => {
  if (!route) return Infinity;
  const r = RouteOperator.getRoute(route);
  return r.getMaxSendAmount();
};

export const getIsAutomatic = (route: Route | undefined): boolean => {
  if (!route) return false;
  const r = RouteOperator.getRoute(route);
  return r.AUTOMATIC_DEPOSIT;
};

export const isCctp = (
  token: string,
  destToken: string,
  toChain: ChainName | undefined,
  fromChain: ChainName | undefined,
): boolean => {
  const isUSDCToken =
    TOKENS[token]?.symbol === 'USDC' &&
    TOKENS[destToken]?.symbol === 'USDC' &&
    TOKENS[token]?.nativeChain === fromChain &&
    TOKENS[destToken]?.nativeChain === toChain;
  const bothChainsSupportCCTP =
    !!toChain &&
    CCTP_CHAINS.includes(toChain) &&
    !!fromChain &&
    CCTP_CHAINS.includes(fromChain);

  return isUSDCToken && bothChainsSupportCCTP;
};

export const validateAll = async (
  transferData: TransferInputState,
  relayData: RelayState,
  walletData: WalletState,
  porticoData: PorticoBridgeState,
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
    routeStates,
    receiveAmount,
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
  const maxSendAmount = getMaxAmt(route);
  const availableRoutes = routeStates
    ?.filter((rs) => rs.supported)
    .map((val) => val.name);
  const isCctpTx = isCctp(token, destToken, toChain, fromChain);
  const baseValidations = {
    sendingWallet: await validateWallet(sending, fromChain),
    receivingWallet: await validateWallet(receiving, toChain),
    fromChain: validateFromChain(fromChain),
    toChain: validateToChain(toChain, fromChain),
    token: validateToken(token, fromChain),
    destToken: validateDestToken(destToken, toChain, supportedDestTokens),
    amount: validateAmount(
      amount,
      sendingTokenBalance,
      maxSendAmount,
      isCctpTx,
    ),
    route: validateRoute(route, availableRoutes),
    toNativeToken: '',
    foreignAsset: validateForeignAsset(foreignAsset),
    relayerFee: '',
    receiveAmount: '',
  };

  if (isAutomatic) {
    return {
      ...baseValidations,
      toNativeToken: validateToNativeAmt(toNativeToken, maxSwapAmt),
    };
  } else if (route && isPorticoRoute(route)) {
    return {
      ...baseValidations,
      relayerFee: validateRelayerFee(route, porticoData),
      receiveAmount: validateReceiveAmount(route, receiveAmount, porticoData),
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
    portico,
  }: {
    transferInput: TransferInputState;
    relay: RelayState;
    wallet: WalletState;
    portico: PorticoBridgeState;
  },
  dispatch: Dispatch<AnyAction>,
) => {
  const validations = await validateAll(transferInput, relay, wallet, portico);

  // if all fields are filled out, show validations
  const showValidationState =
    wallet.sending.address &&
    wallet.receiving.address &&
    transferInput.fromChain &&
    transferInput.toChain &&
    transferInput.token &&
    transferInput.destToken &&
    transferInput.amount &&
    Number.parseFloat(transferInput.amount) >= 0 &&
    transferInput.routeStates?.some((rs) => rs.supported) !== undefined
      ? true
      : false;
  dispatch(setValidations({ validations, showValidationState }));
};

const VALIDATION_DELAY_MS = 250;

export const useValidate = () => {
  const dispatch = useDispatch();
  const transferInput = useSelector((state: RootState) => state.transferInput);
  const relay = useSelector((state: RootState) => state.relay);
  const wallet = useSelector((state: RootState) => state.wallet);
  const portico = useSelector((state: RootState) => state.porticoBridge);
  const stateForValidation = useMemo(
    () => ({ transferInput, relay, wallet, portico }),
    [transferInput, relay, wallet, portico],
  );
  const [debouncedStateForValidation] = useDebounce(
    stateForValidation,
    VALIDATION_DELAY_MS,
  );
  useEffect(() => {
    validate(debouncedStateForValidation, dispatch);
  }, [debouncedStateForValidation, dispatch]);
};

export const millisToMinutesAndSeconds = (millis: number) => {
  const minutes = Math.floor(millis / 60000);
  const seconds = Math.floor((millis % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
};
