import { Connection, PublicKeyInitData, PublicKey } from '@solana/web3.js';
import { Program } from '@project-serum/anchor';
import { IDL, TokenBridgeRelayer } from '../types/tokenBridgeRelayer';

export function createTokenBridgeRelayerProgramInterface(
  programId: PublicKeyInitData,
  connection: Connection,
): Program<TokenBridgeRelayer> {
  return new Program(IDL, new PublicKey(programId), { connection });
}
