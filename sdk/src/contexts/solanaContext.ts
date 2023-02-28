import { createNonce, getForeignAssetSolana } from '@certusone/wormhole-sdk';
import {
  getTransferWrappedAccounts,
  getTransferNativeAccounts,
  createApproveAuthoritySignerInstruction,
} from '@certusone/wormhole-sdk/lib/cjs/solana/tokenBridge';
import { TokenBridge } from '@certusone/wormhole-sdk/lib/cjs/solana/types/tokenBridge';
import {
  getPostedMessage,
  deriveWormholeEmitterKey,
  getClaim,
} from '@certusone/wormhole-sdk/lib/cjs/solana/wormhole';
import {
  parseTokenTransferPayload,
  parseVaa,
} from '../vaa';
import {
  ACCOUNT_SIZE,
  createCloseAccountInstruction,
  createInitializeAccountInstruction,
  getMinimumBalanceForRentExemptAccount,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  clusterApiUrl,
  Commitment,
  Connection,
  Keypair,
  PublicKey,
  PublicKeyInitData,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { Program } from '@project-serum/anchor';
import { BigNumber, BigNumberish, constants } from 'ethers';
import { arrayify, zeroPad, hexlify } from 'ethers/lib/utils';
import { Wallet } from '@xlabs-libs/wallet-aggregator-core';

import { BridgeAbstract } from './abstracts';
import { TokenId, ChainName, ChainId, NATIVE, ParsedMessage } from '../types';
import { SolContracts } from '../contracts/solContracts';
import { WormholeContext } from '../wormhole';

const SOLANA_SEQ_LOG = 'Program log: Sequence: ';

export function createTransferNativeInstruction(
  tokenBridgeProgram: Program<TokenBridge>,
  wormholeProgramId: PublicKeyInitData,
  payer: PublicKeyInitData,
  message: PublicKeyInitData,
  from: PublicKeyInitData,
  mint: PublicKeyInitData,
  nonce: number,
  amount: bigint,
  fee: bigint,
  targetAddress: Buffer | Uint8Array,
  targetChain: number,
): TransactionInstruction {
  const methods = tokenBridgeProgram.methods.transferNative(
    nonce,
    amount as any,
    fee as any,
    Buffer.from(targetAddress) as any,
    targetChain,
  );
  // @ts-ignore
  return methods._ixFn(...methods._args, {
    accounts: getTransferNativeAccounts(
      tokenBridgeProgram.programId,
      wormholeProgramId,
      payer,
      message,
      from,
      mint,
    ) as any,
    signers: undefined,
    remainingAccounts: undefined,
    preInstructions: undefined,
    postInstructions: undefined,
  });
}

export function createTransferWrappedInstruction(
  tokenBridgeProgram: Program<TokenBridge>,
  wormholeProgramId: PublicKeyInitData,
  payer: PublicKeyInitData,
  message: PublicKeyInitData,
  from: PublicKeyInitData,
  fromOwner: PublicKeyInitData,
  tokenChain: number,
  tokenAddress: Buffer | Uint8Array,
  nonce: number,
  amount: bigint,
  fee: bigint,
  targetAddress: Buffer | Uint8Array,
  targetChain: number,
): TransactionInstruction {
  const methods = tokenBridgeProgram.methods.transferWrapped(
    nonce,
    amount as any,
    fee as any,
    Buffer.from(targetAddress) as any,
    targetChain,
  );

  // @ts-ignore
  return methods._ixFn(...methods._args, {
    accounts: getTransferWrappedAccounts(
      tokenBridgeProgram.programId,
      wormholeProgramId,
      payer,
      message,
      from,
      fromOwner,
      tokenChain,
      tokenAddress,
    ) as any,
    signers: undefined,
    remainingAccounts: undefined,
    preInstructions: undefined,
    postInstructions: undefined,
  });
}

export class SolanaContext<T extends WormholeContext> extends BridgeAbstract {
  protected contracts: SolContracts<T>;
  readonly context: T;
  connection: Connection | undefined;
  wallet: Wallet | undefined;

  constructor(context: T) {
    super();
    this.context = context;
    const tag = context.environment === 'MAINNET' ? 'mainnet-beta' : 'devnet';
    this.connection = new Connection(clusterApiUrl(tag));
    this.contracts = new SolContracts(context);
  }

  async setConnection(connection: Connection) {
    this.connection = connection;
  }

  async fetchTokenDecimals(
    tokenAddr: string,
    chain?: ChainName | ChainId,
  ): Promise<number> {
    if (!this.connection) throw new Error('no connection');
    let mint = await this.connection.getParsedAccountInfo(
      new PublicKey(tokenAddr),
    );
    if (!mint) throw new Error('could not fetch token details');
    const { decimals } = (mint as any).value.data.parsed.info;
    return decimals;
  }

  async getNativeBalance(
    walletAddress: string,
    chain: ChainName | ChainId,
  ): Promise<BigNumber> {
    if (!this.connection) throw new Error('no connection');
    const balance = await this.connection.getBalance(
      new PublicKey(walletAddress),
    );
    return BigNumber.from(balance);
  }

  async getTokenBalance(
    walletAddress: string,
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<BigNumber | null> {
    if (!this.connection) throw new Error('no connection');
    let address;
    try {
      address = await this.getForeignAsset(tokenId, chain);
    } catch (e) {
      return null;
    }
    if (!address || address === constants.AddressZero) return null;
    const splToken = await this.connection.getTokenAccountsByOwner(
      new PublicKey(walletAddress),
      { mint: new PublicKey(address) },
    );
    if (!splToken.value[0]) return null;
    const balance = await this.connection.getTokenAccountBalance(
      splToken.value[0].pubkey,
    );

    return BigNumber.from(balance.value.amount);
  }

  private async transferNativeSol(
    senderAddress: PublicKeyInitData,
    amount: bigint,
    recipientChain: ChainId | ChainName,
    recipientAddress: Uint8Array | Buffer,
    relayerFee?: bigint,
    payload?: Uint8Array | Buffer,
    commitment?: Commitment,
  ): Promise<Transaction> {
    if (!this.connection) throw new Error('no connection');
    const core = this.contracts.mustGetCore();
    const tokenBridge = this.contracts.mustGetBridge();
    const rentBalance = await getMinimumBalanceForRentExemptAccount(
      this.connection,
      commitment,
    );
    const payerPublicKey = new PublicKey(senderAddress);
    const ancillaryKeypair = Keypair.generate();

    //This will create a temporary account where the wSOL will be created.
    const createAncillaryAccountIx = SystemProgram.createAccount({
      fromPubkey: payerPublicKey,
      newAccountPubkey: ancillaryKeypair.publicKey,
      lamports: rentBalance, //spl token accounts need rent exemption
      space: ACCOUNT_SIZE,
      programId: TOKEN_PROGRAM_ID,
    });

    //Send in the amount of SOL which we want converted to wSOL
    const initialBalanceTransferIx = SystemProgram.transfer({
      fromPubkey: payerPublicKey,
      lamports: amount,
      toPubkey: ancillaryKeypair.publicKey,
    });
    //Initialize the account as a WSOL account, with the original payerAddress as owner
    const initAccountIx = createInitializeAccountInstruction(
      ancillaryKeypair.publicKey,
      NATIVE_MINT,
      payerPublicKey,
    );

    //Normal approve & transfer instructions, except that the wSOL is sent from the ancillary account.
    const approvalIx = createApproveAuthoritySignerInstruction(
      tokenBridge.programId,
      ancillaryKeypair.publicKey,
      payerPublicKey,
      amount,
    );

    const message = Keypair.generate();
    const nonce = createNonce().readUInt32LE(0);
    const tokenBridgeTransferIx = createTransferNativeInstruction(
      tokenBridge,
      core.programId,
      senderAddress,
      message.publicKey,
      ancillaryKeypair.publicKey,
      NATIVE_MINT,
      nonce,
      amount,
      relayerFee || BigInt(0),
      Buffer.from(recipientAddress),
      this.context.toChainId(recipientChain),
    );

    //Close the ancillary account for cleanup. Payer address receives any remaining funds
    const closeAccountIx = createCloseAccountInstruction(
      ancillaryKeypair.publicKey, //account to close
      payerPublicKey, //Remaining funds destination
      payerPublicKey, //authority
    );

    const { blockhash } = await this.connection.getLatestBlockhash(commitment);
    const transaction = new Transaction();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = payerPublicKey;
    transaction.add(
      createAncillaryAccountIx,
      initialBalanceTransferIx,
      initAccountIx,
      approvalIx,
      tokenBridgeTransferIx,
      closeAccountIx,
    );
    transaction.partialSign(message, ancillaryKeypair);
    return transaction;
  }

  private async transferFromSolana(
    senderAddress: string,
    amount: bigint,
    recipientChain: ChainId | ChainName,
    recipientAddress: Uint8Array | Buffer,
    fromAddress: PublicKeyInitData, // token account pubkey, owned by fromOwner address
    tokenChainId: number,
    mintAddress: Uint8Array, // token address
    fromOwnerAddress?: PublicKeyInitData,
    relayerFee?: bigint,
    payload?: Uint8Array | Buffer,
    commitment?: Commitment,
  ): Promise<Transaction> {
    if (!this.connection) throw new Error('no connection');
    const core = this.contracts.mustGetCore();
    const tokenBridge = this.contracts.mustGetBridge();

    const recipientChainId = this.context.toChainId(recipientChain);
    if (fromOwnerAddress === undefined) {
      fromOwnerAddress = senderAddress;
    }
    const nonce = createNonce().readUInt32LE(0);
    const approvalIx = createApproveAuthoritySignerInstruction(
      tokenBridge.programId,
      fromAddress,
      new PublicKey(fromOwnerAddress),
      amount,
    );
    const message = Keypair.generate();

    const tokenBridgeTransferIx = createTransferWrappedInstruction(
      tokenBridge,
      core.programId,
      senderAddress,
      message.publicKey,
      fromAddress,
      fromOwnerAddress,
      tokenChainId,
      mintAddress,
      nonce,
      amount,
      relayerFee || BigInt(0),
      recipientAddress,
      recipientChainId,
    );
    const transaction = new Transaction().add(
      approvalIx,
      tokenBridgeTransferIx,
    );
    const { blockhash } = await this.connection.getLatestBlockhash(commitment);
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = new PublicKey(senderAddress);
    transaction.partialSign(message);
    return transaction;
  }

  async send(
    token: TokenId | typeof NATIVE,
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    relayerFee?: string,
    commitment?: Commitment,
  ): Promise<Transaction> {
    if (!this.connection) throw new Error('no connection');
    const destContext = this.context.getContext(recipientChain);
    const formattedRecipient = arrayify(
      destContext.formatAddress(recipientAddress),
    );
    const relayerFeeBN = relayerFee ? BigInt(relayerFee) : undefined;
    const amountBN = BigNumber.from(amount).toBigInt();

    if (token === NATIVE) {
      return await this.transferNativeSol(
        senderAddress,
        amountBN,
        recipientChain,
        formattedRecipient,
        relayerFeeBN,
        undefined,
        'finalized',
      );
    } else {
      const destTokenAddr = await destContext.getForeignAsset(
        token,
        recipientChain,
      );
      const formattedTokenAddr = arrayify(
        destContext.formatAddress(destTokenAddr),
      );
      const solTokenAddr = await this.getForeignAsset(token, 'solana');
      const splToken = await this.connection.getTokenAccountsByOwner(
        new PublicKey(senderAddress),
        { mint: new PublicKey(solTokenAddr) },
      );
      if (!splToken || !splToken.value[0])
        throw new Error('account does not have any token balance');

      return await this.transferFromSolana(
        senderAddress,
        amountBN,
        recipientChain,
        formattedRecipient,
        splToken.value[0].pubkey,
        this.context.resolveDomain(token.chain),
        formattedTokenAddr,
        undefined,
        relayerFeeBN,
        undefined,
        'finalized',
      );
    }
  }

  async sendWithPayload(
    token: TokenId | typeof NATIVE,
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    payload: Uint8Array | Buffer,
    commitment?: Commitment,
  ): Promise<Transaction> {
    if (!this.connection) throw new Error('no connection');
    const amountBN = BigInt(amount);
    const destContext = this.context.getContext(recipientChain);
    const formattedRecipient = arrayify(
      destContext.formatAddress(recipientAddress),
    );

    if (token === NATIVE) {
      return await this.transferNativeSol(
        senderAddress,
        amountBN,
        recipientChain,
        formattedRecipient,
        undefined,
        payload,
        'finalized',
      );
    } else {
      const formattedTokenAddr = arrayify(
        destContext.formatAddress(token.address),
      );
      const solTokenAddr = await this.getForeignAsset(token, 'solana');
      console.log('solana token addr', solTokenAddr);
      const splToken = await this.connection.getTokenAccountsByOwner(
        new PublicKey(senderAddress),
        { mint: new PublicKey(solTokenAddr) },
      );
      if (!splToken || !splToken.value[0])
        throw new Error('account does not have any token balance');

      return await this.transferFromSolana(
        senderAddress,
        amountBN,
        recipientChain,
        formattedRecipient,
        splToken.value[0].pubkey,
        this.context.resolveDomain(token.chain),
        formattedTokenAddr,
        undefined,
        undefined,
        payload,
        'finalized',
      );
    }
  }

  formatAddress(address: PublicKeyInitData): string {
    const addr =
      typeof address === 'string' && address.startsWith('0x')
        ? arrayify(address)
        : address;
    return hexlify(zeroPad(new PublicKey(addr).toBytes(), 32));
  }

  parseAddress(address: string): string {
    const addr =
      typeof address === 'string' && address.startsWith('0x')
        ? arrayify(address)
        : address;
    return new PublicKey(addr).toString();
  }

  async getForeignAsset(tokenId: TokenId, chain: ChainName | ChainId) {
    if (!this.connection) throw new Error('no connection');

    const chainId = this.context.toChainId(tokenId.chain);
    const toChainId = this.context.toChainId(chain);
    if (toChainId === chainId) return tokenId.address;

    const contracts = this.context.mustGetContracts(chain);
    if (!contracts.token_bridge) throw new Error('contracts not found');

    const tokenContext = this.context.getContext(tokenId.chain);
    const formattedAddr = tokenContext.formatAddress(tokenId.address);
    const addr = await getForeignAssetSolana(
      this.connection,
      contracts.token_bridge,
      chainId,
      arrayify(formattedAddr),
    );
    if (!addr) throw new Error('token not found');
    return addr;
  }

  async parseMessageFromTx(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<ParsedMessage[]> {
    if (!this.connection) throw new Error('no connection');
    const contracts = this.contracts.mustGetContracts('solana');
    if (!contracts.core || !contracts.token_bridge)
      throw new Error('contracts not found');
    const response = await this.connection.getTransaction(tx);
    const parsedResponse = await this.connection.getParsedTransaction(tx);
    console.log('parsed', parsedResponse);
    if (!response || !response.meta?.innerInstructions![0].instructions)
      throw new Error('transaction not found');
    const instructions = response.meta?.innerInstructions![0].instructions;
    const accounts = response.transaction.message.accountKeys;
    // find the instruction where the programId equals the Wormhole ProgramId and the emitter equals the Token Bridge
    const bridgeInstructions = instructions.filter((i) => {
      const programId = accounts[i.programIdIndex].toString();
      const emitterId = accounts[i.accounts[2]];
      const wormholeCore = contracts.core;
      const tokenBridge = deriveWormholeEmitterKey(contracts.token_bridge!);
      return programId === wormholeCore && emitterId.equals(tokenBridge);
    });
    const { message } = await getPostedMessage(
      this.connection,
      accounts[bridgeInstructions[0].accounts[1]],
    );

    const parsedInstr = parsedResponse?.meta?.innerInstructions![0].instructions;
    const gasFee = !parsedInstr ? 0 : parsedInstr.reduce((acc, c: any) => {
      if (!c.parsed || !c.parsed.info || !c.parsed.info.lamports) return acc;
      return acc + c.parsed.info.lamports;
    }, 0);

    // parse message payload
    const parsed = parseTokenTransferPayload(message.payload);
    console.log(parsed);

    // get sequence
    const sequence = response.meta?.logMessages
      ?.filter((msg) => msg.startsWith(SOLANA_SEQ_LOG))?.[0]
      ?.replace(SOLANA_SEQ_LOG, '');
    if (!sequence) {
      throw new Error('sequence not found');
    }

    // format response
    const tokenContext = this.context.getContext(parsed.tokenChain as ChainId);
    const destContext = this.context.getContext(parsed.toChain as ChainId);

    const parsedMessage: ParsedMessage = {
      sendTx: tx,
      sender: accounts[0].toString(),
      amount: BigNumber.from(parsed.amount),
      payloadID: parsed.payloadType,
      recipient: destContext.parseAddress(hexlify(parsed.to)),
      toChain: this.context.toChainName(parsed.toChain),
      fromChain: this.context.toChainName(chain),
      tokenAddress: tokenContext.parseAddress(hexlify(parsed.tokenAddress)),
      tokenChain: this.context.toChainName(parsed.tokenChain),
      sequence: BigNumber.from(sequence),
      gasFee: BigNumber.from(gasFee),
    };
    return [parsedMessage];
  }

  // TODO:
  async approve(
    chain: ChainName | ChainId,
    contractAddress: string,
    token: string,
    amount?: BigNumberish,
    overrides?: any,
  ): Promise<Transaction | void> {
    console.log(
      'not implemented',
      chain,
      contractAddress,
      token,
      amount,
      overrides,
    );
  }

  // TODO:
  async redeem(
    destChain: ChainName | ChainId,
    signedVAA: Uint8Array,
    overrides: any,
  ): Promise<any> {
    console.log('not implemented', destChain, signedVAA);
  }

  async isTransferCompleted(
    destChain: ChainName | ChainId,
    signedVaaHash: string,
  ): Promise<boolean> {
    if (!this.connection) throw new Error('no connection');
    const parsed = parseVaa(arrayify(signedVaaHash));
    const tokenBridge = this.contracts.mustGetBridge(destChain);
    return getClaim(
      this.connection,
      tokenBridge.programId,
      parsed.emitterAddress,
      parsed.emitterChain,
      parsed.sequence,
      'finalized',
    ).catch((e) => false);
  }

  getTxIdFromReceipt(receipt: Transaction) {
    return receipt.signatures[0].publicKey.toString();
  }
}
