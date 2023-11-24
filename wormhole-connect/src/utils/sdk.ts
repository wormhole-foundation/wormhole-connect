import { Network as Environment, isEVMChain } from '@certusone/wormhole-sdk';
import { BigNumber } from 'ethers';
import {
  ChainId,
  ChainName,
  ForeignAssetCache,
  MAINNET_CHAINS,
  SolanaContext,
  TokenId,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { getWrappedTokenId } from '.';
import { ENV, RPCS, TOKENS, sdkConfig } from 'config';

export enum PayloadType {
  Manual = 1,
  Automatic = 3,
}

// pre-populate foreign asset cache
const foreignAssetCache = new ForeignAssetCache();
for (const { tokenId, foreignAssets } of Object.values(TOKENS)) {
  if (tokenId && foreignAssets) {
    for (const [foreignChain, { address }] of Object.entries(foreignAssets)) {
      foreignAssetCache.set(
        tokenId.chain,
        tokenId.address,
        foreignChain as ChainName,
        address,
      );
    }
  }
}

export const wh: WormholeContext = new WormholeContext(
  ENV as Environment,
  {
    ...sdkConfig,
    ...{ rpcs: RPCS },
  },
  foreignAssetCache,
);

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
  return wh.getContext(MAINNET_CHAINS.solana) as SolanaContext<WormholeContext>;
};

export const formatAddress = (chain: ChainName | ChainId, address: string) => {
  const context = wh.getContext(chain);
  return context.formatAddress(address);
};

export const formatAssetAddress = (
  chain: ChainName | ChainId,
  address: string,
) => {
  const context = wh.getContext(chain);
  return context.formatAssetAddress(address);
};

export const parseAddress = (chain: ChainName | ChainId, address: string) => {
  const context = wh.getContext(chain);
  return context.parseAddress(address);
};

export const getRelayerFee = async (
  sourceChain: ChainName | ChainId,
  destChain: ChainName | ChainId,
  token: string,
) => {
  const context: any = wh.getContext(sourceChain);
  const tokenConfig = TOKENS[token];
  if (!tokenConfig) throw new Error('could not get token config');
  const tokenId = tokenConfig.tokenId || getWrappedTokenId(tokenConfig);
  return await context.getRelayerFee(sourceChain, destChain, tokenId);
};

export const calculateMaxSwapAmount = async (
  destChain: ChainName | ChainId,
  token: TokenId,
  walletAddress: string,
) => {
  const contracts = wh.getContracts(destChain);
  if (!contracts?.relayer) return;
  const context: any = wh.getContext(destChain);
  return await context.calculateMaxSwapAmount(destChain, token, walletAddress);
};

export const calculateNativeTokenAmt = async (
  destChain: ChainName | ChainId,
  token: TokenId,
  amount: BigNumber,
  walletAddress: string,
) => {
  const context: any = wh.getContext(destChain);
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
  const chainId = wh.toChainId(chain);
  const context: any = wh.getContext(chain);
  return context.getCurrentBlock(chainId);
};

export const isAcceptedToken = async (tokenId: TokenId): Promise<boolean> => {
  const context: any = wh.getContext(tokenId.chain);
  const relayer = context.contracts.getTokenBridgeRelayer(tokenId.chain);
  if (!relayer) return false;
  const accepted = await relayer
    .isAcceptedToken(tokenId.address)
    .catch(() => false);
  return accepted;
};

export const isEvmChain = (chain: ChainName | ChainId) => {
  return isEVMChain(wh.toChainId(chain));
};

export const toChainId = (chain: ChainName | ChainId) => {
  return wh.toChainId(chain);
};

export const toChainName = (chain: ChainName | ChainId) => {
  return wh.toChainName(chain);
};

export const getMessage = (tx: string, chain: ChainName | ChainId) => {
  const context = wh.getContext(chain);
  return context.getMessage(tx, chain, false);
};
