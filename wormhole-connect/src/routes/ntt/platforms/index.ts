import { ChainName, ChainId } from '@wormhole-foundation/wormhole-connect-sdk';
import { isEvmChain, wh } from 'utils/sdk';
import { NttManagerEvm } from './evm';
import { NttManagerSolana } from './solana';
import { WormholeTransceiverEvm } from './evm';

export const getManager = (
  chain: ChainName | ChainId,
  managerAddress: string,
) => {
  if (isEvmChain(chain)) {
    return new NttManagerEvm(chain, managerAddress);
  }
  if (wh.toChainName(chain) === 'solana') {
    return new NttManagerSolana(managerAddress);
  }
  throw new Error(`Unsupported chain: ${chain}`);
};

export const getWormholeEndpoint = (
  chain: ChainName | ChainId,
  endpointAddress: string,
) => {
  if (isEvmChain(chain)) {
    return new WormholeTransceiverEvm(chain, endpointAddress);
  }
  if (wh.toChainName(chain) === 'solana') {
    // NOTE: The Solana contract has the WormholeEndpoint baked in
    // This will need to change if it's moved into a separate contract
    return new NttManagerSolana(endpointAddress);
  }
  throw new Error(`Unsupported chain: ${chain}`);
};
