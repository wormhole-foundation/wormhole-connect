import { parseTokenTransferVaa } from '@certusone/wormhole-sdk';
import { ChainId } from '@wormhole-foundation/wormhole-connect-sdk';
import axios from 'axios';

import { utils } from 'ethers';

export type ParsedVaa = {
  bytes: string;
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

const { REACT_APP_WORMHOLE_API } = process.env;

export async function fetchVaa(txId: string): Promise<ParsedVaa | undefined> {
  const id = txId.startsWith('0x') ? txId.slice(2) : txId;
  const url = `${REACT_APP_WORMHOLE_API}api/v1/vaas/?txHash=${id}`;

  return axios
    .get(url)
    .then(function (response: any) {
      if (!response.data.data) return;
      const data = response.data.data[0];
      const vaa = utils.base64.decode(data.vaa);
      const parsed = parseTokenTransferVaa(vaa);
      console.log(parsed);
      const vaaData: ParsedVaa = {
        bytes: utils.hexlify(vaa),
        amount: parsed.amount.toString(),
        emitterAddress: utils.hexlify(parsed.emitterAddress),
        emitterChain: parsed.emitterChain as ChainId,
        fee: parsed.fee ? parsed.fee.toString() : null,
        // fromAddress: parsed.fromAddress ? utils.hexlify(parsed.fromAddress) : undefined,
        fromAddress: utils.hexlify(parsed.to), // TODO: figure out why fromAddress is sometimes undefined
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
      throw error;
    });
}
