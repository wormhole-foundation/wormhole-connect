import { Contract, ethers } from 'ethers';
import { ChainId } from '@certusone/wormhole-sdk';

const ABI = [
  'event Redeemed(uint16 indexed emitterChainId, bytes32 indexed emitterAddress, uint64 indexed sequence)',
];

const fetchRedeemedEvent = async (
  provider: ethers.providers.Provider,
  contractAddress: string,
  emitterChainId: ChainId,
  emitterAddress: string,
  sequence: string,
) => {
  const contract = new Contract(contractAddress, ABI, provider);
  const eventFilter = await contract.filters.Redeemed(
    emitterChainId,
    `0x${emitterAddress}`,
    sequence,
  );
  const currentBlock = await provider.getBlockNumber();
  const events = await contract.queryFilter(eventFilter, currentBlock - 100);
  return events ? events[0] : null;
};

export default fetchRedeemedEvent;
