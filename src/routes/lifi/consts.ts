import { ChainId } from '@lifi/sdk';
import type { Chain } from '@wormhole-foundation/sdk-connect';

// Constants
export const DEFAULT_SLIPPAGE_PERCENT = 0.005; // 0.5%
export const DEFAULT_MAX_PRICE_IMPACT_PERCENT = 0.2; // 20%
export const DEFAULT_ETA_SECONDS = 60;
export const DEFAULT_TIMEOUT = 60 * 60 * 1000; // 1 hour
export const DEFAULT_BRIDGES = {
  deny: ['mayan', 'mayanWH', 'mayanMCTP', 'mayanFastMCTP'],
};
export const DEFAULT_EXCHANGES = {};

export const MILLISECONDS_PER_SECOND = 1000;
export const POLLING_INTERVAL_MS = 5000;

// LiFi native token addresses (LiFi doesn't export these from their SDK)
export const LIFI_NATIVE_ADDRESS_EVM =
  '0x0000000000000000000000000000000000000000';
export const LIFI_NATIVE_ADDRESS_SVM = '11111111111111111111111111111111';
export const LIFI_NATIVE_ADDRESS_SUI = '0x2::sui::SUI';

// Map Wormhole chains to LiFi ChainId
export const CHAIN_ID_MAP: Partial<Record<Chain, ChainId>> = {
  Ethereum: ChainId.ETH,
  Bsc: ChainId.BSC,
  Polygon: ChainId.POL,
  Avalanche: ChainId.AVA,
  Arbitrum: ChainId.ARB,
  Optimism: ChainId.OPT,
  Base: ChainId.BAS,
  Solana: ChainId.SOL,
  Sui: ChainId.SUI,
  Celo: ChainId.CEL,
  Unichain: ChainId.UNI,
  Berachain: ChainId.BER,
  Mantle: ChainId.MNT,
  Scroll: ChainId.SCL,
  Worldchain: ChainId.WCC,
  Moonbeam: ChainId.MOO,
  Linea: ChainId.LNA,
  Sonic: ChainId.SON,
  HyperEVM: ChainId.HYP,
  Seievm: ChainId.SEI,
};

// Reverse mapping from LiFi ChainId to Wormhole Chain
export const CHAIN_FROM_ID_MAP: Record<number, Chain> = Object.entries(
  CHAIN_ID_MAP,
).reduce((acc, [chain, chainId]) => {
  acc[chainId] = chain as Chain;
  return acc;
}, {} as Record<number, Chain>);

export const DEFAULT_INTEGRATOR = 'lifi-sdk';
export const DEFAULT_API_URL = 'https://li.quest/v1';
