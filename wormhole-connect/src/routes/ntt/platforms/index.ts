import { ChainName, ChainId } from '@wormhole-foundation/wormhole-connect-sdk';
import { isEvmChain, toChainName } from 'utils/sdk';
import { NttManagerEvm } from './evm';
import { NttManagerSolana } from './solana';

export const getNttManager = (
  chain: ChainName | ChainId,
  nttManagerAddress: string,
) => {
  if (isEvmChain(chain)) {
    return new NttManagerEvm(chain, nttManagerAddress);
  }
  if (toChainName(chain) === 'solana') {
    return new NttManagerSolana(nttManagerAddress);
  }
  throw new Error(`Unsupported chain: ${chain}`);
};
