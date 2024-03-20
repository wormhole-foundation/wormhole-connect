import { CHAIN_ID_SOLANA } from '@certusone/wormhole-sdk';
import { BN, Program, utils } from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import {
  AccountMeta,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  addComputeBudget,
  ChainId,
  ChainName,
  SolanaContext,
  TokenId,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber, utils as ethUtils } from 'ethers';
import { PayloadType, solanaContext, toChainId, toChainName } from 'utils/sdk';
import { getNativeVersionOfToken } from '../../../store/transferInput';
import { getTokenById, getTokenDecimals } from '../../../utils';
import {
  ManualCCTPMessage,
  SignedMessage,
  isSignedCCTPMessage,
} from '../../types';
import {
  MessageTransmitter,
  IDL as MessageTransmitterIdl,
} from '../idl/MessageTransmitter';
import {
  TokenMessengerMinter as TokenMessenger,
  IDL as TokenMessengerIdl,
} from '../idl/TokenMessenger';
import ManualCCTP from './abstract';
import { getChainNameCCTP, getDomainCCTP } from '../utils/chains';
import { CircleBridge } from '@wormhole-foundation/sdk-definitions';
import { hexlify } from 'ethers/lib/utils';
import config from 'config';

const CCTP_NONCE_OFFSET = 12;
const MAX_NONCES_PER_ACCOUNT = 6400n;

interface FindProgramAddressResponse {
  publicKey: PublicKey;
  bump: number;
}

const findProgramAddress = (
  label: string,
  programId: PublicKey,
  extraSeeds?: (string | number[] | Buffer | PublicKey)[],
): FindProgramAddressResponse => {
  const seeds = [Buffer.from(utils.bytes.utf8.encode(label))];
  if (extraSeeds) {
    for (const extraSeed of extraSeeds) {
      if (typeof extraSeed === 'string') {
        seeds.push(Buffer.from(utils.bytes.utf8.encode(extraSeed)));
      } else if (Array.isArray(extraSeed)) {
        seeds.push(Buffer.from(extraSeed as number[]));
      } else if (Buffer.isBuffer(extraSeed)) {
        seeds.push(extraSeed);
      } else {
        seeds.push(extraSeed.toBuffer());
      }
    }
  }
  const res = PublicKey.findProgramAddressSync(seeds, programId);
  return { publicKey: res[0], bump: res[1] };
};

function getMessageTransmitter(): Program<MessageTransmitter> {
  const context = config.wh.getContext(
    CHAIN_ID_SOLANA,
  ) as SolanaContext<WormholeContext>;
  const connection = context.connection;
  const contracts =
    context.contracts.mustGetContracts(CHAIN_ID_SOLANA).cctpContracts;
  if (!contracts?.cctpMessageTransmitter || !contracts?.cctpTokenMessenger) {
    throw new Error('No CCTP on Solana');
  }
  return new Program<MessageTransmitter>(
    MessageTransmitterIdl,
    contracts.cctpMessageTransmitter,
    connection ? { connection } : undefined,
  );
}

function getTokenMessenger(): Program<TokenMessenger> {
  const context = config.wh.getContext(
    CHAIN_ID_SOLANA,
  ) as SolanaContext<WormholeContext>;
  const connection = context.connection;
  const contracts =
    context.contracts.mustGetContracts(CHAIN_ID_SOLANA).cctpContracts;
  if (!contracts?.cctpMessageTransmitter || !contracts?.cctpTokenMessenger) {
    throw new Error('No CCTP on Solana');
  }
  return new Program<TokenMessenger>(
    TokenMessengerIdl,
    contracts.cctpTokenMessenger,
    connection ? { connection } : undefined,
  );
}

export class ManualCCTPSolanaImpl implements ManualCCTP<Transaction> {
  async send(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
  ): Promise<Transaction> {
    const fromChainId = toChainId(sendingChain);
    const decimals = getTokenDecimals(fromChainId, token);
    const parsedAmt = ethUtils.parseUnits(amount, decimals);

    if (token === 'native')
      throw new Error('Native not supported by cctp routes');

    const recipientChainName = toChainName(recipientChain);
    const destinationDomain = config.chains[recipientChainName]?.cctpDomain;
    if (destinationDomain === undefined)
      throw new Error(`No CCTP on ${recipientChainName}`);

    const messageTransmitterProgram = getMessageTransmitter();
    const tokenMessengerMinterProgram = getTokenMessenger();

    const tokenMint = new PublicKey(token.address);

    // Find pdas
    const messageTransmitterAccount = findProgramAddress(
      'message_transmitter',
      messageTransmitterProgram.programId,
    );
    const tokenMessenger = findProgramAddress(
      'token_messenger',
      tokenMessengerMinterProgram.programId,
    );
    const tokenMinter = findProgramAddress(
      'token_minter',
      tokenMessengerMinterProgram.programId,
    );
    const localToken = findProgramAddress(
      'local_token',
      tokenMessengerMinterProgram.programId,
      [tokenMint],
    );
    const remoteTokenMessengerKey = findProgramAddress(
      'remote_token_messenger',
      tokenMessengerMinterProgram.programId,
      [destinationDomain.toString()],
    );
    const authorityPda = findProgramAddress(
      'sender_authority',
      tokenMessengerMinterProgram.programId,
    );
    const eventAuthority = findProgramAddress(
      '__event_authority',
      tokenMessengerMinterProgram.programId,
    );

    const associatedTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      new PublicKey(senderAddress),
    );

    const destContext = config.wh.getContext(recipientChain);
    const recipient = destContext.formatAddress(recipientAddress);
    const messageSentKeypair = Keypair.generate();

    const tx = await tokenMessengerMinterProgram.methods
      .depositForBurn({
        amount: new BN(parsedAmt.toString()),
        destinationDomain,
        mintRecipient: new PublicKey(recipient),
      })
      .accounts({
        owner: senderAddress,
        eventRentPayer: senderAddress,
        senderAuthorityPda: authorityPda.publicKey,
        burnTokenAccount: associatedTokenAccount,
        messageTransmitter: messageTransmitterAccount.publicKey,
        tokenMessenger: tokenMessenger.publicKey,
        remoteTokenMessenger: remoteTokenMessengerKey.publicKey,
        tokenMinter: tokenMinter.publicKey,
        localToken: localToken.publicKey,
        burnTokenMint: tokenMint,
        messageSentEventData: messageSentKeypair.publicKey,
        messageTransmitterProgram: messageTransmitterProgram.programId,
        tokenMessengerMinterProgram: tokenMessengerMinterProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        eventAuthority: eventAuthority.publicKey,
        program: tokenMessengerMinterProgram.programId,
      })
      .transaction();

    const connection = solanaContext().connection!;
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = new PublicKey(senderAddress);
    await addComputeBudget(connection, tx);
    tx.partialSign(messageSentKeypair);
    return tx;
  }

  async redeem(
    destChain: ChainName | ChainId,
    message: SignedMessage,
    payer: string,
  ): Promise<Transaction> {
    if (!isSignedCCTPMessage(message)) {
      throw new Error('Signed message is not for CCTP');
    }
    const messageTransmitterProgram = getMessageTransmitter();
    const tokenMessengerMinterProgram = getTokenMessenger();

    const fromContext = config.wh.getContext(message.fromChain);

    const messageBytes = Buffer.from(message.message.replace('0x', ''), 'hex');
    const attestationBytes = Buffer.from(
      message.attestation.replace('0x', ''),
      'hex',
    );
    const nonce = messageBytes.readBigInt64BE(CCTP_NONCE_OFFSET);

    const remoteDomain = getDomainCCTP(message.fromChain);
    const tokenKey = getNativeVersionOfToken('USDC', 'solana');
    const tokenConfig = config.tokens[tokenKey];
    if (!tokenConfig || !tokenConfig.tokenId)
      throw new Error('Invalid USDC token');
    const solanaUsdcAddress = new PublicKey(tokenConfig.tokenId.address);
    const sourceUsdcAddress = new PublicKey(
      fromContext.formatAddress(message.tokenId.address),
    );

    const payerPubkey = new PublicKey(payer || message.recipient);
    const userTokenAccount = await getAssociatedTokenAddress(
      solanaUsdcAddress,
      new PublicKey(message.recipient),
    );

    // Find pdas
    const messageTransmitterAccount = findProgramAddress(
      'message_transmitter',
      messageTransmitterProgram.programId,
    );
    const tokenMessenger = findProgramAddress(
      'token_messenger',
      tokenMessengerMinterProgram.programId,
    );
    const tokenMinter = findProgramAddress(
      'token_minter',
      tokenMessengerMinterProgram.programId,
    );
    const localToken = findProgramAddress(
      'local_token',
      tokenMessengerMinterProgram.programId,
      [solanaUsdcAddress],
    );
    const remoteTokenMessengerKey = findProgramAddress(
      'remote_token_messenger',
      tokenMessengerMinterProgram.programId,
      [remoteDomain.toString()],
    );
    const tokenPair = findProgramAddress(
      'token_pair',
      tokenMessengerMinterProgram.programId,
      [remoteDomain.toString(), sourceUsdcAddress],
    );
    const custodyTokenAccount = findProgramAddress(
      'custody',
      tokenMessengerMinterProgram.programId,
      [solanaUsdcAddress],
    );
    const authorityPda = findProgramAddress(
      'message_transmitter_authority',
      messageTransmitterProgram.programId,
      [tokenMessengerMinterProgram.programId],
    ).publicKey;
    const eventAuthority = findProgramAddress(
      '__event_authority',
      messageTransmitterProgram.programId,
    ).publicKey;
    const tokenMessengerEventAuthority = findProgramAddress(
      '__event_authority',
      tokenMessengerMinterProgram.programId,
    );

    // Calculate the nonce PDA.
    const firstNonce =
      ((nonce - 1n) / MAX_NONCES_PER_ACCOUNT) * MAX_NONCES_PER_ACCOUNT + 1n;
    const usedNonces = findProgramAddress(
      'used_nonces',
      messageTransmitterProgram.programId,
      [remoteDomain.toString(), firstNonce.toString()],
    ).publicKey;

    // Build the accountMetas list. These are passed as remainingAccounts for the TokenMessengerMinter CPI
    const accountMetas: AccountMeta[] = [];
    accountMetas.push({
      isSigner: false,
      isWritable: false,
      pubkey: tokenMessenger.publicKey,
    });
    accountMetas.push({
      isSigner: false,
      isWritable: false,
      pubkey: remoteTokenMessengerKey.publicKey,
    });
    accountMetas.push({
      isSigner: false,
      isWritable: true,
      pubkey: tokenMinter.publicKey,
    });
    accountMetas.push({
      isSigner: false,
      isWritable: true,
      pubkey: localToken.publicKey,
    });
    accountMetas.push({
      isSigner: false,
      isWritable: false,
      pubkey: tokenPair.publicKey,
    });
    accountMetas.push({
      isSigner: false,
      isWritable: true,
      pubkey: userTokenAccount,
    });
    accountMetas.push({
      isSigner: false,
      isWritable: true,
      pubkey: custodyTokenAccount.publicKey,
    });
    accountMetas.push({
      isSigner: false,
      isWritable: false,
      pubkey: TOKEN_PROGRAM_ID,
    });
    accountMetas.push({
      isSigner: false,
      isWritable: false,
      pubkey: tokenMessengerEventAuthority.publicKey,
    });
    accountMetas.push({
      isSigner: false,
      isWritable: false,
      pubkey: tokenMessengerMinterProgram.programId,
    });

    const tx = await messageTransmitterProgram.methods
      .receiveMessage({
        message: messageBytes,
        attestation: attestationBytes,
      })
      .accounts({
        payer: payerPubkey,
        caller: payerPubkey,
        authorityPda,
        messageTransmitter: messageTransmitterAccount.publicKey,
        usedNonces,
        receiver: tokenMessengerMinterProgram.programId,
        systemProgram: SystemProgram.programId,
        eventAuthority,
        program: messageTransmitterProgram.programId,
      })
      // Add remainingAccounts needed for TokenMessengerMinter CPI
      .remainingAccounts(accountMetas)
      .transaction();
    tx.feePayer = payerPubkey;
    await addComputeBudget(solanaContext().connection!, tx);
    return tx;
  }

  async getMessage(
    id: string,
    chain: ChainName | ChainId,
  ): Promise<ManualCCTPMessage> {
    const context = solanaContext();
    const connection = context.connection;
    if (!connection) throw new Error('No connection');

    const tx = await connection.getParsedTransaction(id);
    if (!tx) throw new Error('Transaction not found');

    const accounts = tx.transaction.message.accountKeys;
    const msgSentAccount = accounts[1]?.pubkey;
    if (!msgSentAccount) throw new Error('No message sent account');
    const data = await connection.getAccountInfo(msgSentAccount);
    if (!data) throw new Error('No message sent data');
    const circleMsgArray = new Uint8Array(data.data.slice(44));
    const [circleMsg] = CircleBridge.deserialize(circleMsgArray);
    const tokenAddress = await context.parseAssetAddress(
      circleMsg.payload.burnToken.toString(),
    );
    const tokenId: TokenId = { address: tokenAddress, chain: 'solana' };
    const token = getTokenById(tokenId);
    const decimals = await config.wh.fetchTokenDecimals(tokenId, 'solana');
    const toChain = getChainNameCCTP(circleMsg.destinationDomain);
    const destContext = config.wh.getContext(toChain);
    const recipient = destContext.parseAddress(
      circleMsg.payload.mintRecipient.toString(),
    );

    return {
      sendTx: id,
      sender: await context.parseAddress(
        circleMsg.payload.messageSender.toString(),
      ),
      amount: circleMsg.payload.amount.toString(),
      payloadID: PayloadType.Manual,
      recipient,
      toChain,
      fromChain: 'solana',
      tokenAddress,
      tokenChain: 'solana',
      tokenId,
      tokenDecimals: decimals,
      tokenKey: token?.key || '',
      receivedTokenKey: getNativeVersionOfToken('USDC', toChain),
      gasFee: tx.meta?.fee.toString(),
      block: tx.slot,
      message: hexlify(circleMsgArray),

      // manual CCTP does not use wormhole
      emitterAddress: '',
      sequence: '',
    };
  }

  async estimateSendGas(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions?: any,
  ): Promise<BigNumber> {
    const tx = await this.send(
      token,
      amount,
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
    );
    const { connection } = solanaContext();
    if (!connection) {
      return BigNumber.from(0);
    }

    // fill in required data for simulation
    tx.feePayer = new PublicKey(senderAddress);
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const estimate = await connection.getFeeForMessage(tx.compileMessage());
    if (!estimate || !estimate.value) {
      return BigNumber.from(0);
    }
    return BigNumber.from(estimate.value);
  }

  async isTransferCompleted(
    destChain: ChainName | ChainId,
    message: SignedMessage,
  ): Promise<boolean> {
    if (!isSignedCCTPMessage(message))
      throw new Error('Signed message is not for CCTP');

    const messageTransmitterProgram = getMessageTransmitter();

    const messageBytes = Buffer.from(message.message.replace('0x', ''), 'hex');
    const nonce = messageBytes.readBigInt64BE(CCTP_NONCE_OFFSET);
    const remoteDomain = getDomainCCTP(message.fromChain);

    // Calculate the nonce PDA.
    const firstNonce =
      ((nonce - 1n) / MAX_NONCES_PER_ACCOUNT) * MAX_NONCES_PER_ACCOUNT + 1n;
    const usedNoncesAddress = findProgramAddress(
      'used_nonces',
      messageTransmitterProgram.programId,
      [remoteDomain.toString(), firstNonce.toString()],
    ).publicKey;

    // usedNonces is an u64 100 elements array, where each bit acts a flag
    // to know whether a nonce has been used or not
    const { usedNonces } =
      await messageTransmitterProgram.account.usedNonces.fetch(
        usedNoncesAddress,
      );

    // get the nonce index based on the account's first nonce
    const nonceIndex = Number(nonce - firstNonce);

    // get the index of the u64 the nonce's flag is in
    const nonceElementIndex = Math.floor(nonceIndex / 64);

    // get the nonce flag index and build a bitmask
    const nonceBitIndex = nonceIndex % 64;
    const mask = new BN(1 << nonceBitIndex);

    const nonceByte = usedNonces[nonceElementIndex];
    if (!nonceByte) throw new Error('Invalid nonce byte index');
    const nonceBit = nonceByte.and(mask);
    return !nonceBit.isZero();
  }
}
