import { getSignedVAA, parseTokenTransferVaa } from '@certusone/wormhole-sdk';
import { Implementation__factory } from '@certusone/wormhole-sdk/lib/cjs/ethers-contracts';
import { utils, providers, BigNumberish } from 'ethers';
import axios from 'axios';
import { ChainId, ChainName } from '@wormhole-foundation/wormhole-connect-sdk';

import { CHAINS, ENV, WORMHOLE_API } from 'config';
import {
  ParsedMessage,
  ParsedRelayerMessage,
  getCurrentBlock,
  isEvmChain,
  wh,
} from './sdk';

export const WORMHOLE_RPC_HOSTS =
  ENV === 'MAINNET'
    ? [
        'https://wormhole-v2-mainnet-api.certus.one',
        'https://wormhole.inotel.ro',
        'https://wormhole-v2-mainnet-api.mcf.rocks',
        'https://wormhole-v2-mainnet-api.chainlayer.network',
        'https://wormhole-v2-mainnet-api.staking.fund',
        'https://wormhole-v2-mainnet.01node.com',
      ]
    : ENV === 'TESTNET'
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

export const NO_VAA_FOUND = 'No message publish found in logs';
export async function getUnsignedVaaEvm(
  chain: ChainId | ChainName,
  receipt: providers.TransactionReceipt,
): Promise<{
  emitterAddress: string;
  sequence: BigNumberish;
  payload: string;
}> {
  if (!isEvmChain(chain)) {
    throw new Error('Not an evm chain');
  }
  const core = wh.getContracts(chain)?.core;
  const bridgeLogs = receipt.logs.filter((l: any) => {
    return l.address === core;
  });

  if (bridgeLogs.length === 0) {
    throw new Error(NO_VAA_FOUND);
  }

  const parsed = Implementation__factory.createInterface().parseLog(
    bridgeLogs[0],
  );

  return {
    emitterAddress: parsed.args.sender,
    sequence: parsed.args.sequence,
    payload: parsed.args.payload.toString('hex'),
  };
}

export function getEmitterAndSequence(
  txData: ParsedMessage | ParsedRelayerMessage,
): MessageIdentifier {
  const emitterChain = CHAINS[txData.fromChain];
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
): Promise<ParsedVaa | undefined> {
  let vaa = await fetchVaaWormscan(txData);

  if (!vaa) {
    console.warn(
      'Failed to fetch VAA from wormscan. Falling back to guardian.',
    );
    vaa = await fetchVaaGuardian(txData);
  }

  return vaa;
}

export async function fetchVaaWormscan(
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

export async function fetchVaaGuardian(
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

  const { vaaBytes: vaa } = await getSignedVAA(
    WORMHOLE_RPC_HOSTS[0],
    emitterChain,
    emitterAddress,
    sequence,
  );

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

  const url = `${WORMHOLE_API}api/v1/global-tx/${emitterChain}/${emitterAddress}/${sequence}`;
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

export const fetchRelayGlobalTx = async (
  txData: ParsedMessage | ParsedRelayerMessage,
): Promise<string | undefined> => {
  const messageId = getEmitterAndSequence(txData);
  const { emitterChain, emitterAddress, sequence } = messageId;

  const url = `${WORMHOLE_API}api/v1/relays/${emitterChain}/${emitterAddress}/${sequence}`;
  return axios
    .get(url)
    .then(function (response: any) {
      const data = response.data;
      console.log(response.data);
      if (!data || !data.toTxHash) return undefined;
      return data.toTxHash;
    })
    .catch(function (error) {
      throw error;
    });
};
