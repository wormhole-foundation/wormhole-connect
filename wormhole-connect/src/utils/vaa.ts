import { parseTokenTransferVaa } from '@certusone/wormhole-sdk';
import { ChainId } from '@wormhole-foundation/wormhole-connect-sdk';
import axios from 'axios';

import { utils } from 'ethers';
import { CHAINS, WORMHOLE_API } from '../config';
import { ParsedMessage, ParsedRelayerMessage } from '../sdk';

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

export async function fetchVaa(
  txData: ParsedMessage | ParsedRelayerMessage,
): Promise<ParsedVaa | undefined> {
  const emitterChain = CHAINS[txData.fromChain];
  if (!emitterChain || !emitterChain.id) {
    throw new Error('invalid emitter chain');
  }
  const emitterAddress = txData.emitterAddress.startsWith('0x')
    ? txData.emitterAddress.slice(2)
    : txData.emitterAddress;
  const url = `${WORMHOLE_API}api/v1/vaas/${emitterChain.id}/${emitterAddress}/${txData.sequence}`;

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
