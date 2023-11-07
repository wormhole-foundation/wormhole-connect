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

// TODO: testnet address, change this
const WORMHOLE_GATEWAY_PROGRAM_ID =
  '87MEvHZCXE3ML5rrmh5uX1FbShHmRXXS32xJDGbQ7h5t';
const TOKEN_BRIDGE_PROGRAM_ID = 'DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe';
const CORE_BRIDGE_PROGRAM_ID = '3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5';
const TBTC_PROGRAM_ID = new PublicKey(
  'Gj93RRt6QB7FjmyokAD5rcMAku7pq3Fk2Aa8y6nNbwsV',
);

function getCustodianPDA(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('redeemer')],
    new PublicKey(WORMHOLE_GATEWAY_PROGRAM_ID),
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

function getCoreMessagePDA(sequence: bigint): PublicKey {
  const encodedSequence = Buffer.alloc(8);
  encodedSequence.writeBigUInt64LE(sequence);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('msg'), encodedSequence],
    new PublicKey(WORMHOLE_GATEWAY_PROGRAM_ID),
  )[0];
}

function getGatewayInfoPDA(targetChain: number): PublicKey {
  const encodedChain = Buffer.alloc(2);
  encodedChain.writeUInt16LE(targetChain);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('gateway-info'), encodedChain],
    new PublicKey(WORMHOLE_GATEWAY_PROGRAM_ID),
  )[0];
}

function getTokenBridgeCoreEmitter() {
  const [tokenBridgeCoreEmitter] = PublicKey.findProgramAddressSync(
    [Buffer.from('emitter')],
    new PublicKey(TOKEN_BRIDGE_PROGRAM_ID),
  );
  return tokenBridgeCoreEmitter;
}

async function getTokenBridgeSequence(connection: Connection) {
  const emitter = getTokenBridgeCoreEmitter();
  return getSequenceTracker(connection, emitter, CORE_BRIDGE_PROGRAM_ID).then(
    (tracker) => tracker.sequence,
  );
}

export const sendTbtc = async (
  amount: string,
  recipientChain: ChainId,
  recipientAddress: Uint8Array,
  sender: string,
  isCanonicalChain: boolean,
  connection: Connection,
): Promise<Transaction> => {
  const program = new Program(WormholeGatewayIdl, WORMHOLE_GATEWAY_PROGRAM_ID, {
    connection,
  });
  const custodian = getCustodianPDA();
  const custodianData = await program.account.custodian.fetch(custodian);
  const tbtcMint = new PublicKey(custodianData.tbtcMint as string);
  const wrappedTbtcToken = new PublicKey(
    custodianData.wrappedTbtcToken as string,
  );
  const wrappedTbtcMint = new PublicKey(
    custodianData.wrappedTbtcMint as string,
  );
  const tokenBridgeWrappedAsset = deriveWrappedMetaKey(
    TOKEN_BRIDGE_PROGRAM_ID,
    wrappedTbtcMint,
  );
  const tokenBridgeConfig = deriveTokenBridgeConfigKey(TOKEN_BRIDGE_PROGRAM_ID);
  const tokenBridgeTransferAuthority = deriveAuthoritySignerKey(
    TOKEN_BRIDGE_PROGRAM_ID,
  );
  const coreFeeCollector = deriveFeeCollectorKey(CORE_BRIDGE_PROGRAM_ID);
  const sequence = await getTokenBridgeSequence(connection);
  const coreMessage = getCoreMessagePDA(sequence);
  const coreBridgeData = deriveWormholeBridgeDataKey(CORE_BRIDGE_PROGRAM_ID);
  const tokenBridgeCoreEmitter = getTokenBridgeCoreEmitter();
  const coreEmitterSequence = deriveEmitterSequenceKey(
    tokenBridgeCoreEmitter,
    CORE_BRIDGE_PROGRAM_ID,
  );
  const gatewayInfo = getGatewayInfoPDA(recipientChain);
  const tokenBridgeSender = deriveSenderAccountKey(WORMHOLE_GATEWAY_PROGRAM_ID);
  const args = {
    amount: new BN(amount),
    recipientChain,
    recipient: recipientAddress,
    nonce: 0,
  };
  const associatedTokenAccount = await getAssociatedTokenAddress(
    // new PublicKey(senderToken),
    tbtcMint,
    new PublicKey(sender),
  );
  if (!isCanonicalChain) {
    const accounts = {
      custodian,
      wrappedTbtcToken,
      wrappedTbtcMint,
      tbtcMint,
      senderToken: associatedTokenAccount, // associated token account
      sender: new PublicKey(sender), //sender, associated token account owner,
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
      tokenBridgeProgram: TOKEN_BRIDGE_PROGRAM_ID,
      coreBridgeProgram: CORE_BRIDGE_PROGRAM_ID,
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
      senderToken: associatedTokenAccount, // associated token account
      sender: new PublicKey(sender), //sender, associated token account owner,
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
      tokenBridgeProgram: TOKEN_BRIDGE_PROGRAM_ID,
      coreBridgeProgram: CORE_BRIDGE_PROGRAM_ID,
    };
    return program.methods
      .sendTbtcGateway({ ...args, arbiterFee: new BN(0) })
      .accounts(accounts)
      .transaction();
  }
};

export const receiveTbtc = async (
  signedVAA: SignedVaa,
  payer: PublicKeyInitData,
  connection: Connection,
): Promise<Transaction> => {
  const parsed = parseTokenTransferVaa(signedVAA);
  const recipient = new PublicKey(payer);
  const custodian = getCustodianPDA();
  const program = new Program(WormholeGatewayIdl, WORMHOLE_GATEWAY_PROGRAM_ID, {
    connection,
  });
  const custodianData = await program.account.custodian.fetch(custodian);
  const tbtcMint = new PublicKey(custodianData.tbtcMint as string);
  console.log(`tbtcMint: ${tbtcMint.toBase58()}`);
  const wrappedTbtcToken = new PublicKey(
    custodianData.wrappedTbtcToken as string,
  );
  const wrappedTbtcMint = new PublicKey(
    custodianData.wrappedTbtcMint as string,
  );
  const recipientTokenKey = await getAssociatedTokenAddress(
    tbtcMint,
    recipient,
  );
  const transaction = new Transaction();
  const recipientToken = await connection.getAccountInfo(recipientTokenKey);
  console.log('recipientToken', recipientToken, recipientTokenKey.toBase58());
  if (!recipientToken) {
    const recipientTokenAtaIx = createAssociatedTokenAccountInstruction(
      recipient,
      recipientTokenKey,
      recipient,
      tbtcMint,
    );
    transaction.add(recipientTokenAtaIx);
  }
  const tokenBridgeWrappedAsset = deriveWrappedMetaKey(
    TOKEN_BRIDGE_PROGRAM_ID,
    wrappedTbtcMint,
  );
  const recipientWrappedToken = await getAssociatedTokenAddress(
    wrappedTbtcMint,
    recipient,
  );
  const accounts = {
    payer: recipient,
    custodian,
    postedVaa: derivePostedVaaKey(CORE_BRIDGE_PROGRAM_ID, parsed.hash),
    tokenBridgeClaim: deriveClaimKey(
      TOKEN_BRIDGE_PROGRAM_ID,
      parsed.emitterAddress,
      parsed.emitterChain,
      parsed.sequence,
    ),
    wrappedTbtcToken,
    wrappedTbtcMint,
    tbtcMint,
    recipientToken: recipientTokenKey,
    recipient,
    recipientWrappedToken,
    tbtcConfig: getConfigPDA(),
    tbtcMinterInfo: getMinterInfoPDA(custodian),
    tokenBridgeConfig: deriveTokenBridgeConfigKey(TOKEN_BRIDGE_PROGRAM_ID),
    tokenBridgeRegisteredEmitter: deriveEndpointKey(
      TOKEN_BRIDGE_PROGRAM_ID,
      parsed.emitterChain,
      parsed.emitterAddress,
    ),
    tokenBridgeWrappedAsset,
    tokenBridgeMintAuthority: deriveMintAuthorityKey(TOKEN_BRIDGE_PROGRAM_ID),
    rent: SYSVAR_RENT_PUBKEY,
    tbtcProgram: TBTC_PROGRAM_ID,
    tokenBridgeProgram: TOKEN_BRIDGE_PROGRAM_ID,
    coreBridgeProgram: CORE_BRIDGE_PROGRAM_ID,
  };
  const receiveTbtcIx = await program.methods
    .receiveTbtc(parsed.hash)
    .accounts(accounts)
    .instruction();
  return transaction.add(receiveTbtcIx);
};
