import { BigNumber, BytesLike } from 'ethers';
import axios, { AxiosResponse } from 'axios';
import { ChainId, ChainName } from '@wormhole-foundation/wormhole-connect-sdk';

import { TOKENS_ARR, isMainnet } from 'config';
import { wh, sleep } from 'utils';

export const CCTPTokenSymbol = 'USDC';
export const CCTPManual_CHAINS: ChainName[] = [
  'ethereum',
  'avalanche',
  'fuji',
  'goerli',
  'optimism',
  'arbitrum',
  'optimismgoerli',
  'arbitrumgoerli',
];
export const CCTP_LOG_TokenMessenger_DepositForBurn =
  '0x2fa9ca894982930190727e75500a97d8dc500233a5065e0f3126c48fbe0343c0';
export const CCTP_LOG_MessageSent =
  '0x8c5261668696ce22758910d05bab8f186d6eb247ceac2af2e82c7dc17669b036';

export function getForeignUSDCAddress(chain: ChainName | ChainId) {
  const usdcToken = TOKENS_ARR.find(
    (t) =>
      t.symbol === CCTPTokenSymbol &&
      t.nativeChain === wh.toChainName(chain) &&
      t.tokenId?.chain === wh.toChainName(chain),
  );
  if (!usdcToken) {
    throw new Error('No foreign native USDC address');
  }
  return usdcToken.tokenId?.address;
}

export const CIRCLE_ATTESTATION = isMainnet
  ? 'https://iris-api.circle.com/attestations/'
  : 'https://iris-api-sandbox.circle.com/attestations/';

export async function getCircleAttestation(messageHash: BytesLike) {
  while (true) {
    // get the post
    const response = await tryGetCircleAttestation(messageHash);

    if (response) {
      return response;
    }

    await sleep(6500);
  }
}

export async function tryGetCircleAttestation(
  messageHash: BytesLike,
): Promise<string | undefined> {
  return await axios
    .get(`${CIRCLE_ATTESTATION}${messageHash}`)
    .catch((reason) => {
      return undefined;
    })
    .then(async (response: AxiosResponse | undefined) => {
      if (
        response &&
        response.status === 200 &&
        response.data.status === 'complete'
      ) {
        return response.data.attestation as string;
      }

      return undefined;
    });
}

export function getChainNameCCTP(domain: number): ChainName {
  switch (domain) {
    case 0:
      return isMainnet ? 'ethereum' : 'goerli';
    case 1:
      return isMainnet ? 'avalanche' : 'fuji';
    case 2:
      return isMainnet ? 'optimism' : 'optimismgoerli';
    case 3:
      return isMainnet ? 'arbitrum' : 'arbitrumgoerli';
  }
  throw new Error('Invalid CCTP domain');
}

export function getNonce(message: string): number {
  return BigNumber.from('0x' + message.substring(26, 42)).toNumber();
}
