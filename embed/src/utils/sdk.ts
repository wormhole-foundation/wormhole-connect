import { Network as Environment } from '@certusone/wormhole-sdk';
import { ethers } from 'ethers';
import {
  WormholeContext,
  ChainConfig,
  TokenId,
  ChainId,
  ChainName,
} from '@sdk';
import { CONFIG as CONF } from '@sdk';
import { MAINNET_NETWORKS, MAINNET_TOKENS } from '../config/mainnet';
import { TESTNET_NETWORKS, TESTNET_TOKENS } from '../config/testnet';

import { PaymentOption } from 'store/transfer';
import { TokenConfig } from 'config/types';

const { REACT_APP_ENV } = process.env;
export const isProduction = REACT_APP_ENV === 'MAINNET';
export const CONFIG = isProduction ? CONF.MAINNET : CONF.TESTNET;
export const CHAINS = isProduction ? MAINNET_NETWORKS : TESTNET_NETWORKS;
export const CHAINS_ARR = Object.values(CHAINS) as ChainConfig[];
export const TOKENS = isProduction ? MAINNET_TOKENS : TESTNET_TOKENS;
export const TOKENS_ARR = Object.values(TOKENS) as TokenConfig[];
export const REQUIRED_CONFIRMATIONS = isProduction ? 13 : 1;

export const context = new WormholeContext(REACT_APP_ENV! as Environment);

export const registerSigner = (signer: any) => {
  console.log('registering signer', signer);
  context.registerSigner('goerli', signer);
};

export const sendTransfer = async (
  token: TokenId | 'native',
  amount: string,
  fromNetwork: ChainName | ChainId,
  fromAddress: string,
  toNetwork: ChainName | ChainId,
  toAddress: string,
  paymentOption: PaymentOption,
  toNativeToken?: string,
) => {
  console.log('preparing send');
  console.log('context:', context);
  const parsedAmt = ethers.utils.parseUnits(amount, 18); // TODO: use token decimals
  const parsedNativeAmt = ethers.utils.parseUnits(toNativeToken || '0', 18);
  if (paymentOption === PaymentOption.MANUAL) {
    const receipt = await context.send(
      token,
      parsedAmt.toString(),
      fromNetwork,
      fromAddress,
      toNetwork,
      toAddress,
      undefined,
    );
    return receipt;
  } else {
    const receipt = await context.sendWithRelay(
      token,
      parsedAmt.toString(),
      fromNetwork,
      fromAddress,
      toNetwork,
      toAddress,
      parsedNativeAmt.toString(),
    );
    return receipt;
  }
};
