import { getSignedVAA, parseTokenTransferVaa } from '@certusone/wormhole-sdk';
import { Implementation__factory } from '@certusone/wormhole-sdk/lib/esm/ethers-contracts';
import { utils, providers, BigNumberish } from 'ethers';
import axios from 'axios';
import { ChainId, ChainName } from '@wormhole-foundation/wormhole-connect-sdk';

import config from 'config';
import {
  ParsedMessage,
  ParsedRelayerMessage,
  getCurrentBlock,
  isEvmChain,
} from './sdk';

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

export const NO_VAA_FOUND = 'No message publish found in logs';
export async function getUnsignedVaaEvm(
  chain: ChainId | ChainName,
  receipt: providers.TransactionReceipt,
): Promise<{
  emitterAddress: string;
  sequence: BigNumberish;
  payload: string;
}> {
  const bridgeLog = await getWormholeLogEvm(chain, receipt);
  const parsed = Implementation__factory.createInterface().parseLog(bridgeLog);
  return {
    emitterAddress: parsed.args.sender,
    sequence: parsed.args.sequence,
    payload: parsed.args.payload.toString('hex'),
  };
}

export async function getWormholeLogEvm(
  chain: ChainId | ChainName,
  receipt: providers.TransactionReceipt,
): Promise<providers.Log> {
  if (!isEvmChain(chain)) {
    throw new Error('Not an evm chain');
  }
  const core = config.wh.getContracts(chain)?.core;
  const bridgeLogs = receipt.logs.filter((l: any) => {
    return l.address === core;
  });
  if (bridgeLogs.length === 0) {
    throw new Error(NO_VAA_FOUND);
  }
  return bridgeLogs[0];
}

export function getEmitterAndSequence(
  txData: ParsedMessage | ParsedRelayerMessage,
): MessageIdentifier {
  const emitterChain = config.chains[txData.fromChain];
  if (!emitterChain || !emitterChain.id) {
    throw new Error('invalid emitter chain');
  }
  if (!txData.emitterAddress) throw Error('No vaa emitter address');
  if (!txData.sequence) throw Error('No vaa sequence');
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
  bytesOnly: true,
): Promise<Uint8Array | undefined>;

export async function fetchVaa(
  txData: ParsedMessage | ParsedRelayerMessage,
  bytesOnly?: false,
): Promise<ParsedVaa | undefined>;

export async function fetchVaa(
  txData: ParsedMessage | ParsedRelayerMessage,
  bytesOnly = false,
): Promise<ParsedVaa | Uint8Array | undefined> {
  try {
    const vaa = await fetchVaaWormscan(txData, bytesOnly);

    if (vaa === undefined) {
      console.warn('VAA not found in Wormscan');
    }
    return vaa;
  } catch (e) {
    console.error(
      'Error fetching VAA from wormscan. Falling back to guardian.',
      e,
    );
    return await fetchVaaGuardian(txData, bytesOnly);
  }
}

export async function fetchVaaWormscan(
  txData: ParsedMessage | ParsedRelayerMessage,
  bytesOnly: boolean,
): Promise<ParsedVaa | Uint8Array | undefined> {
  // return if the number of block confirmations hasn't been met
  const chainName = config.wh.toChainName(txData.fromChain);
  const { finalityThreshold } = config.chains[chainName]! as any;
  if (finalityThreshold > 0) {
    const currentBlock = await getCurrentBlock(txData.fromChain);
    if (currentBlock < txData.block + finalityThreshold) return;
  }

  const messageId = getEmitterAndSequence(txData);
  const { emitterChain, emitterAddress, sequence } = messageId;
  const url = `${config.wormholeApi}api/v1/vaas/${emitterChain}/${emitterAddress}/${sequence}`;

  return axios
    .get(url)
    .then(function (response: any) {
      if (!response.data.data) return;
      const data = response.data.data;
      const vaa = utils.base64.decode(data.vaa);
      if (bytesOnly) return vaa;
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
      if (error.response?.status === 404) {
        return undefined;
      } else {
        throw error;
      }
    });
}

export async function fetchVaaGuardian(
  txData: ParsedMessage | ParsedRelayerMessage,
  bytesOnly: boolean,
): Promise<ParsedVaa | Uint8Array | undefined> {
  // return if the number of block confirmations hasn't been met
  const chainName = config.wh.toChainName(txData.fromChain);
  const { finalityThreshold } = config.chains[chainName]! as any;
  if (finalityThreshold > 0) {
    const currentBlock = await getCurrentBlock(txData.fromChain);
    if (currentBlock < txData.block + finalityThreshold) return;
  }

  const messageId = getEmitterAndSequence(txData);
  const { emitterChain, emitterAddress, sequence } = messageId;

  // round-robin through the RPC hosts
  let vaa: Uint8Array | undefined;
  for (const host of config.wormholeRpcHosts) {
    try {
      const { vaaBytes } = await getSignedVAA(
        host,
        emitterChain,
        emitterAddress,
        sequence,
      );
      vaa = vaaBytes;
      break;
    } catch (e) {
      console.warn(`Failed to fetch VAA from ${host}: ${e}`);
    }
  }
  if (!vaa) {
    throw new Error('Failed to fetch VAA from all hosts');
  }
  if (bytesOnly) {
    return vaa;
  }

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
    txHash: txData.sendTx,
  };

  return vaaData;
}

export const fetchIsVAAEnqueued = async (
  txData: ParsedMessage | ParsedRelayerMessage,
): Promise<boolean> => {
  const messageId = getEmitterAndSequence(txData);
  const { emitterChain, emitterAddress, sequence } = messageId;

  const url = `${config.wormholeApi}v1/governor/is_vaa_enqueued/${emitterChain}/${emitterAddress}/${sequence}`;

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

  const url = `${config.wormholeApi}api/v1/global-tx/${emitterChain}/${emitterAddress}/${sequence}`;
  return axios
    .get(url)
    .then(function (response: any) {
      const data = response.data;
      if (!data || !data.destinationTx?.txHash) return undefined;
      return data.destinationTx.txHash;
    })
    .catch(function (error) {
      throw error;
    });
};
