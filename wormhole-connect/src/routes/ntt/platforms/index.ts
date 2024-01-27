import { isEvmChain, wh } from 'utils/sdk';
import { ChainName, ChainId } from '@wormhole-foundation/wormhole-connect-sdk';
import { NTTEvm } from './evm';
import { NTTSolana } from './solana';

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
