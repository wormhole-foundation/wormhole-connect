import {
  getSignedVAA,
  parseTokenTransferVaa,
  parseVaa,
} from '@certusone/wormhole-sdk';
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
import { repairVaa } from './repairVaa';

type GuardianSetData = {
  index: number;
  keys: string[];
  expiry: number;
};

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

function getOrRepairVaa(vaa: Uint8Array | string): Uint8Array {
  const bytesVaa = typeof vaa === 'string' ? utils.base64.decode(vaa) : vaa;
  const parsedVaa = parseVaa(bytesVaa);
  if (parsedVaa.guardianSetIndex !== GUARDIAN_SETS[config.network].index) {
    console.debug('Guardian Set mismatch, repairing VAA');
    const hexVaa = repairVaa(
      Buffer.from(bytesVaa).toString('hex'),
      GUARDIAN_SETS[config.network],
    );
    return Buffer.from(hexVaa, 'hex');
  }
  return bytesVaa;
}

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
      const vaa = getOrRepairVaa(data.vaa);
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
      vaa = getOrRepairVaa(vaaBytes);
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
