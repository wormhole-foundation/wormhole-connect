import { toChainName } from 'utils/sdk';
import { ChainId, ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { ethers } from 'ethers';
import config from 'config';
import { NttManagerEvm } from './nttManager';

const cache = new Map<string, NttManagerEvm>();

export const getManagerEvm = async (
  chain: ChainName | ChainId,
  address: string,
) => {
  const key = `${address}-${toChainName(chain)}`;
  let manager = cache.get(key);
  if (!manager) {
    manager = new NttManagerEvm(chain, address);
    cache.set(key, manager);
  }
  return manager;
};

export const getVersion = async (
  chain: ChainName | ChainId,
  address: string,
): Promise<string> => {
  const provider = config.wh.mustGetProvider(chain);
  const contract = new ethers.Contract(
    address,
    ['function NTT_MANAGER_VERSION() public view returns (string)'],
    provider,
  );
  try {
    return await contract.NTT_MANAGER_VERSION();
  } catch (e) {
    console.error(
      `Failed to get NTT_MANAGER_VERSION from contract ${address} on chain ${toChainName(
        chain,
      )}`,
    );
    throw e;
  }
};
