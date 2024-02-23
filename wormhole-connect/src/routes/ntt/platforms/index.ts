import { isEvmChain, wh } from 'utils/sdk';
import { ChainName, ChainId } from '@wormhole-foundation/wormhole-connect-sdk';
import { NTTEvm } from './evm';
import { NTTSolana } from './solana';
import { WormholeEndpoint as WormholeEndpointEvm } from './evm';

// TODO: getNttManager?
export const getPlatform = (
  chain: ChainName | ChainId,
  managerAddress: string,
): NTTEvm | NTTSolana => {
  if (isEvmChain(chain)) {
    return new NTTEvm(chain, managerAddress);
  }
  if (wh.toChainName(chain) === 'solana') {
    return new NTTSolana(managerAddress);
  }
  throw new Error(`Unsupported chain: ${chain}`);
};

export const getWormholeEndpoint = (
  chain: ChainName | ChainId,
  endpointAddress: string,
) => {
  if (isEvmChain(chain)) {
    return new WormholeEndpointEvm(chain, endpointAddress);
  }
  if (wh.toChainName(chain) === 'solana') {
    return new NTTSolana(endpointAddress);
  }
  throw new Error(`Unsupported chain: ${chain}`);
};
