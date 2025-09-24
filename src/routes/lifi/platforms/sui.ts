import type { Route } from '@lifi/sdk';
import { getStepTransaction } from '@lifi/sdk';
import type { Network } from '@wormhole-foundation/sdk-connect';
import {
  SuiPlatform,
  SuiUnsignedTransaction,
} from '@wormhole-foundation/sdk-sui';
import { Transaction } from '@mysten/sui/transactions';
import { fromBase64 } from '@mysten/sui/utils';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import type { PlatformContext } from '../types';
import { executeTransaction } from '../utils';

export function generateThrowawayAddress(): string {
  return Ed25519Keypair.generate().toSuiAddress();
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
