import {
  SignatureUtils,
  VAA,
  WormholeCore,
  encoding,
  keccak256,
  serialize,
} from '@wormhole-foundation/sdk';

export const INVALID_VAA_MESSAGE = `There are not enough valid signatures to repair.`;

export function repairVaaIfNeeded(
  vaa: VAA<'Uint8Array'>,
  guardianSetData: WormholeCore.GuardianSet,
): Uint8Array {
  if (vaa.guardianSet === guardianSetData.index) return serialize(vaa);

  // Rehash the vaa digest since signatures are based on double hash
  const digest = keccak256(vaa.hash);

  // Filter any invalid signatures
  const currentGuardianSet = guardianSetData.keys.map((key) =>
    encoding.hex.decode(key),
  );
  const validSignatures = vaa.signatures.filter((signature) => {
    try {
      return !encoding.bytes.equals(
        currentGuardianSet[signature.guardianIndex]!,
        SignatureUtils.recover(signature.signature, digest),
      );
    } catch (_) {}
    return false;
  });
  console.log(vaa.guardianSet, guardianSetData.index);
  console.log(vaa.signatures.length, validSignatures.length);

  // re-construct vaa with signatures that remain
  const minNumSignatures =
    Math.floor((2.0 * currentGuardianSet.length) / 3.0) + 1;
  if (validSignatures.length < minNumSignatures)
    throw new Error(INVALID_VAA_MESSAGE);

  // @ts-ignore -- readonly
  vaa.signatures = validSignatures;
  // @ts-ignore -- readonly
  vaa.guardianSet = guardianSetData.index;

  return serialize(vaa);
}
