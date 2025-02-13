import {
  Connection,
  ComputeBudgetProgram,
  Transaction,
  TransactionInstruction,
  AddressLookupTableAccount,
  TransactionMessage,
  VersionedTransaction,
  Commitment,
  SimulatedTransactionResponse,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

import {
  determinePriorityFee,
  determinePriorityFeeTritonOne,
  isVersionedTransaction,
  SolanaUnsignedTransaction,
} from '@wormhole-foundation/sdk-solana';

import { Network } from '@wormhole-foundation/sdk';
import { isEmptyObject, sleep } from 'utils';
import config from 'config';

export type SolanaRpcProvider = 'triton' | 'helius' | 'ankr' | 'unknown';

function determineRpcProvider(endpoint: string): SolanaRpcProvider {
  if (endpoint.includes('rpcpool.com')) {
    return 'triton';
  } else if (endpoint.includes('helius-rpc.com')) {
    return 'helius';
  } else if (endpoint.includes('rpc.ankr.com')) {
    return 'ankr';
  } else {
    return 'unknown';
  }
}

export async function setPriorityFeeInstructions(
  connection: Connection,
  blockhash: string,
  lastValidBlockHeight: number,
  request: SolanaUnsignedTransaction<Network>,
): Promise<Transaction | VersionedTransaction> {
  const unsignedTx = request.transaction.transaction;

  const computeBudgetIxFilter = (ix) =>
    ix.programId.toString() !== 'ComputeBudget111111111111111111111111111111';

  if (isVersionedTransaction(unsignedTx)) {
    const luts = (
      await Promise.all(
        unsignedTx.message.addressTableLookups.map((acc) =>
          connection.getAddressLookupTable(acc.accountKey),
        ),
      )
    )
      .map((lut) => lut.value)
      .filter((lut) => lut !== null) as AddressLookupTableAccount[];

    const message = TransactionMessage.decompile(unsignedTx.message, {
      addressLookupTableAccounts: luts,
    });
    message.recentBlockhash = blockhash;
    unsignedTx.message.recentBlockhash = blockhash;

    // Remove existing compute budget instructions if they were added by the SDK
    message.instructions = message.instructions.filter(computeBudgetIxFilter);
    message.instructions.push(
      ...(await createPriorityFeeInstructions(connection, unsignedTx)),
    );

    unsignedTx.message = message.compileToV0Message(luts);
    unsignedTx.sign(request.transaction.signers ?? []);
  } else {
    unsignedTx.recentBlockhash = blockhash;
    unsignedTx.lastValidBlockHeight = lastValidBlockHeight;

    // Remove existing compute budget instructions if they were added by the SDK
    unsignedTx.instructions = unsignedTx.instructions.filter(
      computeBudgetIxFilter,
    );
    unsignedTx.add(
      ...(await createPriorityFeeInstructions(connection, unsignedTx)),
    );
    if (request.transaction.signers) {
      unsignedTx.partialSign(...request.transaction.signers);
    }
  }

  return unsignedTx;
}

// This will throw if the simulation fails
async function createPriorityFeeInstructions(
  connection: Connection,
  transaction: Transaction | VersionedTransaction,
  commitment?: Commitment,
) {
  let unitsUsed = 200_000;
  let simulationAttempts = 0;

  simulationLoop: while (true) {
    if (
      isVersionedTransaction(transaction) &&
      !transaction.message.recentBlockhash
    ) {
      // This is required for versioned transactions
      // SimulateTransaction throws if recentBlockhash is an empty string
      const { blockhash } = await connection.getLatestBlockhash(commitment);
      transaction.message.recentBlockhash = blockhash;
    }

    const response = await (isVersionedTransaction(transaction)
      ? connection.simulateTransaction(transaction, {
          commitment,
          replaceRecentBlockhash: true,
        })
      : connection.simulateTransaction(transaction));

    if (response.value.err) {
      if (checkKnownSimulationError(response.value)) {
        // Number of attempts will be at most 5 for known errors
        if (simulationAttempts < 5) {
          simulationAttempts++;
          await sleep(1000);
          continue simulationLoop;
        }
      } else if (simulationAttempts < 3) {
        // Number of attempts will be at most 3 for unknown errors
        simulationAttempts++;
        await sleep(1000);
        continue simulationLoop;
      }

      // Still failing after multiple attempts for both known and unknown errors
      // We should throw in that case
      throw new Error(
        `Simulation failed: ${JSON.stringify(response.value.err)}\nLogs:\n${(
          response.value.logs || []
        ).join('\n  ')}`,
      );
    } else {
      // Simulation was successful
      if (response.value.unitsConsumed) {
        unitsUsed = response.value.unitsConsumed;
      }
      break;
    }
  }

  const unitBudget = Math.floor(unitsUsed * 1.2); // Budget in 20% headroom

  const instructions: TransactionInstruction[] = [];
  instructions.push(
    ComputeBudgetProgram.setComputeUnitLimit({
      // Set compute budget to 120% of the units used in the simulated transaction
      units: unitBudget,
    }),
  );

  const priorityFeeConfig =
    config.transactionSettings?.Solana?.priorityFee || {};

  const {
    percentile = 0.9,
    percentileMultiple = 1,
    min = 100_000,
    max = 100_000_000,
  } = priorityFeeConfig;

  const calculateFee = async (
    rpcProvider?: SolanaRpcProvider,
  ): Promise<{ fee: number; methodUsed: 'triton' | 'default' | 'minimum' }> => {
    if (rpcProvider === 'triton') {
      // Triton has an experimental RPC method that accepts a percentile paramater
      // and usually gives more accurate fee numbers.
      try {
        const fee = await determinePriorityFeeTritonOne(
          connection,
          transaction,
          percentile,
          percentileMultiple,
          min,
          max,
        );

        return {
          fee,
          methodUsed: 'triton',
        };
      } catch (e) {
        console.warn(`Failed to determine priority fee using Triton RPC:`, e);
      }
    }

    try {
      // By default, use generic Solana RPC method
      const fee = await determinePriorityFee(
        connection,
        transaction,
        percentile,
        percentileMultiple,
        min,
        max,
      );

      return {
        fee,
        methodUsed: 'default',
      };
    } catch (e) {
      console.warn(`Failed to determine priority fee using Triton RPC:`, e);

      return {
        fee: min,
        methodUsed: 'minimum',
      };
    }
  };

  const rpcProvider = determineRpcProvider(connection.rpcEndpoint);

  const { fee, methodUsed } = await calculateFee(rpcProvider);

  const maxFeeInSol =
    (fee /
      // convert microlamports to lamports
      1e6 /
      // convert lamports to SOL
      LAMPORTS_PER_SOL) *
    // multiply by maximum compute units used
    unitBudget;

  console.table({
    'RPC Provider': rpcProvider,
    'Method used': methodUsed,
    'Percentile used': percentile,
    'Multiple used': percentileMultiple,
    'Compute budget': unitBudget,
    'Priority fee': fee,
    'Max fee in SOL': maxFeeInSol,
  });

  instructions.push(
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: fee }),
  );
  return instructions;
}

// Checks response logs for known errors.
// Returns when the first error is encountered.
function checkKnownSimulationError(
  response: SimulatedTransactionResponse,
): boolean {
  const errors = {};

  // This error occur when the blockhash included in a transaction is not deemed to be valid
  // when a validator processes a transaction. We can retry the simulation to get a valid blockhash.
  if (response.err === 'BlockhashNotFound') {
    errors['BlockhashNotFound'] =
      'Blockhash not found during simulation. Trying again.';
  }

  // Check the response logs for any known errors
  if (response.logs) {
    for (const line of response.logs) {
      // In some cases which aren't deterministic, like a slippage error, we can retry the
      // simulation a few times to get a successful response.
      if (line.includes('SlippageToleranceExceeded')) {
        errors['SlippageToleranceExceeded'] =
          'Slippage failure during simulation. Trying again.';
      }

      // In this case a require_gte expression was violated during a Swap instruction.
      // We can retry the simulation to get a successful response.
      if (line.includes('RequireGteViolated')) {
        errors['RequireGteViolated'] =
          'Swap instruction failure during simulation. Trying again.';
      }
    }
  }

  // No known simulation errors found
  if (isEmptyObject(errors)) {
    return false;
  }

  console.table(errors);
  return true;
}
