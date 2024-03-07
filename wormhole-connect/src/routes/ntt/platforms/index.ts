import { ChainName, ChainId } from '@wormhole-foundation/wormhole-connect-sdk';
import { isEvmChain, wh } from 'utils/sdk';
import { NttManagerEvm } from './evm';
import { NttManagerSolana } from './solana';
import { WormholeTransceiver } from './evm';
// import { NttQuoter } from './solana/nttQuoter';

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

export const isRelayingEnabled = async (
  chain: ChainName | ChainId,
  address: string,
  destChain: ChainName | ChainId,
) => {
  if (isEvmChain(chain)) {
    const transceiver = new WormholeTransceiver(chain, address);
    return await Promise.all([
      transceiver.isWormholeRelayingEnabled(destChain),
      transceiver.isSpecialRelayingEnabled(destChain),
    ]).then((results) => results.some((r) => r));
  }
  if (wh.toChainName(chain) === 'solana') {
    // const quoter = new NttQuoter(address);
    // return await quoter.isRelayingEnabled(destChain);
  }
  throw new Error(`Unsupported chain: ${chain}`);
};
