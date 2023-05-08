import {
  parseTokenTransferVaa,
  getGovernorIsVAAEnqueued,
} from '@certusone/wormhole-sdk';
import { ChainId } from '@wormhole-foundation/wormhole-connect-sdk';
import axios from 'axios';

import { utils } from 'ethers';
import { CHAINS, WH_CONFIG, WORMHOLE_API } from '../config';
import { ParsedMessage, ParsedRelayerMessage } from '../sdk';

export const WORMHOLE_RPC_HOSTS =
  WH_CONFIG.env === 'MAINNET'
    ? [
        'https://wormhole-v2-mainnet-api.certus.one',
        'https://wormhole.inotel.ro',
        'https://wormhole-v2-mainnet-api.mcf.rocks',
        'https://wormhole-v2-mainnet-api.chainlayer.network',
        'https://wormhole-v2-mainnet-api.staking.fund',
        'https://wormhole-v2-mainnet.01node.com',
      ]
    : WH_CONFIG.env === 'TESTNET'
    ? ['https://wormhole-v2-testnet-api.certus.one']
    : ['http://localhost:7071'];

export type ParsedVaa = {
  bytes: string;
  hash: string;
  amount: string;
  emitterAddress: string;
  emitterChain: ChainId;
  fee: string | null;
  fromAddress: string | undefined;
  guardianSignatures: number;
  sequence: string;
  timestamp: number;
  toAddress: string;
  toChain: ChainId;
  tokenAddress: string;
  tokenChain: ChainId;
  txHash: string;
};

export type MessageIdentifier = {
  emitterChain: ChainId;
  emitterAddress: string;
  sequence: string;
};

export function getEmitterAndSequence(
  txData: ParsedMessage | ParsedRelayerMessage,
): MessageIdentifier {
  const emitterChain = CHAINS[txData.fromChain];
  if (!emitterChain || !emitterChain.id) {
    throw new Error('invalid emitter chain');
  }
  const emitterAddress = txData.emitterAddress.startsWith('0x')
    ? txData.emitterAddress.slice(2)
    : txData.emitterAddress;
  return {
    emitterChain: emitterChain.id,
    emitterAddress,
    sequence: txData.sequence,
  };
}

export async function fetchVaa(
  txData: ParsedMessage | ParsedRelayerMessage,
): Promise<ParsedVaa | undefined> {
  const messageId = getEmitterAndSequence(txData);
  const { emitterChain, emitterAddress, sequence } = messageId;
  const url = `${WORMHOLE_API}api/v1/vaas/${emitterChain}/${emitterAddress}/${sequence}`;

  return axios
    .get(url)
    .then(function (response: any) {
      if (!response.data.data) return;
      const data = response.data.data;
      const vaa = utils.base64.decode(data.vaa);
      const parsed = parseTokenTransferVaa(vaa);

      const vaaData: ParsedVaa = {
        bytes: utils.hexlify(vaa),
        hash: utils.hexlify(parsed.hash),
        amount: parsed.amount.toString(),
        emitterAddress: utils.hexlify(parsed.emitterAddress),
        emitterChain: parsed.emitterChain as ChainId,
        fee: parsed.fee ? parsed.fee.toString() : null,
        fromAddress: parsed.fromAddress
          ? utils.hexlify(parsed.fromAddress)
          : undefined,
        guardianSignatures: parsed.guardianSignatures.length,
        sequence: parsed.sequence.toString(),
        timestamp: parsed.timestamp,
        toAddress: utils.hexlify(parsed.to),
        toChain: parsed.toChain as ChainId,
        tokenAddress: utils.hexlify(parsed.tokenAddress),
        tokenChain: parsed.tokenChain as ChainId,
        txHash: `0x${data.txHash}`,
      };
      return vaaData;
    })
    .catch(function (error) {
      if (error.code === 'ERR_BAD_REQUEST') {
        return undefined;
      } else {
        throw error;
      }
    });
}

export const fetchIsVAAEnqueued = async (
  txData: ParsedMessage | ParsedRelayerMessage,
): Promise<boolean> => {
  console.log('fetch');
  const retryAttempts = 10;
  const messageId = getEmitterAndSequence(txData);
  const { emitterChain, emitterAddress, sequence } = messageId;

  let currentWormholeRpcHost = -1;
  const getNextRpcHost = () =>
    ++currentWormholeRpcHost % WORMHOLE_RPC_HOSTS.length;
  let attempts = 0;
  while (true) {
    attempts++;
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const rpcHost = WORMHOLE_RPC_HOSTS[getNextRpcHost()];
    const res = await getGovernorIsVAAEnqueued(
      rpcHost,
      emitterChain,
      emitterAddress,
      sequence,
    );
    if (res) return res.isEnqueued;
    if (attempts > retryAttempts) {
      throw new Error('out of retries');
    }
  }
};
