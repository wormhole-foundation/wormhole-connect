import {
  Connection,
  PublicKey,
  PublicKeyInitData,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from '@solana/web3.js';
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import { BN, Program } from '@project-serum/anchor';
import { WormholeGatewayIdl } from './WormholeGatewayIdl';
import {
  deriveAuthoritySignerKey,
  deriveEndpointKey,
  deriveMintAuthorityKey,
  deriveSenderAccountKey,
  deriveTokenBridgeConfigKey,
  deriveWrappedMetaKey,
} from '@certusone/wormhole-sdk/lib/esm/solana/tokenBridge';
import {
  deriveClaimKey,
  deriveEmitterSequenceKey,
  deriveFeeCollectorKey,
  derivePostedVaaKey,
  deriveWormholeBridgeDataKey,
  getSequenceTracker,
} from '@certusone/wormhole-sdk/lib/esm/solana/wormhole';
import {
  parseTokenTransferVaa,
  SignedVaa,
  ChainId,
} from '@wormhole-foundation/wormhole-connect-sdk';

// same address in mainnet and testnet
const TBTC_PROGRAM_ID = new PublicKey(
  'Gj93RRt6QB7FjmyokAD5rcMAku7pq3Fk2Aa8y6nNbwsV',
);

function getCustodianPDA(gatewayProgramId: PublicKeyInitData): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('redeemer')],
    new PublicKey(gatewayProgramId),
  )[0];
}

function getConfigPDA(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    TBTC_PROGRAM_ID,
  )[0];
}

function getMinterInfoPDA(minter: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('minter-info'), minter.toBuffer()],
    TBTC_PROGRAM_ID,
  )[0];
}

function getCoreMessagePDA(
  sequence: bigint,
  gatewayProgramId: PublicKeyInitData,
): PublicKey {
  const encodedSequence = Buffer.alloc(8);
  encodedSequence.writeBigUInt64LE(sequence);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('msg'), encodedSequence],
    new PublicKey(gatewayProgramId),
  )[0];
}

function getGatewayInfoPDA(
  targetChain: number,
  gatewayProgramId: PublicKeyInitData,
): PublicKey {
  const encodedChain = Buffer.alloc(2);
  encodedChain.writeUInt16LE(targetChain);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('gateway-info'), encodedChain],
    new PublicKey(gatewayProgramId),
  )[0];
}

function getTokenBridgeCoreEmitter(tokenBridgeProgramId: PublicKeyInitData) {
  const [tokenBridgeCoreEmitter] = PublicKey.findProgramAddressSync(
    [Buffer.from('emitter')],
    new PublicKey(tokenBridgeProgramId),
  );
  return tokenBridgeCoreEmitter;
}

async function getTokenBridgeSequence(
  connection: Connection,
  coreBridgeProgramId: PublicKeyInitData,
  tokenBridgeProgramId: PublicKeyInitData,
) {
  const emitter = getTokenBridgeCoreEmitter(tokenBridgeProgramId);
  return getSequenceTracker(connection, emitter, coreBridgeProgramId).then(
    (tracker) => tracker.sequence,
  );
}

export async function sendTbtc(
  amount: string,
  recipientChain: ChainId,
  recipientAddress: Uint8Array,
  sender: string,
  isCanonicalChain: boolean,
  connection: Connection,
  gatewayProgramId: string,
  tokenBridgeProgramId: string,
  coreBridgeProgramId: string,
): Promise<Transaction> {
  const program = new Program(WormholeGatewayIdl, gatewayProgramId, {
    connection,
  });
  const custodian = getCustodianPDA(gatewayProgramId);
  const custodianData = await program.account.custodian.fetch(custodian);
  const tbtcMint = new PublicKey(custodianData.tbtcMint as PublicKeyInitData);
  const wrappedTbtcToken = new PublicKey(
    custodianData.wrappedTbtcToken as PublicKeyInitData,
  );
  const wrappedTbtcMint = new PublicKey(
    custodianData.wrappedTbtcMint as PublicKeyInitData,
  );
  const tokenBridgeWrappedAsset = deriveWrappedMetaKey(
    tokenBridgeProgramId,
    wrappedTbtcMint,
  );
  const tokenBridgeConfig = deriveTokenBridgeConfigKey(tokenBridgeProgramId);
  const tokenBridgeTransferAuthority =
    deriveAuthoritySignerKey(tokenBridgeProgramId);
  const coreFeeCollector = deriveFeeCollectorKey(coreBridgeProgramId);
  const sequence = await getTokenBridgeSequence(
    connection,
    coreBridgeProgramId,
    tokenBridgeProgramId,
  );
  const coreMessage = getCoreMessagePDA(sequence, gatewayProgramId);
  const coreBridgeData = deriveWormholeBridgeDataKey(coreBridgeProgramId);
  const tokenBridgeCoreEmitter =
    getTokenBridgeCoreEmitter(tokenBridgeProgramId);
  const coreEmitterSequence = deriveEmitterSequenceKey(
    tokenBridgeCoreEmitter,
    coreBridgeProgramId,
  );
  const gatewayInfo = getGatewayInfoPDA(recipientChain, gatewayProgramId);
  const tokenBridgeSender = deriveSenderAccountKey(gatewayProgramId);
  const args = {
    amount: new BN(amount),
    recipientChain,
    recipient: recipientAddress,
    nonce: 0,
  };
  const associatedTokenAccount = await getAssociatedTokenAddress(
    tbtcMint,
    new PublicKey(sender),
  );
  if (!isCanonicalChain) {
    const accounts = {
      custodian,
      wrappedTbtcToken,
      wrappedTbtcMint,
      tbtcMint,
      senderToken: associatedTokenAccount,
      sender: new PublicKey(sender),
      tokenBridgeConfig,
      tokenBridgeWrappedAsset,
      tokenBridgeTransferAuthority,
      coreBridgeData,
      coreMessage,
      tokenBridgeCoreEmitter,
      coreEmitterSequence,
      coreFeeCollector,
      clock: SYSVAR_CLOCK_PUBKEY,
      rent: SYSVAR_RENT_PUBKEY,
      tokenBridgeProgram: tokenBridgeProgramId,
      coreBridgeProgram: coreBridgeProgramId,
    };
    return program.methods
      .sendTbtcWrapped({
        ...args,
        arbiterFee: new BN(0),
      })
      .accounts(accounts)
      .transaction();
  } else {
    const accounts = {
      custodian,
      gatewayInfo,
      wrappedTbtcToken,
      wrappedTbtcMint,
      tbtcMint,
      senderToken: associatedTokenAccount,
      sender: new PublicKey(sender),
      tokenBridgeConfig,
      tokenBridgeWrappedAsset,
      tokenBridgeTransferAuthority,
      coreBridgeData,
      coreMessage,
      tokenBridgeCoreEmitter,
      coreEmitterSequence,
      coreFeeCollector,
      clock: SYSVAR_CLOCK_PUBKEY,
      tokenBridgeSender,
      rent: SYSVAR_RENT_PUBKEY,
      tokenBridgeProgram: tokenBridgeProgramId,
      coreBridgeProgram: coreBridgeProgramId,
    };
    return program.methods
      .sendTbtcGateway({ ...args, arbiterFee: new BN(0) })
      .accounts(accounts)
      .transaction();
  }
}

export async function receiveTbtc(
  signedVAA: SignedVaa,
  payer: PublicKeyInitData,
  connection: Connection,
  gatewayProgramId: string,
  tokenBridgeProgramId: string,
  coreBridgeProgramId: string,
): Promise<Transaction> {
  const { hash, emitterAddress, emitterChain, sequence } =
    parseTokenTransferVaa(signedVAA);
  const recipient = new PublicKey(payer);
  const custodian = getCustodianPDA(gatewayProgramId);
  const program = new Program(WormholeGatewayIdl, gatewayProgramId, {
    connection,
  });
  const custodianData = await program.account.custodian.fetch(custodian);
  const tbtcMint = new PublicKey(custodianData.tbtcMint as PublicKeyInitData);
  const wrappedTbtcToken = new PublicKey(
    custodianData.wrappedTbtcToken as PublicKeyInitData,
  );
  const wrappedTbtcMint = new PublicKey(
    custodianData.wrappedTbtcMint as PublicKeyInitData,
  );
  const recipientTokenKey = await getAssociatedTokenAddress(
    tbtcMint,
    recipient,
  );
  const transaction = new Transaction();
  const recipientToken = await connection.getAccountInfo(recipientTokenKey);
  if (!recipientToken) {
    // Create the tBTC token account if it doesn't exist yet
    const recipientTokenAtaIx = createAssociatedTokenAccountInstruction(
      recipient,
      recipientTokenKey,
      recipient,
      tbtcMint,
    );
    transaction.add(recipientTokenAtaIx);
  }
  const tokenBridgeWrappedAsset = deriveWrappedMetaKey(
    tokenBridgeProgramId,
    wrappedTbtcMint,
  );
  const recipientWrappedToken = await getAssociatedTokenAddress(
    wrappedTbtcMint,
    recipient,
  );
  const accounts = {
    payer: recipient,
    custodian,
    postedVaa: derivePostedVaaKey(coreBridgeProgramId, hash),
    tokenBridgeClaim: deriveClaimKey(
      tokenBridgeProgramId,
      emitterAddress,
      emitterChain,
      sequence,
    ),
    wrappedTbtcToken,
    wrappedTbtcMint,
    tbtcMint,
    recipientToken: recipientTokenKey,
    recipient,
    recipientWrappedToken,
    tbtcConfig: getConfigPDA(),
    tbtcMinterInfo: getMinterInfoPDA(custodian),
    tokenBridgeConfig: deriveTokenBridgeConfigKey(tokenBridgeProgramId),
    tokenBridgeRegisteredEmitter: deriveEndpointKey(
      tokenBridgeProgramId,
      emitterChain,
      emitterAddress,
    ),
    tokenBridgeWrappedAsset,
    tokenBridgeMintAuthority: deriveMintAuthorityKey(tokenBridgeProgramId),
    rent: SYSVAR_RENT_PUBKEY,
    tbtcProgram: TBTC_PROGRAM_ID,
    tokenBridgeProgram: tokenBridgeProgramId,
    coreBridgeProgram: coreBridgeProgramId,
  };
  const receiveTbtcIx = await program.methods
    .receiveTbtc(hash)
    .accounts(accounts)
    .instruction();
  return transaction.add(receiveTbtcIx);
}
