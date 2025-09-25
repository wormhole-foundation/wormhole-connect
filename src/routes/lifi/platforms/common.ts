import type {
  Chain,
  TransactionId,
  Network,
  Signer,
} from '@wormhole-foundation/sdk-connect';
import {
  isSignAndSendSigner,
  isSignOnlySigner,
} from '@wormhole-foundation/sdk-connect';
import type { EvmPlatform } from '@wormhole-foundation/sdk-evm';
import type { SolanaPlatform } from '@wormhole-foundation/sdk-solana';
import type { SuiPlatform } from '@wormhole-foundation/sdk-sui';

export async function executeTransaction<N extends Network>(
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
