import { ethers_contracts } from '@wormhole-foundation/sdk-evm-core';
import { providers, BigNumberish } from 'ethers';
import axios from 'axios';
import { ChainId, ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import config, { newWormholeContextV2 } from 'config';
import {
  ParsedMessage,
  ParsedRelayerMessage,
  getCurrentBlock,
  isEvmChain,
} from './sdk';
import { repairVaaIfNeeded } from './repairVaa';
import { VAA, Wormhole, deserialize } from '@wormhole-foundation/sdk';

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
  const parsed =
    ethers_contracts.Implementation__factory.createInterface().parseLog(
      bridgeLog,
    );
  if (parsed) {
    return {
      emitterAddress: parsed.args.sender,
      sequence: parsed.args.sequence,
      payload: parsed.args.payload.toString('hex'),
    };
  } else {
    throw new Error('Failed to parse logs in getUnsignedVaaEvm');
  }
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
): Promise<Uint8Array | undefined> {
  try {
    const vaa = await fetchVaaWormscan(txData);

    if (vaa === undefined) {
      console.warn('VAA not found in Wormscan');
    }
    return vaa;
  } catch (e) {
    console.error(
      'Error fetching VAA from wormscan. Falling back to guardian.',
      e,
    );
    return await fetchVaaGuardian(txData);
  }
}

export async function fetchVaaWormscan(
  txData: ParsedMessage | ParsedRelayerMessage,
): Promise<Uint8Array | undefined> {
  // return if the number of block confirmations hasn't been met
  const chainName = config.wh.toChainName(txData.fromChain);
  const { finalityThreshold } = config.chains[chainName]! as any;
  if (finalityThreshold > 0) {
    const currentBlock = await getCurrentBlock(txData.fromChain);
    if (currentBlock < txData.block + finalityThreshold) return;
  }

  const messageId = getEmitterAndSequence(txData);
  const { emitterChain, emitterAddress, sequence } = messageId;

  const wh = await newWormholeContextV2();
  const chain = config.sdkConverter.toChainV2(emitterChain);
  const emitter = Wormhole.parseAddress(
    chain,
    emitterAddress,
  ).toUniversalAddress();

  try {
    let vaa =
      (await wh.getVaaBytes({
        chain,
        emitter,
        sequence: BigInt(sequence),
      })) || undefined;

    if (vaa == undefined) {
      return undefined;
    }

    const vaaDeserialized: VAA<'Uint8Array'> = deserialize('Uint8Array', vaa);
    vaa = repairVaaIfNeeded(vaaDeserialized, {
      ...config.guardianSet,
      expiry: BigInt(0),
    });

    return vaa;
  } catch (error) {
    /* @ts-ignore */
    if (error.response?.status === 404) {
      return undefined;
    } else {
      throw error;
    }
  }
}

export async function fetchVaaGuardian(
  txData: ParsedMessage | ParsedRelayerMessage,
): Promise<Uint8Array | undefined> {
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
      const wh = await newWormholeContextV2();
      wh.config.api = host;
      const chain = config.sdkConverter.toChainV2(emitterChain);
      const emitter = Wormhole.parseAddress(
        chain,
        emitterAddress,
      ).toUniversalAddress();

      vaa =
        (await wh.getVaaBytes({
          chain,
          emitter,
          sequence: BigInt(sequence),
        })) || undefined;

      break;
    } catch (e) {
      console.warn(`Failed to fetch VAA from ${host}: ${e}`);
    }
  }
  if (!vaa) {
    throw new Error('Failed to fetch VAA from all hosts');
  }

  return vaa;
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
