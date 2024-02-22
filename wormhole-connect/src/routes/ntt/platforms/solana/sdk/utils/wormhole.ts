import { postVaaSolana } from '@certusone/wormhole-sdk';
import { NodeWallet } from '@certusone/wormhole-sdk/lib/cjs/solana';
import * as anchor from '@coral-xyz/anchor';

export async function postVaa(
  connection: anchor.web3.Connection,
  payer: anchor.web3.Keypair,
  vaaBuf: Buffer,
  coreBridgeAddress: anchor.web3.PublicKey,
) {
  await postVaaSolana(
    connection,
    new NodeWallet(payer).signTransaction,
    coreBridgeAddress,
    payer.publicKey,
    vaaBuf,
  );
}
