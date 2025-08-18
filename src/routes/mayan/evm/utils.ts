import { addresses } from '@mayanfinance/swap-sdk';
import type { Network } from '@wormhole-foundation/sdk-connect';
import type { TransactionRequest } from 'ethers';
import {
  ForwardERC20,
  ForwardEth,
  MAYAN_FORWARDER_SHIM_CONTRACT_ADDRESS,
  MAYAN_FORWARDER_SHIM_CONTRACT_INTERFACE,
} from '../consts';

function createMayanForwarderShim() {
  function encodeForwardEth(forwarderData: string, payee: string, fee: bigint) {
    return MAYAN_FORWARDER_SHIM_CONTRACT_INTERFACE.encodeFunctionData(
      ForwardEth,
      [forwarderData, { payee, fee }],
    );
  }

  function encodeForwardERC20(
    forwarderData: string,
    tokenIn: string,
    amountIn: bigint,
    payee: string,
    fee: bigint,
  ) {
    return MAYAN_FORWARDER_SHIM_CONTRACT_INTERFACE.encodeFunctionData(
      ForwardERC20,
      [forwarderData, tokenIn, amountIn, { payee, fee }],
    );
  }

  function encodeFunctionData(
    forwarderData: string,
    payee: string,
    fee: bigint,
    tokenIn: string,
    amountIn: bigint,
    isNativeToken: boolean,
  ) {
    if (isNativeToken) {
      return encodeForwardEth(forwarderData, payee, fee);
    } else {
      return encodeForwardERC20(forwarderData, tokenIn, amountIn, payee, fee);
    }
  }

  function getMsgValue(amountIn: bigint, isNativeToken: boolean) {
    if (isNativeToken) {
      return amountIn;
    } else {
      return 0n;
    }
  }

  return { encodeFunctionData, getMsgValue };
}

function getMayanForwarderShim(network: Network, feeUnits: bigint) {
  if (feeUnits <= 0n || network !== 'Mainnet') {
    return false;
  }

  return true;
}

function getEvmContractAddress(network: Network, feeUnits: bigint) {
  if (getMayanForwarderShim(network, feeUnits)) {
    return MAYAN_FORWARDER_SHIM_CONTRACT_ADDRESS;
  }
  return addresses.MAYAN_FORWARDER_CONTRACT;
}

function createTransactionRequest(
  network: Network,
  mayanTxRequest: TransactionRequest,
  amountUnits: bigint,
  feeUnits: bigint,
  sender: string,
  referrer: string,
  tokenAddress: string,
  isNativeToken: boolean,
): TransactionRequest {
  if (!mayanTxRequest.data || !getMayanForwarderShim(network, feeUnits)) {
    return mayanTxRequest;
  }

  const mayanForwarder = createMayanForwarderShim();

  const data = mayanForwarder.encodeFunctionData(
    mayanTxRequest.data,
    referrer,
    feeUnits,
    tokenAddress,
    amountUnits,
    isNativeToken,
  );

  const value = mayanForwarder.getMsgValue(amountUnits, isNativeToken);

  return {
    from: sender,
    to: MAYAN_FORWARDER_SHIM_CONTRACT_ADDRESS,
    data,
    value,
    chainId: mayanTxRequest.chainId,
  };
}

export {
  createMayanForwarderShim,
  createTransactionRequest,
  getEvmContractAddress,
};
