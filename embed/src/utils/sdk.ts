import { Network as Environment } from '@certusone/wormhole-sdk';
import { ethers, PayableOverrides } from 'ethers';
import {
  WormholeContext,
  ChainConfig,
  TokenId,
  ChainId,
  ChainName,
} from 'sdk';
import { CONFIG as CONF } from 'sdk';
import { MAINNET_NETWORKS, MAINNET_TOKENS } from '../config/mainnet';
import { TESTNET_NETWORKS, TESTNET_TOKENS } from '../config/testnet';

import { PaymentOption } from 'store/transfer';
import { TokenConfig } from 'config/types';
import { getTokenDecimals } from 'utils';

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
  const decimals = getTokenDecimals(token);
  const parsedAmt = ethers.utils.parseUnits(amount, decimals);
  // const parsedNativeAmt = ethers.utils.parseUnits(toNativeToken || '0', decimals);
  const parsedNativeAmt = ethers.utils.parseUnits('0.001', decimals);
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
    const receipt = await sendWithRelay(
      token,
      parsedAmt.toString(),
      parsedNativeAmt.toString(),
      fromNetwork,
      fromAddress,
      toNetwork,
      toAddress,
    );
    return receipt;
  }
};

async function sendWithRelay(
  token: TokenId | 'native',
  amount: string,
  toNativeToken: string,
  sendingChain: ChainName | ChainId,
  senderAddress: string,
  recipientChain: ChainName | ChainId,
  recipientAddress: string,
  overrides?: PayableOverrides & { from?: string | Promise<string> },
): Promise<ethers.ContractReceipt> {
  const isAddress = ethers.utils.isAddress(recipientAddress);
  if (!isAddress)
    throw new Error(`invalid recipient address: ${recipientAddress}`);
  const recipientChainId = context.resolveDomain(recipientChain);
  const amountBN = ethers.BigNumber.from(amount);
  const relayer = context.mustGetTBRelayer(sendingChain);
  const nativeTokenBN = ethers.BigNumber.from(toNativeToken);
  const unwrapWeth = await relayer.unwrapWeth();
  console.log(unwrapWeth);

  if (token === 'native' && unwrapWeth) {
    console.log('wrap and send with relay', nativeTokenBN, recipientChainId, recipientAddress, 0, amountBN)
    // sending native ETH
    const v = await relayer.wrapAndTransferEthWithRelay(
      nativeTokenBN,
      recipientChainId,
      recipientAddress,
      0, // opt out of batching
      {
        // ...(overrides || {}), // TODO: fix overrides/gas limit here
        gasLimit: 250000,
        value: amountBN,
      },
    );
    return await v.wait();
  } else {
    const tokenAddr = (token as TokenId).address;
    if (!tokenAddr) throw new Error('no token address found');
    console.log('send with relay', tokenAddr, amountBN, nativeTokenBN, recipientChainId, recipientAddress)
    // sending ERC-20
    //approve and send
    const EthContext: any = context.getContext('ethereum');
    await EthContext.approve(token as TokenId, amountBN);
    const tx = await relayer.transferTokensWithRelay(
      tokenAddr,
      amountBN,
      nativeTokenBN,
      recipientChainId,
      recipientAddress,
      0, // opt out of batching
      overrides,
    );
    return await tx.wait();
  }
}
