import { ChainName, ChainId } from '@wormhole-foundation/wormhole-connect-sdk';
import { isEvmChain, wh } from 'utils/sdk';
import { EVMManager } from './evm';
import { SolanaManager } from './solana';
import { WormholeEndpointEVM } from './evm';

export const getManager = (
  chain: ChainName | ChainId,
  managerAddress: string,
) => {
  if (isEvmChain(chain)) {
    return new EVMManager(chain, managerAddress);
  }
  if (wh.toChainName(chain) === 'solana') {
    return new SolanaManager(managerAddress);
  }
  throw new Error(`Unsupported chain: ${chain}`);
};

export const getWormholeEndpoint = (
  chain: ChainName | ChainId,
  endpointAddress: string,
) => {
  if (isEvmChain(chain)) {
    return new WormholeEndpointEVM(chain, endpointAddress);
  }
  if (wh.toChainName(chain) === 'solana') {
    // NOTE: The Solana contract has the WormholeEndpoint baked in
    // This will need to change if it's moved into a separate contract
    return new SolanaManager(endpointAddress);
  }
  throw new Error(`Unsupported chain: ${chain}`);
};
