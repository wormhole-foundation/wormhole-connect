import type { ChainId, Route } from '@lifi/sdk';
import {
  getStatus,
  type GetStatusRequest,
  type StatusResponse,
  getStepTransaction,
} from '@lifi/sdk';
import type {
  Chain,
  ChainContext,
  TokenId,
  TransactionId,
  Network,
  Signer,
} from '@wormhole-foundation/sdk-connect';
import {
  Wormhole,
  chainToPlatform,
  isSignAndSendSigner,
  isSignOnlySigner,
  isNative,
  amount as sdkAmount,
  nativeChainIds,
} from '@wormhole-foundation/sdk-connect';
import type { EvmChains } from '@wormhole-foundation/sdk-evm';
import {
  EvmPlatform,
  EvmUnsignedTransaction,
} from '@wormhole-foundation/sdk-evm';
import type { SolanaTransaction } from '@wormhole-foundation/sdk-solana';
import {
  SolanaPlatform,
  SolanaUnsignedTransaction,
} from '@wormhole-foundation/sdk-solana';
import {
  SuiPlatform,
  SuiUnsignedTransaction,
} from '@wormhole-foundation/sdk-sui';
import { VersionedTransaction, Keypair } from '@solana/web3.js';
import { Transaction } from '@mysten/sui/transactions';
import { fromBase64 } from '@mysten/sui/utils';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { ethers } from 'ethers';
import axios from 'axios';
import {
  LIFI_NATIVE_ADDRESS_EVM,
  LIFI_NATIVE_ADDRESS_SVM,
  LIFI_NATIVE_ADDRESS_SUI,
  CHAIN_ID_MAP,
  CHAIN_FROM_ID_MAP,
} from './consts';
import type { PlatformContext } from './types';

export function getNativeContractAddress(chain: Chain): string {
  return mapTokenIdToLifiToken({ chain, address: 'native' });
}

export function toLifiTokenAddress(tokenId: TokenId): string {
  return !isNative(tokenId.address)
    ? tokenId.address.toString()
    : getNativeContractAddress(tokenId.chain);
}

export function generateThrowawayAddress(chain: Chain): string {
  if (chain === 'Solana') {
    return Keypair.generate().publicKey.toString();
  } else if (chain === 'Sui') {
    return Ed25519Keypair.generate().toSuiAddress();
  } else {
    // For EVM chains
    return ethers.Wallet.createRandom().address;
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
  try {
    const statusRequest: GetStatusRequest = {
      txHash: tx.txid,
      fromChain,
      toChain,
      bridge,
    };

    const response = await getStatus(statusRequest);
    return response;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

async function executeTransaction<N extends Network>(
  txReq: any,
  signer: Signer<N>,
  rpc: any,
  chain: Chain,
  platform: typeof SolanaPlatform | typeof SuiPlatform | typeof EvmPlatform,
  txs: TransactionId[],
): Promise<void> {
  if (isSignAndSendSigner(signer)) {
    const txids = await signer.signAndSend([txReq]);
    txs.push(...txids.map((txid) => ({ chain, txid })));
  } else if (isSignOnlySigner(signer)) {
    const signed = await signer.sign([txReq]);
    const txids = await platform.sendWait(chain, rpc, signed);
    txs.push(...txids.map((txid) => ({ chain, txid })));
  }
}

export async function executeSolanaSteps<N extends Network>(
  route: Route,
  context: PlatformContext<N>,
): Promise<void> {
  const { request, signer, rpc, txs } = context;

  for (const step of route.steps) {
    const populatedStep = await getStepTransaction(step);
    const txData = populatedStep.transactionRequest?.data;

    if (!txData) {
      throw new Error('No transaction data in LiFi step');
    }

    if (!request.sender) {
      throw new Error('Sender is required');
    }

    const solanaTx = VersionedTransaction.deserialize(
      Buffer.from(txData, 'base64'),
    );

    const txReq = new SolanaUnsignedTransaction(
      {
        transaction: solanaTx,
        signers: undefined,
      } as SolanaTransaction,
      request.fromChain.network,
      'Solana',
      `LiFi Step: ${step.tool}`,
    );

    await executeTransaction(
      txReq,
      signer,
      rpc,
      request.fromChain.chain,
      SolanaPlatform,
      txs,
    );
  }
}

export async function executeSuiSteps<N extends Network>(
  route: Route,
  context: PlatformContext<N>,
): Promise<void> {
  const { request, signer, rpc, txs } = context;

  for (const step of route.steps) {
    const populatedStep = await getStepTransaction(step);
    const txData = populatedStep.transactionRequest;

    if (!txData || !txData.data) {
      throw new Error('No transaction data in LiFi step');
    }

    const tx = Transaction.from(fromBase64(txData.data));

    const txReq = new SuiUnsignedTransaction(
      tx,
      request.fromChain.network,
      'Sui',
      `LiFi Step: ${step.tool}`,
    );

    await executeTransaction(
      txReq,
      signer,
      rpc,
      request.fromChain.chain,
      SuiPlatform,
      txs,
    );
  }
}

export async function executeEvmSteps<N extends Network>(
  route: Route,
  context: PlatformContext<N>,
  quote: any,
  nativeChainId: bigint,
  toLifiTokenAddress: (tokenId: TokenId) => string,
): Promise<void> {
  const { request, signer, rpc, txs } = context;

  // Handle token approvals if needed
  if (!isNative(request.source.id.address)) {
    const tokenContract = EvmPlatform.getTokenImplementation(
      rpc,
      toLifiTokenAddress(request.source.id),
    );

    const firstStep = route.steps[0];
    const approvalAddress = firstStep?.estimate?.approvalAddress;

    if (approvalAddress) {
      const allowance = await tokenContract.allowance(
        signer.address(),
        approvalAddress,
      );

      const amt = sdkAmount.units(quote.sourceToken.amount);
      if (allowance < amt) {
        const txReq = await tokenContract.approve.populateTransaction(
          approvalAddress,
          amt,
        );

        const approvalTxReq = new EvmUnsignedTransaction(
          {
            from: signer.address(),
            chainId: nativeChainId as bigint,
            ...txReq,
          },
          request.fromChain.network,
          request.fromChain.chain as EvmChains,
          'Approve Allowance',
        );

        await executeTransaction(
          approvalTxReq,
          signer,
          rpc,
          request.fromChain.chain,
          EvmPlatform,
          txs,
        );
      }
    }
  }

  for (const step of route.steps) {
    const populatedStep = await getStepTransaction(step);
    const txData = populatedStep.transactionRequest;

    if (!txData) {
      throw new Error(`No transaction data in LiFi step: ${step.tool}`);
    }

    const txReq = new EvmUnsignedTransaction(
      {
        from: signer.address(),
        chainId: nativeChainId,
        to: txData.to,
        data: txData.data,
        value: txData.value || '0x0',
        gasLimit: txData.gasLimit,
        gasPrice: txData.gasPrice,
      },
      request.fromChain.network,
      request.fromChain.chain as EvmChains,
      `LiFi Step: ${step.tool}`,
    );

    await executeTransaction(
      txReq,
      signer,
      rpc,
      request.fromChain.chain,
      EvmPlatform,
      txs,
    );
  }
}
