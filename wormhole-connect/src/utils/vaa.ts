import { getSignedVAA, parseTokenTransferVaa } from '@certusone/wormhole-sdk';
import { Implementation__factory } from '@certusone/wormhole-sdk/lib/esm/ethers-contracts';
import { utils, providers, BigNumberish } from 'ethers';
import axios from 'axios';
import { ChainId, ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { repairVaa as sdkRepairVaa } from '@certusone/wormhole-sdk/lib/esm/utils/repairVaa';

import config from 'config';
import {
  ParsedMessage,
  ParsedRelayerMessage,
  getCurrentBlock,
  isEvmChain,
} from './sdk';

export type ParsedVaa = {
  guardianSetIndex: number;
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

interface GuardianSetData {
  index: number;
  keys: string[];
  expiry: number;
}

const GUARDIAN_SETS: { [key: string]: GuardianSetData } = {
  // From VAA https://wormholescan.io/#/tx/1/0000000000000000000000000000000000000000000000000000000000000004/18252082506122526004
  mainnet: {
    index: 4,
    keys: [
      '0x5893b5a76c3f739645648885bdccc06cd70a3cd3',
      '0xff6cb952589bde862c25ef4392132fb9d4a42157',
      '0x114de8460193bdf3a2fcf81f86a09765f4762fd1',
      '0x107a0086b32d7a0977926a205131d8731d39cbeb',
      '0x8c82b2fd82faed2711d59af0f2499d16e726f6b2',
      '0x11b39756c042441be6d8650b69b54ebe715e2343',
      '0x54ce5b4d348fb74b958e8966e2ec3dbd4958a7cd',
      '0x15e7caf07c4e3dc8e7c469f92c8cd88fb8005a20',
      '0x74a3bf913953d695260d88bc1aa25a4eee363ef0',
      '0x000ac0076727b35fbea2dac28fee5ccb0fea768e',
      '0xaf45ced136b9d9e24903464ae889f5c8a723fc14',
      '0xf93124b7c738843cbb89e864c862c38cddcccf95',
      '0xd2cc37a4dc036a8d232b48f62cdd4731412f4890',
      '0xda798f6896a3331f64b48c12d1d57fd9cbe70811',
      '0x71aa1be1d36cafe3867910f99c09e347899c19c3',
      '0x8192b6e7387ccd768277c17dab1b7a5027c0b3cf',
      '0x178e21ad2e77ae06711549cfbb1f9c7a9d8096e8',
      '0x5e1487f35515d02a92753504a8d75471b9f49edb',
      '0x6fbebc898f403e4773e95feb15e80c9a99c8348d',
    ],
    expiry: 0,
  },
  testnet: {
    index: 0,
    keys: ['0x13947Bd48b18E53fdAeEe77F3473391aC727C638'],
    expiry: 0,
  },
};

type HomogeneousFunction<T, Args extends any[]> = (
  ...args: Args
) => T | undefined;

// Create an executor that uses homogeneous function types and handles arbitrary arguments
const createCustomExecutor =
  <T, Args extends any[]>(
    ...funcs: Array<HomogeneousFunction<T, Args>>
  ): ((...args: Args) => Promise<T | undefined>) =>
  async (...args: Args): Promise<T | undefined> => {
    for (let i = 0; i < funcs.length; i++) {
      const result = await funcs[i](...args);
      if (result !== undefined) {
        return result;
      }
    }
  };

const fetchSignedVaaFromGuardian =
  (host: string) =>
  (emitterChain: ChainId, emitterAddress: string, sequence: string) =>
    getSignedVAA(host, emitterChain, emitterAddress, sequence);

const guardianVaaFetchers = config.wormholeRpcHosts.map((host) =>
  fetchSignedVaaFromGuardian(host),
);

async function fetchVaaBytesFromGuardian(
  txData: ParsedMessage | ParsedRelayerMessage,
): Promise<Uint8Array | undefined> {
  try {
    const messageId = getEmitterAndSequence(txData);
    const { emitterChain, emitterAddress, sequence } = messageId;
    // round-robin through the RPC hosts
    const fetchVaa = createCustomExecutor(...guardianVaaFetchers);
    const result = await fetchVaa(emitterChain, emitterAddress, sequence);
    if (result && result.vaaBytes) {
      return result.vaaBytes;
    }
  } catch (e: any) {
    //on error, log it for debugging
    console.error('Failed to fetch VAA from Guardians', e);
  }
}

async function fetchVaaBytesFromWormholescan(
  txData: ParsedMessage | ParsedRelayerMessage,
): Promise<Uint8Array | undefined> {
  try {
    const messageId = getEmitterAndSequence(txData);
    const { emitterChain, emitterAddress, sequence } = messageId;
    const url = `${config.wormholeApi}api/v1/vaas/${emitterChain}/${emitterAddress}/${sequence}`;
    const response = await axios.get(url);
    if (response.data.data) {
      const data = response.data.data;
      return utils.base64.decode(data.vaa);
    }
  } catch (e: any) {
    //on error, log it for debugging
    console.error('Failed to fetch VAA from Wormholescan', e);
  }
}

type VaaParseInput = {
  vaa: Uint8Array;
  txData: ParsedMessage | ParsedRelayerMessage;
};

function parseVaa({ vaa, txData }: VaaParseInput) {
  const parsed = parseTokenTransferVaa(vaa);
  const vaaData: ParsedVaa = {
    guardianSetIndex: parsed.guardianSetIndex,
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
  // return if the number of block confirmations hasn't been met
  const chainName = config.wh.toChainName(txData.fromChain);
  const { finalityThreshold } = config.chains[chainName]! as any;
  if (finalityThreshold > 0) {
    const currentBlock = await getCurrentBlock(txData.fromChain);
    if (currentBlock < txData.block + finalityThreshold) return;
  }
  try {
    // create an helper function to iterate over each function and return the first non-undefined result
    const fetchVaa = createCustomExecutor(
      fetchVaaBytesFromWormholescan,
      fetchVaaBytesFromGuardian,
    );
    // fetch the VAA bytes from the available sources
    const vaa = await fetchVaa(txData);
    if (vaa) {
      const parsed = parseVaa({ vaa, txData });
      if (parsed.guardianSetIndex === GUARDIAN_SETS[config.network].index) {
        if (bytesOnly) {
          return vaa;
        }
        return parsed;
      } else {
        console.debug(
          `Repairing VAA bytes. VAA ID: ${
            parsed.emitterChain
          }/${parsed.emitterAddress.replaceAll('0x', '')}/${parsed.sequence}`,
        );
        const repaired = sdkRepairVaa(
          parsed.bytes,
          GUARDIAN_SETS[config.network],
        );
        const vaa = Buffer.from(repaired);
        if (bytesOnly) {
          return vaa;
        }
        return parseVaa({ vaa, txData });
      }
    }
  } catch (e: any) {
    console.error('Error fetching VAA', e);
    if (e?.message === 'There are not enough valid signatures to repair.') {
      throw new Error(e.message);
    }
  }
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
