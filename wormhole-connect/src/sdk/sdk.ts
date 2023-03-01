import { Network as Environment } from '@certusone/wormhole-sdk';
import { BigNumber, utils, ContractReceipt } from 'ethers';
import {
  WormholeContext,
  WormholeConfig,
  TokenId,
  ChainId,
  ChainName,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { Transaction } from '@solana/web3.js';

import { PaymentOption } from '../store/transfer';
import { getTokenById, getTokenDecimals, getWrappedTokenId } from '../utils';
import { TOKENS } from './config';
import { signSolanaTransaction } from 'utils/wallet';

const { REACT_APP_ENV } = process.env;

// @ts-ignore
const conf: WormholeConfig = WormholeContext.getConfig(
  REACT_APP_ENV! as Environment,
);
const mainnetRpcs = {
  ethereum: process.env.REACT_APP_ETHEREUM_RPC || conf.rpcs.ethereum,
  solana: process.env.REACT_APP_SOLANA_RPC || conf.rpcs.solana,
  polygon: process.env.REACT_APP_POLYGON_RPC || conf.rpcs.polygon,
  bsc: process.env.REACT_APP_BSC_RPC || conf.rpcs.bsc,
  avalanche: process.env.REACT_APP_AVALANCHE_RPC || conf.rpcs.avalanche,
  fantom: process.env.REACT_APP_FANTOM_RPC || conf.rpcs.fantom,
  celo: process.env.REACT_APP_CELO_RPC || conf.rpcs.celo,
};
const testnetRpcs = {
  goerli: process.env.REACT_APP_GOERLI_RPC || conf.rpcs.goerli,
  mumbai: process.env.REACT_APP_MUMBAI_RPC || conf.rpcs.mumbai,
  bsc: process.env.REACT_APP_BSC_TESTNET_RPC || conf.rpcs.bsc,
  fuji: process.env.REACT_APP_FUJI_RPC || conf.rpcs.fuji,
  fantom: process.env.REACT_APP_FANTOM_TESTNET_RPC || conf.rpcs.fantom,
  alfajores: process.env.REACT_APP_ALFAJORES_RPC || conf.rpcs.alfajores,
  solana: process.env.REACT_APP_SOLANA_DEVNET_RPC || conf.rpcs.solana,
};
conf.rpcs = REACT_APP_ENV === 'MAINNET' ? mainnetRpcs : testnetRpcs;

export const wh = new WormholeContext(REACT_APP_ENV! as Environment, conf);

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
  emitterAddress: string;
  sequence: string;
  payload?: string;
  gasFee?: string;
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
  const parsed: any = (await wh.parseMessageFromTx(tx, chain))[0];

  const tokenId = {
    address: parsed.tokenAddress,
    chain: parsed.tokenChain,
  };
  const decimals = await fetchTokenDecimals(tokenId, parsed.fromChain);
  const token = getTokenById(tokenId);

  const base = {
    ...parsed,
    amount: parsed.amount.toString(),
    tokenSymbol: token?.symbol,
    tokenDecimals: decimals,
    sequence: parsed.sequence.toString(),
    gasFee: parsed.gasFee ? parsed.gasFee.toString() : undefined,
  };
  if (parsed.payloadID === PaymentOption.MANUAL) {
    return base;
  }
  return {
    ...base,
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
    const tx = await wh.send(
      token,
      parsedAmt.toString(),
      fromNetwork,
      fromAddress,
      toNetwork,
      toAddress,
      undefined,
    );
    if (fromChainName !== 'solana') {
      return tx;
    }
    return await signSolanaTransaction(tx as Transaction);
  } else {
    console.log('send with relay');
    const parsedNativeAmt = toNativeToken
      ? utils.parseUnits(toNativeToken, decimals).toString()
      : '0';
    const tx = await wh.sendWithRelay(
      token,
      parsedAmt.toString(),
      fromNetwork,
      fromAddress,
      toNetwork,
      toAddress,
      parsedNativeAmt,
    );
    // relay not supported on Solana, so we can just return the ethers receipt
    return tx;
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

export const fetchTokenDecimals = async (
  tokenId: TokenId,
  chain: ChainName | ChainId,
) => {
  return await wh.fetchTokenDecimals(tokenId, chain);
};

export const getTransferComplete = async (
  destChain: ChainName | ChainId,
  signedVaaHash: string,
): Promise<boolean> => {
  const EthContext: any = wh.getContext(destChain);
  return await EthContext.isTransferCompleted(destChain, signedVaaHash);
};

export const getTxIdFromReceipt = (
  sourceChain: ChainName | ChainId,
  receipt: any,
): string => {
  return wh.getTxIdFromReceipt(sourceChain, receipt);
};

export const getCurrentBlock = async (
  chain: ChainName | ChainId,
): Promise<number> => {
  const chainName = wh.resolveDomainName(chain);
  const context: any = wh.getContext(chain);
  if (chainName === 'solana') {
    const connection = context.connection;
    if (!connection) throw new Error('no connection');
    return await connection.getBlockHeight();
  } else {
    const provider = wh.mustGetProvider(chain);
    return await provider.getBlockNumber();
  }
};
