import type { ChainId } from '@lifi/sdk';
import {
  getStatus,
  type GetStatusRequest,
  type StatusResponse,
} from '@lifi/sdk';
import type {
  Chain,
  ChainContext,
  TokenId,
  TransactionId,
  Network,
} from '@wormhole-foundation/sdk-connect';
import {
  Wormhole,
  chainToPlatform,
  isNative,
  nativeChainIds,
} from '@wormhole-foundation/sdk-connect';
import {
  LIFI_NATIVE_ADDRESS_EVM,
  LIFI_NATIVE_ADDRESS_SVM,
  LIFI_NATIVE_ADDRESS_SUI,
  CHAIN_ID_MAP,
  CHAIN_FROM_ID_MAP,
} from './consts';
import { generateThrowawayAddress as generateEvmThrowawayAddress } from './platforms/evm';
import { generateThrowawayAddress as generateSolanaThrowawayAddress } from './platforms/svm';
import { generateThrowawayAddress as generateSuiThrowawayAddress } from './platforms/sui';

export function getNativeContractAddress(chain: Chain): string {
  return mapTokenIdToLifiToken({ chain, address: 'native' });
}

export function toLifiTokenAddress(tokenId: TokenId): string {
  return !isNative(tokenId.address)
    ? tokenId.address.toString()
    : getNativeContractAddress(tokenId.chain);
}

export function generateThrowawayAddress(chain: Chain): string {
  const platform = chainToPlatform(chain);
  if (platform === 'Solana') {
    return generateSolanaThrowawayAddress();
  } else if (platform === 'Sui') {
    return generateSuiThrowawayAddress();
  } else if (platform === 'Evm') {
    return generateEvmThrowawayAddress();
  } else {
    throw new Error('Unsupported platform');
  }
}

export async function getNativeChainId<N extends Network>(
  chainContext: ChainContext<N>,
): Promise<bigint> {
  // Get the native chain ID for EVM chains
  const chainId = nativeChainIds.networkChainToNativeChainId.get(
    chainContext.network,
    chainContext.chain,
  );
  if (!chainId) {
    throw new Error(
      `No native chain ID found for ${chainContext.chain} on ${chainContext.network}`,
    );
  }
  return chainId as bigint;
}

export function toLifiChainId(chain: Chain): ChainId {
  const chainId = CHAIN_ID_MAP[chain];
  if (!chainId) throw new Error(`Unsupported LiFi chain: ${chain}`);
  return chainId;
}

export function lifiChainIdToChain(chainId: ChainId): Chain {
  const chain = CHAIN_FROM_ID_MAP[chainId];
  if (!chain) throw new Error(`Unsupported LiFi chainId: ${chainId}`);
  return chain;
}

export function supportedChains(network?: Network): Chain[] {
  if (network === 'Mainnet') {
    return Object.keys(CHAIN_ID_MAP).map((c) => c as Chain);
  }

  // No testnet on LiFi
  return [];
}

export function mapTokenIdToLifiToken(tokenId: TokenId): string {
  // LiFi uses token addresses directly
  // For native tokens, use the zero address
  if (tokenId.address === 'native') {
    const platform = chainToPlatform(tokenId.chain);
    if (platform === 'Evm') {
      return LIFI_NATIVE_ADDRESS_EVM;
    } else if (platform === 'Solana') {
      return LIFI_NATIVE_ADDRESS_SVM;
    } else if (platform === 'Sui') {
      return LIFI_NATIVE_ADDRESS_SUI;
    }
    throw new Error(`Unsupported platform for native token: ${platform}`);
  }
  return tokenId.address.toString();
}

export function mapLifiTokenToTokenId(
  tokenAddress: string,
  chain: Chain,
): TokenId {
  const platform = chainToPlatform(chain);
  if (
    (platform === 'Evm' && tokenAddress === LIFI_NATIVE_ADDRESS_EVM) ||
    (platform === 'Solana' && tokenAddress === LIFI_NATIVE_ADDRESS_SVM) ||
    (platform === 'Sui' && tokenAddress === LIFI_NATIVE_ADDRESS_SUI)
  ) {
    return {
      chain,
      address: 'native',
    };
  }

  return {
    chain,
    address: Wormhole.parseAddress(chain, tokenAddress),
  };
}

export async function getTransactionStatus(
  _network: Network,
  tx: TransactionId,
  fromChain: string,
  toChain: string,
  bridge?: string,
): Promise<StatusResponse | null> {
  const statusRequest: GetStatusRequest = {
    txHash: tx.txid,
    fromChain,
    toChain,
    bridge,
  };

  const response = await getStatus(statusRequest);
  if (response.status === 'NOT_FOUND') {
    return null;
  }
  return response;
}
