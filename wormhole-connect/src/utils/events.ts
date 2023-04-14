import { Contract } from 'ethers';
import { ChainId, ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { wh } from '../sdk';

const ABI = [
  'event TransferRedeemed(uint16 indexed emitterChainId, bytes32 indexed emitterAddress, uint64 indexed sequence)',
];

export const fetchRedeemedEvent = async (
  destChainId: ChainId | ChainName,
  emitterChainId: ChainId,
  emitterAddress: string,
  sequence: string,
) => {
  const provider = wh.mustGetProvider(destChainId);
  const { relayer } = wh.getContracts(destChainId)!;
  if (!relayer) throw new Error('no token bridge contract found');
  const contract = new Contract(relayer, ABI, provider);
  console.log(emitterChainId, emitterAddress, sequence);
  const eventFilter = contract.filters.TransferRedeemed(
    emitterChainId,
    emitterAddress,
    sequence,
  );
  // const currentBlock = await provider.getBlockNumber();
  const events = await contract.queryFilter(eventFilter);
  return events ? events[0] : null;
};
