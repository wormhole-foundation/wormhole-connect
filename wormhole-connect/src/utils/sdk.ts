import { getWrappedTokenId } from '.';
import config from 'config';
import { Chain, chainToPlatform } from '@wormhole-foundation/sdk';

export enum PayloadType {
  Manual = 1,
  Automatic = 3,
}

export const formatAddress = (chain: Chain, address: string) => {
  const context = config.whLegacy.getContext(chain);
  return context.formatAddress(address);
};

export const formatAssetAddress = (chain: Chain, address: string) => {
  const context = config.whLegacy.getContext(chain);
  return context.formatAssetAddress(address);
};

export const parseAddress = (chain: Chain, address: string) => {
  const context = config.whLegacy.getContext(chain);
  return context.parseAddress(address);
};

export const getRelayerFee = async (
  sourceChain: Chain,
  destChain: Chain,
  token: string,
) => {
  const context: any = config.whLegacy.getContext(sourceChain);
  const tokenConfig = config.tokens[token];
  if (!tokenConfig) throw new Error('could not get token config');
  const tokenId = tokenConfig.tokenId || getWrappedTokenId(tokenConfig);
  return await context.getRelayerFee(sourceChain, destChain, tokenId);
};

export const getCurrentBlock = async (chain: Chain): Promise<number> => {
  const context: any = config.whLegacy.getContext(chain);
  return context.getCurrentBlock(chain);
};

export const isEvmChain = (chain: Chain) => {
  return chainToPlatform.get(chain) === 'Evm';
};

export enum DeliveryStatus {
  WaitingForVAA = 'Waiting for VAA',
  PendingDelivery = 'Pending Delivery',
  DeliverySuccess = 'Delivery Success',
  ReceiverFailure = 'Receiver Failure',
  ThisShouldNeverHappen = 'This should never happen. Contact Support.',
}
