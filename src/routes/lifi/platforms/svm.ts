import type { Route } from '@lifi/sdk';
import { getStepTransaction } from '@lifi/sdk';
import type { Network } from '@wormhole-foundation/sdk-connect';
import type { SolanaTransaction } from '@wormhole-foundation/sdk-solana';
import {
  SolanaPlatform,
  SolanaUnsignedTransaction,
} from '@wormhole-foundation/sdk-solana';
import { VersionedTransaction, Keypair } from '@solana/web3.js';
import type { PlatformContext } from '../types';
import { executeTransaction } from '../utils';

export function generateThrowawayAddress(): string {
  return Keypair.generate().publicKey.toString();
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
