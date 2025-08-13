import { ethers, TransactionRequest } from 'ethers';
import { MayanForwarderShimContractABI } from './abi';
import { addresses } from '@mayanfinance/swap-sdk';
import { Network } from '@wormhole-foundation/sdk-connect';

const ForwardEth = 'forwardEth';
const ForwardERC20 = 'forwardERC20';

const MayanForwarderShimContractAddress =
  '0x87a26566dbb3bf206634c1792a96ff4989e3f56e';

function createMayanForwarderShim() {
  const contractInterface = new ethers.Interface(MayanForwarderShimContractABI);

  function encodeForwardEth(forwarderData: string, payee: string, fee: bigint) {
    return contractInterface.encodeFunctionData(ForwardEth, [
      forwarderData,
      { payee, fee },
    ]);
  }

  function encodeForwardERC20(
    forwarderData: string,
    tokenIn: string,
    amountIn: bigint,
    payee: string,
    fee: bigint,
  ) {
    return contractInterface.encodeFunctionData(ForwardERC20, [
      forwarderData,
      tokenIn,
      amountIn,
      { payee, fee },
    ]);
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

function useMayanForwarderShim(
  network: Network,
  feeUnits: bigint,
  isNewEvmReferralEnabled?: boolean,
) {
  if (feeUnits <= 0n || !isNewEvmReferralEnabled || network !== 'Mainnet') {
    return false;
  }

  return true;
}

function getEvmContractAddress(
  network: Network,
  feeUnits: bigint,
  isNewEvmReferralEnabled?: boolean,
) {
  if (useMayanForwarderShim(network, feeUnits, isNewEvmReferralEnabled)) {
    return MayanForwarderShimContractAddress;
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
  isNewEvmReferralEnabled?: boolean,
): TransactionRequest {
  if (
    !mayanTxRequest.data ||
    !useMayanForwarderShim(network, feeUnits, isNewEvmReferralEnabled)
  ) {
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
    to: MayanForwarderShimContractAddress,
    data,
    value,
    chainId: mayanTxRequest.chainId,
  };
}

export {
  createMayanForwarderShim,
  getEvmContractAddress,
  createTransactionRequest,
};
