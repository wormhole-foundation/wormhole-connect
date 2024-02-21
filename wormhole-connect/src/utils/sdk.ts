import { isEVMChain } from '@certusone/wormhole-sdk';
import { BigNumber } from 'ethers';
import {
  ChainId,
  ChainName,
  MAINNET_CHAINS,
  SolanaContext,
  TokenId,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { getWrappedTokenId } from '.';
import config from 'config';

export enum PayloadType {
  Manual = 1,
  Automatic = 3,
}

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
  tokenId: TokenId;
  tokenKey: string;
  tokenDecimals: number;
  receivedTokenKey: string;
  emitterAddress?: string;
  sequence?: string;
  block: number;
  gasFee?: string;
  payload?: string;
  inputData?: string;
}

export interface ParsedRelayerMessage extends ParsedMessage {
  relayerPayloadId: number;
  to: string;
  relayerFee: string;
  toNativeTokenAmount: string;
}

export const solanaContext = (): SolanaContext<WormholeContext> => {
  return config.wh.getContext(
    MAINNET_CHAINS.solana,
  ) as SolanaContext<WormholeContext>;
};

export const formatAddress = (chain: ChainName | ChainId, address: string) => {
  const context = config.wh.getContext(chain);
  return context.formatAddress(address);
};

export const formatAssetAddress = (
  chain: ChainName | ChainId,
  address: string,
) => {
  const context = config.wh.getContext(chain);
  return context.formatAssetAddress(address);
};

export const parseAddress = (chain: ChainName | ChainId, address: string) => {
  const context = config.wh.getContext(chain);
  return context.parseAddress(address);
};

export const getRelayerFee = async (
  sourceChain: ChainName | ChainId,
  destChain: ChainName | ChainId,
  token: string,
) => {
  const context: any = config.wh.getContext(sourceChain);
  const tokenConfig = config.tokens[token];
  if (!tokenConfig) throw new Error('could not get token config');
  const tokenId = tokenConfig.tokenId || getWrappedTokenId(tokenConfig);
  return await context.getRelayerFee(sourceChain, destChain, tokenId);
};

export const calculateMaxSwapAmount = async (
  destChain: ChainName | ChainId,
  token: TokenId,
  walletAddress: string,
) => {
  const contracts = config.wh.getContracts(destChain);
  if (!contracts?.relayer) return;
  const context: any = config.wh.getContext(destChain);
  return await context.calculateMaxSwapAmount(destChain, token, walletAddress);
};

export const calculateNativeTokenAmt = async (
  destChain: ChainName | ChainId,
  token: TokenId,
  amount: BigNumber,
  walletAddress: string,
) => {
  const context: any = config.wh.getContext(destChain);
  return await context.calculateNativeTokenAmt(
    destChain,
    token,
    amount,
    walletAddress,
  );
};

export const getCurrentBlock = async (
  chain: ChainName | ChainId,
): Promise<number> => {
  const chainId = config.wh.toChainId(chain);
  const context: any = config.wh.getContext(chain);
  return context.getCurrentBlock(chainId);
};

export const isAcceptedToken = async (tokenId: TokenId): Promise<boolean> => {
  const context: any = config.wh.getContext(tokenId.chain);
  const relayer = context.contracts.getTokenBridgeRelayer(tokenId.chain);
  if (!relayer) return false;
  const accepted = await relayer
    .isAcceptedToken(tokenId.address)
    .catch(() => false);
  return accepted;
};

export const isEvmChain = (chain: ChainName | ChainId) => {
  return isEVMChain(config.wh.toChainId(chain));
};

export const toChainId = (chain: ChainName | ChainId) => {
  return config.wh.toChainId(chain);
};

export const toChainName = (chain: ChainName | ChainId) => {
  return config.wh.toChainName(chain);
};

export const getMessage = (tx: string, chain: ChainName | ChainId) => {
  const context = config.wh.getContext(chain);
  return context.getMessage(tx, chain, false);
};
