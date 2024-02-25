import { ChainName, ChainId } from '@wormhole-foundation/wormhole-connect-sdk';
import { isEvmChain, wh } from 'utils/sdk';
import { NttManagerEvm } from './evm';
import { NttManagerSolana } from './solana';
import { WormholeTransceiverEvm } from './evm';

export const getNttManager = (
  chain: ChainName | ChainId,
  nttManagerAddress: string,
) => {
  if (isEvmChain(chain)) {
    return new NttManagerEvm(chain, nttManagerAddress);
  }
  if (wh.toChainName(chain) === 'solana') {
    return new NttManagerSolana(nttManagerAddress);
  }
  throw new Error(`Unsupported chain: ${chain}`);
};

export const getWormholeTransceiver = (
  chain: ChainName | ChainId,
  transceiverAddress: string,
) => {
  if (isEvmChain(chain)) {
    return new WormholeTransceiverEvm(chain, transceiverAddress);
  }
  if (wh.toChainName(chain) === 'solana') {
    // NOTE: The Solana contract has the "WormholeTransceiver" baked in
    return new NttManagerSolana(transceiverAddress);
  }
  throw new Error(`Unsupported chain: ${chain}`);
};
