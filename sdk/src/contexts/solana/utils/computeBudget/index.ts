import {
  Connection,
  Transaction,
  TransactionInstruction,
  PublicKey,
  ComputeBudgetProgram,
} from '@solana/web3.js';

// Add priority fee according to 50th percentile of recent fees paid
const DEFAULT_FEE_PERCENTILE = 0.5;

export async function addComputeBudget(
  connection: Connection,
  transaction: Transaction,
  lockedWritableAccounts: PublicKey[] = [],
  feePercentile: number = DEFAULT_FEE_PERCENTILE,
  minPriorityFee: number = 0,
): Promise<void> {
  if (lockedWritableAccounts.length === 0) {
    lockedWritableAccounts = transaction.instructions
      .flatMap((ix) => ix.keys)
      .map((k) => (k.isWritable ? k.pubkey : null))
      .filter((k) => k !== null) as PublicKey[];
  }
  const ixs = await determineComputeBudget(
    connection,
    transaction,
    lockedWritableAccounts,
    DEFAULT_FEE_PERCENTILE,
    minPriorityFee,
  );
  transaction.add(...ixs);
}

export async function determineComputeBudget(
  connection: Connection,
  transaction: Transaction,
  lockedWritableAccounts: PublicKey[] = [],
  feePercentile: number = DEFAULT_FEE_PERCENTILE,
  minPriorityFee: number = 0,
): Promise<TransactionInstruction[]> {
  let computeBudget = 250_000;
  let priorityFee = 1;

  try {
    const simulateResponse = await connection.simulateTransaction(transaction);

    if (simulateResponse.value.err) {
      console.error(
        `Error simulating Solana transaction: ${simulateResponse.value.err}`,
      );
    }

    if (simulateResponse?.value?.unitsConsumed) {
      // Set compute budget to 120% of the units used in the simulated transaction
      computeBudget = Math.round(simulateResponse.value.unitsConsumed * 1.2);
    }
  } catch (e) {
    console.error(
      `Failed to calculate compute unit limit for Solana transaction: ${e}`,
    );
  }

  try {
    priorityFee = await determinePriorityFee(
      connection,
      lockedWritableAccounts,
      feePercentile,
    );
  } catch (e) {
    console.error(
      `Failed to calculate compute unit price for Solana transaction: ${e}`,
    );
  }
  priorityFee = Math.max(priorityFee, minPriorityFee);

  console.info(`Setting Solana compute unit budget to ${computeBudget} units`);
  console.info(
    `Setting Solana compute unit price to ${priorityFee} microLamports`,
  );

  return [
    ComputeBudgetProgram.setComputeUnitLimit({
      units: computeBudget,
    }),
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: priorityFee,
    }),
  ];
}

async function determinePriorityFee(
  connection: Connection,
  lockedWritableAccounts: PublicKey[] = [],
  percentile: number,
): Promise<number> {
  // https://twitter.com/0xMert_/status/1768669928825962706

  let fee = 1; // Set fee to 1 microlamport by default

  try {
    const recentFeesResponse = await connection.getRecentPrioritizationFees({
      lockedWritableAccounts,
    });

    if (recentFeesResponse) {
      // Get 75th percentile fee paid in recent slots
      const recentFees = recentFeesResponse
        .map((dp) => dp.prioritizationFee)
        .filter((dp) => dp > 0)
        .sort((a, b) => a - b);

      if (recentFees.length > 0) {
        const medianFee =
          recentFees[Math.floor(recentFees.length * percentile)];
        fee = Math.max(fee, medianFee);
      }
    }
  } catch (e) {
    console.error('Error fetching Solana recent fees', e);
  }

  return fee;
}
