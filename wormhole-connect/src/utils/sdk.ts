import { ChainId, ChainName, TokenId } from 'sdklegacy';
import { getWrappedTokenId } from '.';
import config from 'config';
import { chainToPlatform } from '@wormhole-foundation/sdk';

export enum PayloadType {
  Manual = 1,
  Automatic = 3,
}

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
  return 0;
  /*
  const contracts = config.wh.getContracts(destChain);
  if (!contracts?.relayer) return;
  const context: any = config.wh.getContext(destChain);
  return await context.calculateMaxSwapAmount(destChain, token, walletAddress);
  */
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
  const chainV2 = config.sdkConverter.toChainV2(chain);
  return chainToPlatform.get(chainV2) === 'Evm';
};

export const toChainId = (chain: ChainName | ChainId) => {
  return config.wh.toChainId(chain);
};

export const toChainName = (chain: ChainName | ChainId) => {
  return config.wh.toChainName(chain);
};

export enum DeliveryStatus {
  WaitingForVAA = 'Waiting for VAA',
  PendingDelivery = 'Pending Delivery',
  DeliverySuccess = 'Delivery Success',
  ReceiverFailure = 'Receiver Failure',
  ThisShouldNeverHappen = 'This should never happen. Contact Support.',
}
