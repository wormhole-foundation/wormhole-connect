import { Network } from '@certusone/wormhole-sdk';

export const getSeiChainId = (env: Network) =>
  env === 'MAINNET' ? 'pacific-1' : 'atlantic-2';
