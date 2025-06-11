import {
  Chain,
  chainToPlatform,
  encoding,
  NativeAddress,
  toNative,
} from '@wormhole-foundation/sdk';
import { isValidSuiAddress } from '@mysten/sui/utils';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  getAccount,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { getAddress } from 'ethers';
import config from 'config';

function isValidEvmAddress(address: string): boolean {
  if (
    !address.startsWith('0x') ||
    address.length !== 42 ||
    !encoding.hex.valid(address)
  ) {
    return false;
  }

  try {
    getAddress(address);
    return true;
  } catch {
    return false;
  }
}

async function isValidSolanaAddress(address: string): Promise<boolean> {
  try {
    const key = new PublicKey(address);
    if (config.rpcs.Solana) {
      const connection = new Connection(config.rpcs.Solana);
      const results = await Promise.allSettled([
        getAccount(connection, key, 'finalized', TOKEN_PROGRAM_ID),
        getAccount(connection, key, 'finalized', TOKEN_2022_PROGRAM_ID),
      ]);
      // A token account is not a valid wallet address
      if (results.some((r) => r.status === 'fulfilled')) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function isValidAptosAddress(address: string): boolean {
  return (
    address.startsWith('0x') &&
    address.length === 66 &&
    encoding.hex.valid(address)
  );
}

export async function validateWalletAddress(
  chain: Chain,
  address: string,
): Promise<NativeAddress<Chain> | null> {
  const platform = chainToPlatform(chain);

  // toNative() is permissive and accepts various address formats,
  // including ICAP Ethereum addresses, hex-encoded Solana addresses, and attempts to parse as a UniversalAddress if parsing fails.
  // We are being more restrictive here to prevent the user from accidentally using an incorrect address.
  switch (platform) {
    case 'Evm':
      if (!isValidEvmAddress(address)) return null;
      break;
    case 'Solana':
      if (!(await isValidSolanaAddress(address))) return null;
      break;
    case 'Sui':
      if (!isValidSuiAddress(address)) return null;
      break;
    case 'Aptos':
      if (!isValidAptosAddress(address)) return null;
      break;
    default:
      console.warn(`Unsupported platform: ${platform}`);
      return null;
  }

  try {
    // This will throw an error if the address is invalid
    return toNative(chain, address);
  } catch (e) {
    console.error(
      `Invalid address for chain ${chain}: ${address}, error: ${e}`,
    );
  }

  return null;
}
