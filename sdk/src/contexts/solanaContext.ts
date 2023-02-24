import {
  createNonce,
  getForeignAssetSolana,
} from '@certusone/wormhole-sdk';
import { createReadOnlyTokenBridgeProgramInterface } from '@certusone/wormhole-sdk/lib/cjs/solana/tokenBridge/program';
import { getTransferWrappedAccounts } from '@certusone/wormhole-sdk/lib/cjs/solana/tokenBridge/instructions/transferWrapped';
import { getTransferNativeAccounts } from '@certusone/wormhole-sdk/lib/cjs/solana/tokenBridge/instructions/transferNative';
import { BridgeAbstract } from './abstracts';
import { TokenId, ChainName, ChainId, NATIVE, ParsedMessage } from '../types';
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
import { Program } from "@project-serum/anchor";
import {
  createApproveAuthoritySignerInstruction,
} from '@certusone/wormhole-sdk/lib/cjs/solana/tokenBridge';
import { BigNumber, BigNumberish, constants } from 'ethers';
import {
  arrayify,
  zeroPad,
  hexlify,
  stripZeros,
} from 'ethers/lib/utils';

import { SolContracts } from '../contracts/solContracts';
import { ChainsManager } from '../chainsManager';
import { TokenBridge } from '@certusone/wormhole-sdk/lib/cjs/solana/types/tokenBridge';

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
  targetChain: number
): TransactionInstruction {
  const methods = tokenBridgeProgram.methods.transferNative(
    nonce,
    amount as any,
    fee as any,
    Buffer.from(targetAddress) as any,
    targetChain
  );
  // @ts-ignore
  return methods._ixFn(...methods._args, {
    accounts: getTransferNativeAccounts(
      tokenBridgeProgram.programId,
      wormholeProgramId,
      payer,
      message,
      from,
      mint
    ) as any,
    signers: undefined,
    remainingAccounts: undefined,
    preInstructions: undefined,
    postInstructions: undefined,
  });
}

export function createTransferWrappedInstruction(
  tokenBridgeProgramId: PublicKeyInitData,
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
  targetChain: number
): TransactionInstruction {
  const methods = createReadOnlyTokenBridgeProgramInterface(
    tokenBridgeProgramId,
    new Connection(clusterApiUrl('devnet'))
  ).methods.transferWrapped(
    nonce,
    amount as any,
    fee as any,
    Buffer.from(targetAddress) as any,
    targetChain
  );

  // @ts-ignore
  return methods._ixFn(...methods._args, {
    accounts: getTransferWrappedAccounts(
      tokenBridgeProgramId,
      wormholeProgramId,
      payer,
      message,
      from,
      fromOwner,
      tokenChain,
      tokenAddress
    ) as any,
    signers: undefined,
    remainingAccounts: undefined,
    preInstructions: undefined,
    postInstructions: undefined,
  });
}

export class SolanaContext<T extends ChainsManager> extends BridgeAbstract {
  protected contracts: SolContracts<T>;
  readonly context: T;
  connection: Connection | undefined;

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

  async getNativeBalance(
    walletAddress: string,
    chain: ChainName | ChainId,
  ): Promise<BigNumber> {
    if (!this.connection) throw new Error('no connection');
    const balance = await this.connection.getBalance(
      new PublicKey(walletAddress),
    );
    console.log('native balance:', balance);
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

    // // get token decimals and format amount
    // let mint = await this.connection.getParsedAccountInfo(
    //   new PublicKey(address),
    // );
    // if (!mint) throw new Error('could not fetch token details');
    // const { decimals } = (mint as any).value.data.parsed.info;
    // console.log(balance.value.amount, decimals)
    // return parseUnits(balance.value.amount, decimals);
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

    const tokenBridge = this.contracts.mustGetBridge();
    //Normal approve & transfer instructions, except that the wSOL is sent from the ancillary account.
    const approvalIx = createApproveAuthoritySignerInstruction(
      tokenBridge.programId,
      ancillaryKeypair.publicKey,
      payerPublicKey,
      amount,
    );

    const message = Keypair.generate();
    const nonce = createNonce().readUInt32LE(0);
    const core = this.contracts.mustGetCore();
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

  // private async transferFromSolana(
  //   connection: Connection,
  //   coreAddress: string,
  //   tokenBridgeAddress: string,
  //   sendingChain: ChainName | ChainId,
  //   senderAddress: string,
  //   amount: bigint,
  //   recipientChain: ChainId | ChainName,
  //   recipientAddress: Uint8Array | Buffer,
  //   fromAddress: PublicKeyInitData, // token account pubkey, owned by fromOwner address
  //   mintAddress: Uint8Array, // token address
  //   fromOwnerAddress?: PublicKeyInitData,
  //   relayerFee?: bigint,
  //   payload?: Uint8Array | Buffer,
  //   commitment?: Commitment,
  // ): Promise<Transaction> {
  //   const sendingChainId = this.context.toChainId(sendingChain);
  //   const recipientChainId = this.context.toChainId(recipientChain);
  //   if (fromOwnerAddress === undefined) {
  //     fromOwnerAddress = senderAddress;
  //   }
  //   const nonce = createNonce().readUInt32LE(0);
  //   const approvalIx = createApproveAuthoritySignerInstruction(
  //     tokenBridgeAddress,
  //     fromAddress,
  //     fromOwnerAddress,
  //     amount,
  //   );
  //   const message = Keypair.generate();
  //   const isSolanaNative = sendingChainId === this.context.toChainId('solana');
  //   if (!isSolanaNative && !senderAddress) {
  //     return Promise.reject(
  //       'originAddress is required when specifying originChain',
  //     );
  //   }
  //   const tokenBridgeTransferIx = createTransferWrappedInstruction(
  //     tokenBridgeAddress,
  //     coreAddress,
  //     senderAddress,
  //     message.publicKey,
  //     fromAddress,
  //     fromOwnerAddress,
  //     recipientChainId,
  //     mintAddress,
  //     nonce,
  //     amount,
  //     relayerFee || BigInt(0),
  //     recipientAddress,
  //     recipientChainId,
  //   );
  //   const transaction = new Transaction().add(
  //     approvalIx,
  //     tokenBridgeTransferIx,
  //   );
  //   const { blockhash } = await connection.getLatestBlockhash(commitment);
  //   transaction.recentBlockhash = blockhash;
  //   transaction.feePayer = new PublicKey(senderAddress);
  //   transaction.partialSign(message);
  //   return transaction;
  // }

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
      throw new Error('TODO:')
      // const formattedTokenAddr = arrayify(destContext.formatAddress(token.address));
      // return await this.transferFromSolana(
      //   connection,
      //   contracts.core,
      //   contracts.token_bridge,
      //   sendingChain,
      //   senderAddress,
      //   amountBN,
      //   recipientChain,
      //   formattedRecipient,
      //   senderAddress,
      //   formattedTokenAddr,
      //   undefined,
      //   relayerFeeBN,
      //   undefined,
      //   'finalized',
      // );
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
      throw new Error('TODO:')
      // const formattedTokenAddr = arrayify(destContext.formatAddress(token.address));
      // return await this.transferFromSolana(
      //   connection,
      //   contracts.core,
      //   contracts.token_bridge,
      //   sendingChain,
      //   senderAddress,
      //   amountBN,
      //   recipientChain,
      //   formattedRecipient,
      //   senderAddress,
      //   formattedTokenAddr,
      //   undefined,
      //   undefined,
      //   payload,
      //   'finalized',
      // );
    }
  }

  formatAddress(address: PublicKeyInitData): string {
    return hexlify(zeroPad(new PublicKey(address).toBytes(), 32));
  }

  parseAddress(address: string): string {
    return hexlify(stripZeros(address));
  }

  async getForeignAsset(tokenId: TokenId, chain: ChainName | ChainId) {
    if (!this.connection) throw new Error('no connection');
    // const tokenBridge = this.context.mustGetBridge(chain);
    const contracts = this.context.mustGetContracts(chain);
    if (!contracts.token_bridge) throw new Error('contracts not found');
    const chainId = this.context.toChainId(tokenId.chain);
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

  // TODO:
  async parseMessageFromTx(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<ParsedMessage[]> {
    console.log('not implemented', tx, chain);
    if (!this.connection) throw new Error('no connection');
    const response = await this.connection.getTransaction(tx);
    if (!response?.meta?.innerInstructions)
      throw new Error('not a valid bridge transfer');
    console.log(response?.meta?.innerInstructions[0].instructions);
    const instructions =
      response?.meta?.innerInstructions[0].instructions.filter((i) => {
        return i.programIdIndex === 9;
      });
    console.log('I', instructions);

    // const sequence = info.meta?.logMessages
    //   ?.filter((msg) => msg.startsWith(SOLANA_SEQ_LOG))?.[0]
    //   ?.replace(SOLANA_SEQ_LOG, "");
    // if (!sequence) {
    //   throw new Error("sequence not found");
    // }
    // return sequence.toString();
    const parsedMessage: ParsedMessage = {
      sendTx: tx,
      sender: '',
      amount: BigNumber.from(0),
      payloadID: 1,
      recipient: '',
      toChain: 'solana',
      fromChain: 'solana',
      tokenAddress: '',
      tokenChain: 'solana',
      sequence: BigNumber.from(0),
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

  protected async isTransferCompleted(
    destChain: ChainName | ChainId,
    signedVaaHash: string,
  ): Promise<boolean> {
    console.log('not implemented');
    return true;
  }
}
