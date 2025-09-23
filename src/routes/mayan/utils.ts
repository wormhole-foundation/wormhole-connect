import type { ChainName as MayanChainName } from '@mayanfinance/swap-sdk';
import type { ChainName as MayanTestnetChainName } from '@testnet-mayan/swap-sdk';

// Testnet chain names supported by @testnet-mayan/swap-sdk
import type {
  AttestationReceipt,
  Chain,
  CompletedTransferReceipt,
  RedeemedTransferReceipt,
  RefundedTransferReceipt,
  SourceInitiatedTransferReceipt,
  TransactionId,
  routes,
  Network,
} from '@wormhole-foundation/sdk-connect';
import {
  TransferState,
  deserialize,
  encoding,
  toChain,
} from '@wormhole-foundation/sdk-connect';
import axios from 'axios';
import type { TransactionStatus } from './types';
import { MayanClientStatus, MayanTransactionGoal } from './types';

export function getNativeContractAddress(chain: Chain): string {
  if (chain === 'Sui') return '0x2::sui::SUI';
  return '0x0000000000000000000000000000000000000000';
}

// Deadline in minutes recommended by api
// hardcoded for now, but can be fetched from
// https://sia.mayan.finance/v3/init
const defaultDeadlines: {
  [key in Chain]?: number;
} = {
  Bsc: 16,
  Avalanche: 16,
  Polygon: 18,
  Ethereum: 76,
  Solana: 10,
  Arbitrum: 96,
  Aptos: 50,
  Unichain: 96,
  Sui: 40,
};

// return the default deadline for a given chain in seconds
// or return 1 hour if not found
export function getDefaultDeadline(chain: Chain): number {
  if (chain in defaultDeadlines) return defaultDeadlines[chain]! * 60;
  return 60 * 60;
}

const chainNameMap = {
  Solana: 'solana',
  Ethereum: 'ethereum',
  Bsc: 'bsc',
  Polygon: 'polygon',
  Avalanche: 'avalanche',
  Arbitrum: 'arbitrum',
  Aptos: 'aptos',
  Base: 'base',
  Optimism: 'optimism',
  Unichain: 'unichain',
  Sui: 'sui',
  HyperEVM: 'hyperevm',
  HyperCore: 'hypercore',
  Linea: 'linea',
} as Record<Chain, MayanChainName>;

// Mapping of Wormhole chains to testnet Mayan chain names
// Only Solana, Ethereum, Base, Sui, and Monad are supported on testnet
const testnetSupportedChainMap: Partial<Record<Chain, MayanTestnetChainName>> =
  {
    Solana: 'solana',
    Sepolia: 'ethereum',
    BaseSepolia: 'base',
    Sui: 'sui',
    Monad: 'monad',
  };

export function toMayanChainName(
  network: Network,
  chain: Chain,
): MayanChainName | MayanTestnetChainName {
  if (network === 'Mainnet') {
    if (!chainNameMap[chain]) throw new Error(`Chain ${chain} not supported`);
    return chainNameMap[chain] as MayanChainName;
  } else if (network === 'Testnet') {
    if (!testnetSupportedChainMap[chain])
      throw new Error(`Chain ${chain} not supported`);
    return testnetSupportedChainMap[chain] as MayanChainName;
  }
  throw new Error(`Unsupported network: ${network}`);
}

export function isTestnetSupportedChain(chain: Chain): boolean {
  return testnetSupportedChainMap[chain] !== undefined;
}

export function fromMayanChainName(mayanChain: MayanChainName): Chain {
  for (const [wormholeChain, mayanName] of Object.entries(chainNameMap)) {
    if (mayanName === mayanChain) {
      return wormholeChain as Chain;
    }
  }
  throw new Error(`Unknown Mayan chain ${mayanChain}`);
}

export function toWormholeChainName(chainIdStr: string): Chain {
  return toChain(Number(chainIdStr));
}

export function supportedChains(network?: Network): Chain[] {
  if (network === 'Testnet') {
    // Return only chains that are supported on testnet
    return Object.keys(testnetSupportedChainMap) as Chain[];
  }
  return Object.keys(chainNameMap) as Chain[];
}

const possibleVaaTypes = [
  // Bridge to swap chain (solana)
  'transfer',
  // Info about the swap
  'swap',
  // Successful, bridge to destination chain
  'redeem',
  // Unsuccessful auction, refund back to source chain (evm)
  'refund',
];

export function txStatusToReceipt(txStatus: TransactionStatus): routes.Receipt {
  const srcChain = toWormholeChainName(txStatus.sourceChain);
  const dstChain = toWormholeChainName(txStatus.destChain);

  const originTxs = txStatus.txs
    .filter((tx) => {
      return (
        // Send from Evm to Solana
        tx.goals.includes(MayanTransactionGoal.Send) ||
        // Register for auction on Solana
        tx.goals.includes(MayanTransactionGoal.Register)
      );
    })
    .map((tx) => {
      return {
        chain: srcChain,
        txid: tx.txHash,
      };
    });

  const destinationTxs = txStatus.txs
    .filter((tx) => {
      return tx.goals.includes(MayanTransactionGoal.Settle);
    })
    .map((tx) => {
      return {
        chain: dstChain,
        txid: tx.txHash,
      };
    });

  const refundTxs: Array<{ chain: Chain; txid: string }> = [];
  if (txStatus.refundTxHash) {
    refundTxs.push({
      chain: toWormholeChainName(txStatus.refundChain),
      txid: txStatus.refundTxHash,
    });
  }

  const attestations: {
    [key: string]: Required<AttestationReceipt<'WormholeCore'>>;
  } = {};
  for (const vaaType of possibleVaaTypes) {
    const key = `${vaaType}SignedVaa`;
    if (key in txStatus && txStatus[key as keyof TransactionStatus] !== null) {
      const vaa = deserialize(
        'Uint8Array',
        encoding.hex.decode(txStatus[key as keyof TransactionStatus]),
      );

      attestations[vaaType] = {
        id: {
          emitter: vaa.emitterAddress,
          sequence: vaa.sequence,
          chain: vaa.emitterChain,
        },
        attestation: vaa,
      };
    }
  }

  // TODO this is a hack. The Receipt type should ideally not require an Attestation.
  let attestation: AttestationReceipt<'WormholeCore'> =
    {} as AttestationReceipt<'WormholeCore'>;
  let isAttested = false;
  if ('redeem' in attestations) {
    attestation = attestations['redeem'];
    isAttested = true;
  } else if ('transfer' in attestations) {
    attestation = attestations['transfer'];
    isAttested = true;
  }

  if (txStatus.clientStatus === MayanClientStatus.COMPLETED) {
    return {
      from: srcChain,
      to: dstChain,
      originTxs,
      destinationTxs,
      state: TransferState.DestinationFinalized,
      attestation,
    } satisfies CompletedTransferReceipt<AttestationReceipt<'WormholeCore'>>;
  } else if (
    txStatus.clientStatus === MayanClientStatus.REFUNDED ||
    txStatus.clientStatus === MayanClientStatus.CANCELED
  ) {
    return {
      from: srcChain,
      to: dstChain,
      originTxs,
      refundTxs,
      state: TransferState.Refunded,
      attestation: attestations['refund']!,
    } satisfies RefundedTransferReceipt<AttestationReceipt<'WormholeCore'>>;
  } else if (txStatus.clientStatus === MayanClientStatus.INPROGRESS) {
    if (isAttested && destinationTxs.length > 0) {
      return {
        from: srcChain,
        to: dstChain,
        originTxs,
        destinationTxs,
        state: TransferState.DestinationInitiated,
        attestation: attestation as Required<
          AttestationReceipt<'WormholeCore'>
        >,
      } satisfies RedeemedTransferReceipt<AttestationReceipt<'WormholeCore'>>;
    } else {
      return {
        from: srcChain,
        to: dstChain,
        originTxs,
        state: TransferState.SourceInitiated,
      } satisfies SourceInitiatedTransferReceipt;
    }
  } else {
    throw new Error(`Unknown Mayan clientStatus ${txStatus.clientStatus}`);
  }
}

export async function getTransactionStatus(
  network: Network,
  tx: TransactionId,
): Promise<TransactionStatus | null> {
  const url = `https://${
    { Mainnet: '', Testnet: 'testnet-', Devnet: '' }[network]
  }explorer-api.mayan.finance/v3/swap/trx/${tx.txid}`;
  try {
    const response = await axios.get<TransactionStatus>(url);
    if (response.data.id) return response.data;
  } catch (error) {
    if (!error) return null;
    if (typeof error === 'object') {
      // A 404 error means the VAA is not yet available
      // since its not available yet, we return null signaling it can be tried again
      if (axios.isAxiosError(error) && error.response?.status === 404)
        return null;
      if ('status' in error && error.status === 404) return null;
    }
    throw error;
  }
  return null;
}
