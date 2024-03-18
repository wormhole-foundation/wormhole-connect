import axios, { AxiosResponse } from 'axios';
import config from 'config';
import { BytesLike } from 'ethers';
import { sleep } from 'utils';

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
  const CIRCLE_ATTESTATION = config.isMainnet
    ? 'https://iris-api.circle.com/attestations/'
    : 'https://iris-api-sandbox.circle.com/attestations/';

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
