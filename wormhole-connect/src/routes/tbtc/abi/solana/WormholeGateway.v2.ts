/*
import { AnchorProvider, BN, Program } from "@project-serum/anchor";
import {
  Connection,
  PublicKey,
  PublicKeyInitData,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import {
  SOL_BRIDGE_ADDRESS as CORE_BRIDGE_ADDRESS,
  SOL_TOKEN_BRIDGE_ADDRESS as TOKEN_BRIDGE_ADDRESS,
  THRESHOLD_GATEWAYS,
  THRESHOLD_TBTC_SOLANA_PROGRAM,
} from "../../../../utils/consts";
import {
  CHAIN_ID_ETH,
  CHAIN_ID_SOLANA,
  ChainId,
  SignedVaa,
  parseTokenTransferVaa,
} from "@certusone/wormhole-sdk";
import { WormholeGatewayIdl } from "./WormholeGatewayIdl";
import * as coreBridge from "@certusone/wormhole-sdk/lib/esm/solana/wormhole";
import * as tokenBridge from "@certusone/wormhole-sdk/lib/esm/solana/tokenBridge";
import { SolanaWallet } from "@xlabs-libs/wallet-aggregator-solana";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

const WORMHOLE_GATEWAY_PROGRAM_ID = new PublicKey(
  THRESHOLD_GATEWAYS[CHAIN_ID_SOLANA]
);
const TBTC_PROGRAM_ID = new PublicKey(THRESHOLD_TBTC_SOLANA_PROGRAM);
const CORE_BRIDGE_PROGRAM_ID = new PublicKey(CORE_BRIDGE_ADDRESS);
const TOKEN_BRIDGE_PROGRAM_ID = new PublicKey(TOKEN_BRIDGE_ADDRESS);

function newAnchorProvider(connection: Connection, wallet: SolanaWallet) {
  return new AnchorProvider(
    connection,
    {
      async signTransaction(tx): Promise<Transaction> {
        return await wallet.signTransaction(tx);
      },
      async signAllTransactions(txs): Promise<Transaction[]> {
        return await wallet.getAdapter().signAllTransactions!(txs);
      },
      publicKey: wallet.getAdapter().publicKey!,
    },
    {}
  );
}

function getCustodianPDA(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("redeemer")],
    new PublicKey(WORMHOLE_GATEWAY_PROGRAM_ID)
  )[0];
}

function getConfigPDA(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    TBTC_PROGRAM_ID
  )[0];
}

function getMinterInfoPDA(minter: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("minter-info"), minter.toBuffer()],
    TBTC_PROGRAM_ID
  )[0];
}

function getTokenBridgeCoreEmitter() {
  const [tokenBridgeCoreEmitter] = PublicKey.findProgramAddressSync(
    [Buffer.from("emitter")],
    TOKEN_BRIDGE_PROGRAM_ID
  );
  return tokenBridgeCoreEmitter;
}

async function getTokenBridgeSequence(connection: Connection) {
  const emitter = getTokenBridgeCoreEmitter();
  return coreBridge
    .getSequenceTracker(connection, emitter, CORE_BRIDGE_PROGRAM_ID)
    .then((tracker) => tracker.sequence);
}

function getCoreMessagePDA(sequence: bigint): PublicKey {
  const encodedSequence = Buffer.alloc(8);
  encodedSequence.writeBigUInt64LE(sequence);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("msg"), encodedSequence],
    WORMHOLE_GATEWAY_PROGRAM_ID
  )[0];
}

function getGatewayInfoPDA(targetChain: number): PublicKey {
  const encodedChain = Buffer.alloc(2);
  encodedChain.writeUInt16LE(targetChain);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("gateway-info"), encodedChain],
    WORMHOLE_GATEWAY_PROGRAM_ID
  )[0];
}

type SendTbtcArgs = {
  amount: BN;
  recipientChain: number;
  recipient: Uint8Array;
  nonce: number;
};

type SendTbtcWrappedAccounts = {
  custodian: PublicKey;
  wrappedTbtcToken: PublicKey;
  wrappedTbtcMint: PublicKey;
  tbtcMint: PublicKey;
  senderToken: PublicKey;
  sender: PublicKey;
  tokenBridgeConfig: PublicKey;
  tokenBridgeWrappedAsset: PublicKey;
  tokenBridgeTransferAuthority: PublicKey;
  coreBridgeData: PublicKey;
  coreMessage: PublicKey;
  tokenBridgeCoreEmitter: PublicKey;
  coreEmitterSequence: PublicKey;
  coreFeeCollector: PublicKey;
  clock: PublicKey;
  rent: PublicKey;
  tokenBridgeProgram: PublicKey;
  coreBridgeProgram: PublicKey;
};

type SendTbtcGatewayAccounts = {
  custodian: PublicKey;
  gatewayInfo: PublicKey;
  wrappedTbtcToken: PublicKey;
  wrappedTbtcMint: PublicKey;
  tbtcMint: PublicKey;
  senderToken: PublicKey;
  sender: PublicKey;
  tokenBridgeConfig: PublicKey;
  tokenBridgeWrappedAsset: PublicKey;
  tokenBridgeTransferAuthority: PublicKey;
  coreBridgeData: PublicKey;
  coreMessage: PublicKey;
  tokenBridgeCoreEmitter: PublicKey;
  coreEmitterSequence: PublicKey;
  coreFeeCollector: PublicKey;
  clock: PublicKey;
  tokenBridgeSender: PublicKey;
  rent: PublicKey;
  tokenBridgeProgram: PublicKey;
  coreBridgeProgram: PublicKey;
};

 * // will off board from Solana to L1 (Ethereum)
function sendTbtcWrapped(
  program: Program<typeof WormholeGatewayIdl>,
  args: SendTbtcArgs,
  accounts: SendTbtcWrappedAccounts
) {
  const tx = program.methods
    .sendTbtcWrapped({
      ...args,
      arbiterFee: new BN(0),
    })
    .accounts(accounts)
    .transaction();
  return tx;
}

 //* Send tBtc beween gateways allow burn and mint of tBtc
function sendTbtcGateway(
  program: Program<typeof WormholeGatewayIdl>,
  args: SendTbtcArgs,
  accounts: SendTbtcGatewayAccounts
) {
  const tx = program.methods
    .sendTbtcGateway(args)
    .accounts(accounts)
    .transaction();
  return tx;
}

export function newThresholdWormholeGateway(
  connection: Connection,
  wallet: SolanaWallet
) {
  const provider = newAnchorProvider(connection, wallet);
  const program = new Program<typeof WormholeGatewayIdl>(
    WormholeGatewayIdl,
    WORMHOLE_GATEWAY_PROGRAM_ID,
    provider
  );

  const receiveTbtc = async (
    signedVAA: SignedVaa,
    payer: PublicKeyInitData
  ): Promise<Transaction> => {
    const parsed = parseTokenTransferVaa(signedVAA);
    const recipient = new PublicKey(payer);
    const custodian = getCustodianPDA();
    const custodianData = await program.account.custodian.fetch(custodian);
    const tbtcMint = new PublicKey(custodianData.tbtcMint as string);
    const wrappedTbtcToken = new PublicKey(
      custodianData.wrappedTbtcToken as string
    );
    const wrappedTbtcMint = new PublicKey(
      custodianData.wrappedTbtcMint as string
    );
    const recipientTokenKey = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      tbtcMint,
      recipient
    );
    const transaction = new Transaction();
    const recipientToken = await connection.getAccountInfo(recipientTokenKey);
    console.log(recipientToken, recipientTokenKey.toBase58());
    if (!recipientToken) {
      const recipientTokenAtaIx = Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        tbtcMint,
        recipientTokenKey,
        recipient, // owner
        recipient // payer
      );
      transaction.add(recipientTokenAtaIx);
    }
    const tokenBridgeWrappedAsset = tokenBridge.deriveWrappedMetaKey(
      TOKEN_BRIDGE_PROGRAM_ID,
      wrappedTbtcMint
    );
    const recipientWrappedToken = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      wrappedTbtcMint,
      recipient
    );
    const accounts = {
      payer: new PublicKey(wallet.getAddress()!),
      custodian,
      postedVaa: coreBridge.derivePostedVaaKey(
        CORE_BRIDGE_PROGRAM_ID,
        parsed.hash
      ),
      tokenBridgeClaim: coreBridge.deriveClaimKey(
        TOKEN_BRIDGE_PROGRAM_ID,
        parsed.emitterAddress,
        parsed.emitterChain,
        parsed.sequence
      ),
      wrappedTbtcToken,
      wrappedTbtcMint,
      tbtcMint,
      recipientToken: recipientTokenKey,
      recipient,
      recipientWrappedToken,
      tbtcConfig: getConfigPDA(),
      tbtcMinterInfo: getMinterInfoPDA(custodian),
      tokenBridgeConfig: tokenBridge.deriveTokenBridgeConfigKey(
        TOKEN_BRIDGE_PROGRAM_ID
      ),
      tokenBridgeRegisteredEmitter: tokenBridge.deriveEndpointKey(
        TOKEN_BRIDGE_PROGRAM_ID,
        parsed.emitterChain,
        parsed.emitterAddress
      ),
      tokenBridgeWrappedAsset,
      tokenBridgeMintAuthority: tokenBridge.deriveMintAuthorityKey(
        TOKEN_BRIDGE_PROGRAM_ID
      ),
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

  const sendTbtc = async (
    amount: bigint,
    recipientChain: ChainId,
    recipientAddress: Uint8Array,
    sender: string,
    senderToken: string
  ): Promise<Transaction> => {
    const custodian = getCustodianPDA();
    const custodianData = await program.account.custodian.fetch(custodian);
    const tbtcMint = new PublicKey(custodianData.tbtcMint as string);
    const wrappedTbtcToken = new PublicKey(
      custodianData.wrappedTbtcToken as string
    );
    const wrappedTbtcMint = new PublicKey(
      custodianData.wrappedTbtcMint as string
    );
    const tokenBridgeWrappedAsset = tokenBridge.deriveWrappedMetaKey(
      TOKEN_BRIDGE_PROGRAM_ID,
      wrappedTbtcMint
    );
    const tokenBridgeConfig = tokenBridge.deriveTokenBridgeConfigKey(
      TOKEN_BRIDGE_PROGRAM_ID
    );
    const tokenBridgeTransferAuthority = tokenBridge.deriveAuthoritySignerKey(
      TOKEN_BRIDGE_PROGRAM_ID
    );
    const coreFeeCollector = coreBridge.deriveFeeCollectorKey(
      CORE_BRIDGE_PROGRAM_ID
    );
    const sequence = await getTokenBridgeSequence(connection);
    const coreMessage = getCoreMessagePDA(sequence);
    const coreBridgeData = coreBridge.deriveWormholeBridgeDataKey(
      CORE_BRIDGE_PROGRAM_ID
    );
    const tokenBridgeCoreEmitter = getTokenBridgeCoreEmitter();
    const coreEmitterSequence = coreBridge.deriveEmitterSequenceKey(
      tokenBridgeCoreEmitter,
      CORE_BRIDGE_PROGRAM_ID
    );
    const gatewayInfo = getGatewayInfoPDA(recipientChain);
    const tokenBridgeSender = tokenBridge.deriveSenderAccountKey(
      WORMHOLE_GATEWAY_PROGRAM_ID
    );
    const args = {
      amount: new BN(amount.toString()),
      recipientChain,
      recipient: recipientAddress,
      nonce: 0,
    };
    const associatedTokenAccount = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      new PublicKey(senderToken),
      new PublicKey(wallet.getAddress()!)
    );
    if (recipientChain === CHAIN_ID_ETH) {
      const wrappedAccounts = {
        custodian,
        wrappedTbtcToken,
        wrappedTbtcMint,
        tbtcMint,
        senderToken: associatedTokenAccount, // associated token account
        sender: new PublicKey(wallet.getAddress()!), //sender, associated token account owner,
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
      return sendTbtcWrapped(program, args, wrappedAccounts);
    } else {
      const gatewayAccounts = {
        custodian,
        gatewayInfo,
        wrappedTbtcToken,
        wrappedTbtcMint,
        tbtcMint,
        senderToken: associatedTokenAccount, // associated token account
        sender: new PublicKey(wallet.getAddress()!), //sender, associated token account owner,
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
      return sendTbtcGateway(program, args, gatewayAccounts);
    }
  };
  return {
    sendTbtc,
    receiveTbtc,
  };
}
*/
