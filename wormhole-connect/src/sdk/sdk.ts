import {
  Network as Environment,
} from '@certusone/wormhole-sdk';
import { BigNumber, utils, ContractReceipt } from 'ethers';
import {
  WormholeContext,
  TokenId,
  ChainId,
  ChainName,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { Transaction } from '@solana/web3.js';

import { PaymentOption } from '../store/transfer';
import { getTokenDecimals, getWrappedTokenId } from '../utils';
import { TOKENS } from './config';
import { signSolanaTransaction } from 'utils/wallet';

const { REACT_APP_ENV } = process.env;

export const wh = new WormholeContext(REACT_APP_ENV! as Environment);

export interface ParsedMessage {
  sendTx: string;
  sender: string;
  amount: string;
  payloadID: number;
  recipient: string;
  toChain: ChainName;
  fromChain: ChainName;
  tokenAddress: string;
  tokenChain: ChainName;
  tokenSymbol: string;
  tokenDecimals: number;
  payload?: string;
}

export interface ParsedRelayerMessage extends ParsedMessage {
  relayerPayloadId: number;
  to: string;
  relayerFee: string;
  toNativeTokenAmount: string;
}

export const registerSigner = (chain: ChainName | ChainId, signer: any) => {
  console.log(`registering signer for ${chain}:`, signer);
  wh.registerSigner(chain, signer);
};

export const getForeignAsset = async (
  tokenId: TokenId,
  chain: ChainName | ChainId,
): Promise<string> => {
  return await wh.getForeignAsset(tokenId, chain);
};

export const getBalance = async (
  walletAddr: string,
  tokenId: TokenId,
  chain: ChainName | ChainId,
): Promise<BigNumber | null> => {
  return await wh.getTokenBalance(walletAddr, tokenId, chain);
};

export const getNativeBalance = async (
  walletAddr: string,
  chain: ChainName | ChainId,
): Promise<BigNumber> => {
  return await wh.getNativeBalance(walletAddr, chain);
};

export const parseMessageFromTx = async (
  tx: string,
  chain: ChainName | ChainId,
) => {
  const EthContext: any = wh.getContext(chain);
  const parsed = (await EthContext.parseMessageFromTx(tx, chain))[0];
  const token = await fetchTokenDetails({
    address: parsed.tokenAddress,
    chain: parsed.tokenChain,
  }, parsed.fromChain);

  const base = {
    sendTx: parsed.sendTx,
    sender: parsed.sender,
    amount: parsed.amount.toString(),
    payloadID: parsed.payloadID,
    recipient: parsed.recipient,
    toChain: parsed.toChain,
    fromChain: parsed.fromChain,
    tokenSymbol: token.symbol,
    tokenDecimals: token.decimals,
    tokenAddress: parsed.tokenAddress,
    tokenChain: parsed.tokenChain,
    sequence: parsed.sequence.toString(),
  };
  if (parsed.payloadID === PaymentOption.MANUAL) {
    return base;
  }
  return {
    ...base,
    relayerPayloadId: parsed.relayerPayloadId,
    to: parsed.to,
    relayerFee: parsed.relayerFee.toString(),
    toNativeTokenAmount: parsed.toNativeTokenAmount.toString(),
  };
};

export const getRelayerFee = async (
  sourceChain: ChainName | ChainId,
  destChain: ChainName | ChainId,
  token: string,
) => {
  const EthContext: any = wh.getContext(destChain);
  const tokenConfig = TOKENS[token];
  if (!tokenConfig) throw new Error('could not get token config');
  const tokenId = tokenConfig.tokenId || getWrappedTokenId(tokenConfig);
  return await EthContext.getRelayerFee(sourceChain, destChain, tokenId);
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
  const fromChainName = wh.toChainName(fromNetwork);
  const decimals = getTokenDecimals(fromChainName, token);
  const parsedAmt = utils.parseUnits(amount, decimals);
  if (paymentOption === PaymentOption.MANUAL) {
    console.log('send with manual');
    const receipt = await wh.send(
      token,
      parsedAmt.toString(),
      fromNetwork,
      fromAddress,
      toNetwork,
      toAddress,
      undefined,
    );
    await signSolanaTransaction(receipt as Transaction);
    return receipt;
  } else {
    console.log('send with relay');
    const parsedNativeAmt = toNativeToken
      ? utils.parseUnits(toNativeToken, decimals).toString()
      : '0';
    const receipt = await wh.sendWithRelay(
      token,
      parsedAmt.toString(),
      fromNetwork,
      fromAddress,
      toNetwork,
      toAddress,
      parsedNativeAmt,
    );
    return receipt;
  }
};

export const calculateMaxSwapAmount = async (
  destChain: ChainName | ChainId,
  token: TokenId,
) => {
  const EthContext: any = wh.getContext(destChain);
  return await EthContext.calculateMaxSwapAmount(destChain, token);
};

export const calculateNativeTokenAmt = async (
  destChain: ChainName | ChainId,
  token: TokenId,
  amount: BigNumber,
) => {
  const EthContext: any = wh.getContext(destChain);
  return await EthContext.calculateNativeTokenAmt(destChain, token, amount);
};

export const claimTransfer = async (
  destChain: ChainName | ChainId,
  vaa: Uint8Array,
): Promise<ContractReceipt> => {
  // const EthContext: any = wh.getContext(destChain);
  return await wh.redeem(destChain, vaa, { gasLimit: 250000 });
};

export const fetchTokenDetails = async (tokenId: TokenId, chain: ChainName | ChainId) => {
  return await wh.fetchTokenDetails(tokenId, chain);
};

export const getTransferComplete = async (
  destChain: ChainName | ChainId,
  signedVaaHash: string,
): Promise<boolean> => {
  const EthContext: any = wh.getContext(destChain);
  return await EthContext.isTransferCompleted(destChain, signedVaaHash);
};
