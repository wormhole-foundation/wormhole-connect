import base58 from 'bs58';
import * as ethers from 'ethers';
import { AptosClient } from 'aptos';
import * as bech32 from 'bech32';
import { ChainName } from 'index';
import { isEvmChain, toChainId } from 'utils/sdk';
import { isGatewayChain } from '@wormhole-foundation/wormhole-connect-sdk';

export const isValidAddress = async (
  address: string,
  chain: ChainName,
): Promise<boolean> => {
  if (isEvmChain(chain as ChainName)) {
    return isValidEthereumAddress(address);
  } else if (chain === 'solana') {
    return isValidSolanaAddress(address);
  } else if (chain === 'aptos') {
    return isValidAptosAddress(address);
  } else if (chain === 'sui') {
    return isValidSuiAddress(address);
  } else if (isGatewayChain(toChainId(chain)) || chain === 'sei') {
    return isValidCosmosAddress(address, chain);
  }
  return false;
};

// Ethereum Validation
const getEthereumAddressWithChecksum = (address: string): string => {
  return ethers.utils.getAddress(address);
};
const isValidEthereumAddress = (address: string, strict = false): boolean => {
  // We need to ensure the address contains the checksum
  try {
    const addressWithChecksum = getEthereumAddressWithChecksum(address);
    if (strict) {
      return address === addressWithChecksum;
    }
    return address.toLowerCase() === addressWithChecksum.toLocaleLowerCase();
  } catch (e) {
    const typedError = e as { reason?: string };
    if (
      typedError.reason === 'invalid address' ||
      typedError.reason === 'bad address checksum' ||
      typedError.reason === 'bad icap checksum'
    ) {
      return false;
    }
  }
  return false;
};

// Solana Validation
const isValidSolanaAddress = (address: string): boolean => {
  try {
    const decoded = base58.decode(address);
    return decoded.length === 32;
  } catch (e) {
    return false;
  }
};

// Aptos Validation
const aptosClient = new AptosClient('https://api.mainnet.aptoslabs.com/v1');
const isValidAptosAddress = async (address: string) => {
  try {
    return !!(await aptosClient.getAccount(address));
  } catch {
    return false;
  }
};

// Cosmos Validation
const isValidCosmosAddress = (address: string, chain: ChainName) => {
  const PREFIXES: Record<string, string> = {
    osmosis: 'osmo',
    evmos: 'evmos',
    kujira: 'kujira',
    injective: 'inj',
  };
  if (chain === 'evmos' && address.startsWith('0x')) {
    // For Evmos hex address case https://docs.evmos.org/protocol/concepts/accounts#address-formats-for-clients
    return isValidEthereumAddress(address);
  } else {
    // For Beach32 encode case https://docs.cosmos.network/v0.47/build/spec/addresses/bech32
    try {
      const decoded = bech32.decode(address);
      return PREFIXES[chain] === decoded.prefix && !!decoded.words?.length;
    } catch {
      return false;
    }
  }
};

// Sui Validation
const isHex = (value: string) => {
  return /^(0x|0X)?[a-fA-F0-9]+$/.test(value) && value.length % 2 === 0;
};
const getHexByteLength = (value: string) => {
  return /^(0x|0X)/.test(value) ? (value.length - 2) / 2 : value.length / 2;
};
const isValidSuiAddress = (address: string) => {
  return isHex(address) && getHexByteLength(address) === 32;
};
