import { parseTokenTransferVaa } from '@certusone/wormhole-sdk';
import { ChainId } from '@wormhole-foundation/wormhole-connect-sdk';
import axios from 'axios';

import { utils } from 'ethers';
import { CHAINS, WH_CONFIG, WORMHOLE_API, isMainnet } from '../config';
import {
  ParsedMessage,
  ParsedRelayerMessage,
  getCurrentBlock,
  wh,
} from '../sdk';

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
const WORMHOLE_STAGING_API = isMainnet
  ? 'https://api.staging.wormscan.io/'
  : 'https://api.testnet.wormscan.io/';

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
  // return if the number of block confirmations hasn't been met
  const chainName = wh.toChainName(txData.fromChain);
  const { finalityThreshold } = CHAINS[chainName]! as any;
  if (finalityThreshold > 0) {
    const currentBlock = await getCurrentBlock(txData.fromChain);
    if (currentBlock < txData.block + finalityThreshold) return;
  }

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
  const messageId = getEmitterAndSequence(txData);
  const { emitterChain, emitterAddress, sequence } = messageId;

  const url = `${WORMHOLE_API}v1/governor/is_vaa_enqueued/${emitterChain}/${emitterAddress}/${sequence}`;

  return axios
    .get(url)
    .then(function (response: any) {
      const data = response.data;
      if (!data) return false;
      return data.isEnqueued;
    })
    .catch(function (error) {
      throw error;
    });
};

export const fetchGlobalTx = async (
  txData: ParsedMessage | ParsedRelayerMessage,
): Promise<string | undefined> => {
  const messageId = getEmitterAndSequence(txData);
  const { emitterChain, emitterAddress, sequence } = messageId;

  const url = `${WORMHOLE_STAGING_API}api/v1/global-tx/${emitterChain}/${emitterAddress}/${sequence}`;

  return axios
    .get(url)
    .then(function (response: any) {
      const data = response.data;
      if (!data || !data.destinationTx?.txHash) return undefined;
      return `0x${data.destinationTx.txHash}`;
    })
    .catch(function (error) {
      throw error;
    });
};
