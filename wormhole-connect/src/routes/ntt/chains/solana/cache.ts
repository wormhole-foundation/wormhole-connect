import { IDL } from './types/1.0.0/example_native_token_transfers';
import { NttManager } from './nttManager';
import { Program } from '@coral-xyz/anchor';
import { solanaContext } from 'utils/sdk';
import {
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

const cache = new Map<string, NttManager>();

export const getManagerSolana = async (nttId: string): Promise<NttManager> => {
  let manager = cache.get(nttId);
  if (!manager) {
    const version = await getVersion(nttId);
    manager = new NttManager(nttId, version);
    cache.set(nttId, manager);
  }
  return manager;
};

export const getVersion = async (nttId: string): Promise<string> => {
  // the anchor library has a built-in method to read view functions. However,
  // it requires a signer, which would trigger a wallet prompt on the frontend.
  // Instead, we manually construct a versioned transaction and call the
  // simulate function with sigVerify: false below.
  //
  // This way, the simulation won't require a signer, but it still requires
  // the pubkey of an account that has some lamports in it (since the
  // simulation checks if the account has enough money to pay for the transaction).
  //
  // It's a little unfortunate but it's the best we can do.
  const { connection } = solanaContext();
  if (!connection) throw new Error('No solana connection');
  const program = new Program(IDL, nttId, {
    connection,
  });
  const ix = await program.methods.version().accountsStrict({}).instruction();
  const latestBlockHash = await connection.getLatestBlockhash();

  // The default pubkey is a mainnet and devnet funded account
  // that can be used when simulating transactions
  const pubkey = new PublicKey('Hk3SdYTJFpawrvRz4qRztuEt2SqoCG7BGj2yJfDJSFbJ');
  const msg = new TransactionMessage({
    payerKey: pubkey,
    recentBlockhash: latestBlockHash.blockhash,
    instructions: [ix],
  }).compileToV0Message();

  try {
    const tx = new VersionedTransaction(msg);
    const txSimulation = await connection.simulateTransaction(tx, {
      sigVerify: false,
    });
    // the return buffer is in base64 and it encodes the string with a 32 bit
    // little endian length prefix.
    const data = txSimulation.value.returnData?.data[0];
    if (!data) throw new Error('No version() return data');
    const buffer = Buffer.from(data, 'base64');
    const len = buffer.readUInt32LE(0);
    return buffer.slice(4, len + 4).toString();
  } catch (e) {
    console.error(`Unable to fetch solana contract version: ${e}`);
    throw e;
  }
};
