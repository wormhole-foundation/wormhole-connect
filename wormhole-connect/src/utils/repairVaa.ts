import {
  parseVaa,
  keccak256,
  type ParsedVaa,
  type GuardianSignature,
} from '@certusone/wormhole-sdk';
import type { GuardianSetData } from 'config/types';
import { ethers } from 'ethers';

export const INVALID_VAA_MESSAGE = `There are not enough valid signatures to repair.`;

/* self explained I hope, see https://docs.wormhole.com/wormhole/explore-wormhole/vaa#vaa-format */
const SIGNATURE_SIZE_IN_BYTES = 66;

const hex = (x: string): string =>
  ethers.utils.hexlify(x, { allowMissingPrefix: true });

/* self explained I hope */
const compareIgoneCase = (a: string, b: string) =>
  a.toLowerCase() === b.toLowerCase();

/**
 * Convert an given number to a Uint8Array representation
 *
 * @param num number to convert to bytes
 * @param size Uint8Array size
 * @returns an Uint8Array representation of the number with the specified size
 */
const numToBytes = (num: number, size: number): Uint8Array =>
  Buffer.from(num.toString(16).padStart(2 * size, '0'), 'hex');

/**
 *
 * Takes in a hexstring representation of a signed vaa and a guardian set.
 * Attempts to remove invalid guardian signatures, update total remaining
 * valid signatures, and update the guardian set index
 * @throws if not enough valid signatures remain
 * @see https://github.com/wormhole-foundation/wormhole/blob/main/sdk/js/src/utils/repairVaa.ts#L44
 *
 * NOTE: copied since original function does not normalize the public keys
 **/
export function repairVaa(
  vaaBytes: Uint8Array,
  guardianSetData: GuardianSetData,
  parsedVaa: ParsedVaa = parseVaa(vaaBytes),
): Uint8Array {
  const { index: guardianSetIndex, keys: currentGuardianSet } = guardianSetData;
  const minNumSignatures =
    Math.floor((2.0 * currentGuardianSet.length) / 3.0) + 1;
  const {
    guardianSignatures: currentGuardianSignatures,
    hash: vaaHash,
    version,
  } = parsedVaa;
  const digest = keccak256(vaaHash).toString('hex');

  // take each signature, check if valid against hash & current guardian set
  const validSignatures: GuardianSignature[] = currentGuardianSignatures.filter(
    ({ index, signature }) => {
      try {
        const vaaGuardianPublicKey = ethers.utils.recoverAddress(
          hex(digest),
          hex(signature.toString('hex')),
        );
        return compareIgoneCase(
          currentGuardianSet[index],
          vaaGuardianPublicKey,
        );
      } catch (_) {
        /* empty */
      }
    },
  );

  // re-construct vaa with signatures that remain
  const numRepairedSignatures = validSignatures.length;
  if (numRepairedSignatures < minNumSignatures) {
    throw new Error(INVALID_VAA_MESSAGE);
  }

  const repairedSignatures: Uint8Array = validSignatures
    // sort sinatures by ascending index
    .sort((a, b) => a.index - b.index)
    .map(({ signature, index }) =>
      Buffer.concat([numToBytes(index, 1), signature]),
    )
    .reduce((acc, curr) => Buffer.concat([acc, curr]), new Uint8Array());

  const versionBytes = numToBytes(version, 1);
  const guardianSetIndexBytes = numToBytes(guardianSetIndex, 4);
  const numRepairedSignaturesBytes = numToBytes(numRepairedSignatures, 1);
  const vaaHeader = [
    versionBytes,
    guardianSetIndexBytes,
    numRepairedSignaturesBytes,
    repairedSignatures,
  ].reduce((acc, curr) => Buffer.concat([acc, curr]), new Uint8Array());
  const offset =
    versionBytes.length + // 1 byte, using length to avoid magic numbers
    guardianSetIndexBytes.length + // 4 byte, using length to avoid magic numbers
    numRepairedSignaturesBytes.length + // 1 byte, using length to avoid magic numbers
    currentGuardianSignatures.length * SIGNATURE_SIZE_IN_BYTES;
  const vaaBody = vaaBytes.subarray(offset);
  return Buffer.concat([vaaHeader, vaaBody]);
}
