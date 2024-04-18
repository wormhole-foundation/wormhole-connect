import {
  parseVaa,
  GuardianSignature,
  keccak256,
  hexToUint8Array,
} from '@certusone/wormhole-sdk';
import { ethers } from 'ethers';

function hex(x: string): string {
  return ethers.utils.hexlify(x, { allowMissingPrefix: true });
}

interface GuardianSetData {
  index: number;
  keys: string[];
  expiry: number;
}

export const INVALID_VAA_MESSAGE = `There are not enough valid signatures to repair.`;

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
  vaaHex: string,
  guardianSetData: GuardianSetData,
): string {
  const guardianSetIndex = guardianSetData.index;
  const currentGuardianSet = guardianSetData.keys;
  const minNumSignatures =
    Math.floor((2.0 * currentGuardianSet.length) / 3.0) + 1;
  const version = vaaHex.slice(0, 2);
  const parsedVaa = parseVaa(hexToUint8Array(vaaHex));
  const numSignatures = parsedVaa.guardianSignatures.length;
  const digest = keccak256(parsedVaa.hash).toString('hex');

  const validSignatures: GuardianSignature[] = [];

  // take each signature, check if valid against hash & current guardian set
  parsedVaa.guardianSignatures.forEach((signature) => {
    try {
      const vaaGuardianPublicKey = ethers.utils.recoverAddress(
        hex(digest),
        hex(signature.signature.toString('hex')),
      );
      const currentIndex = signature.index;
      const currentGuardianPublicKey = currentGuardianSet[currentIndex];

      if (
        currentGuardianPublicKey.toLowerCase() ===
        vaaGuardianPublicKey.toLowerCase()
      ) {
        validSignatures.push(signature);
      }
    } catch (_) {
      /* empty */
    }
  });

  // re-construct vaa with signatures that remain
  const numRepairedSignatures = validSignatures.length;
  if (numRepairedSignatures < minNumSignatures) {
    throw new Error(INVALID_VAA_MESSAGE);
  }
  const repairedSignatures = validSignatures
    .sort(function (a, b) {
      return a.index - b.index;
    })
    .map((signature) => {
      return `${signature.index
        .toString(16)
        .padStart(2, '0')}${signature.signature.toString('hex')}`;
    })
    .join('');
  const newSignatureBody = `${version}${guardianSetIndex
    .toString(16)
    .padStart(8, '0')}${numRepairedSignatures
    .toString(16)
    .padStart(2, '0')}${repairedSignatures}`;

  const repairedVaa = `${newSignatureBody}${vaaHex.slice(
    12 + numSignatures * 132,
  )}`;
  return repairedVaa;
}
