import { ChainName, ChainId } from '@wormhole-foundation/wormhole-connect-sdk';
import { isEvmChain, toChainName } from 'utils/sdk';
import { getManagerSolana } from './solana/cache';
import { getManagerEvm } from './evm/cache';

export const getNttManager = async (
  chain: ChainName | ChainId,
  nttManagerAddress: string,
) => {
  if (isEvmChain(chain)) {
    return await getManagerEvm(chain, nttManagerAddress);
  }
  if (toChainName(chain) === 'solana') {
    return await getManagerSolana(nttManagerAddress);
  }
  throw new Error(`Unsupported chain: ${chain}`);
};
