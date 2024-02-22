import {
  ChainId,
  ChainName,
  SolanaContext,
  TokenId,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { UnsignedNTTMessage } from 'routes/types';
import { InboundQueuedTransfer } from '../../types';
import {
  ManagerMessage,
  NTT,
  NativeTokenTransfer,
  WormholeEndpointMessage,
} from './sdk';
import { wh } from 'utils/sdk';
import { TransferWallet, signAndSendTransaction } from 'utils/wallet';
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { BN, Program } from '@coral-xyz/anchor';
import { IDL } from './abis';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { PostedMessageData } from '@certusone/wormhole-sdk/lib/esm/solana/wormhole';
import { RATE_LIMIT_DURATION } from 'routes/ntt/consts';
import { parseVaa } from '@certusone/wormhole-sdk/lib/esm';
import { utils } from 'ethers';
import { hexlify } from 'ethers/lib/utils';
import { getTokenById, getTokenDecimals } from 'utils';
import { getNativeVersionOfToken } from 'store/transferInput';

export class NTTSolana {
  constructor(readonly managerAddress: string) {}

  getConnection(): Connection {
    const context = wh.getContext('solana') as SolanaContext<WormholeContext>;
    const connection = context.connection;
    if (!connection) throw new Error('Connection not found');
    return connection;
  }

  getManager(): NTT {
    const connection = this.getConnection();
    const program = new Program(IDL as any, this.managerAddress, {
      connection,
    });
    const ntt = new NTT({ program, wormholeId: this.managerAddress });
    return ntt;
  }

  async signAndSendTransaction(
    tx: Transaction,
    walletType: TransferWallet,
  ): Promise<string> {
    const connection = this.getConnection();
    const { blockhash } = await connection.getLatestBlockhash('finalized');
    tx.recentBlockhash = blockhash;
    const txId = await signAndSendTransaction(
      'solana',
      tx,
      TransferWallet.SENDING,
      // { commitment: 'confirmed' }, // TODO: what to set to?
    );
    return txId;
  }

  async isWormholeRelayingEnabled(
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    // TODO: implement
    return false;
  }

  async quoteDeliveryPrice(destChain: ChainName | ChainId): Promise<string> {
    throw new Error('Not implemented');
  }

  async send(
    token: TokenId,
    sender: string,
    recipient: string,
    amount: bigint,
    toChain: ChainName | ChainId,
    useRelay: boolean,
  ): Promise<string> {
    const ntt = this.getManager();
    const config = await ntt.getConfig();
    const outboxItem = Keypair.generate();
    const destContext = wh.getContext(toChain);
    const payer = new PublicKey(sender);
    const tokenAccount = await getAssociatedTokenAddress(
      new PublicKey(token.address),
      payer,
    );
    const txArgs = {
      payer,
      from: tokenAccount,
      amount: new BN(amount.toString()),
      recipientChain: wh.toChainName(toChain),
      recipientAddress: destContext.formatAddress(recipient),
      fromAuthority: payer,
      outboxItem: outboxItem.publicKey,
      config,
      shouldQueue: false,
    };
    let transferIx: TransactionInstruction;
    console.log(config.mode);
    if (config.mode.locking != null) {
      transferIx = await ntt.createTransferLockInstruction(txArgs);
    } else if (config.mode.burning != null) {
      transferIx = await ntt.createTransferBurnInstruction(txArgs);
    } else {
      throw new Error('Invalid mode');
    }
    const releaseIx: TransactionInstruction =
      await ntt.createReleaseOutboundInstruction({
        payer,
        outboxItem: outboxItem.publicKey,
        revertOnDelay: !txArgs.shouldQueue,
      });
    const tx = new Transaction();
    tx.add(transferIx);
    tx.add(releaseIx);
    tx.partialSign(outboxItem);
    tx.feePayer = payer;
    const txId = await this.signAndSendTransaction(tx, TransferWallet.SENDING);
    return txId;
  }

  async receiveMessage(vaa: string, payer: string): Promise<string> {
    const ntt = this.getManager();
    const config = await ntt.getConfig();
    const vaaArray = utils.arrayify(vaa, { allowMissingPrefix: true });
    const payerPublicKey = new PublicKey(payer);
    const redeemArgs = {
      payer: payerPublicKey,
      vaa: vaaArray,
      config,
    };
    const parsedVaa = parseVaa(vaaArray);
    const managerMessage = WormholeEndpointMessage.deserialize(
      parsedVaa.payload,
      (a) => ManagerMessage.deserialize(a, NativeTokenTransfer.deserialize),
    ).managerPayload;
    const chainId = parsedVaa.emitterChain as ChainId;
    // Here we create a transaction with three instructions:
    // 1. receive wormhole messsage (vaa)
    // 1. redeem
    // 2. releaseInboundMint or releaseInboundUnlock (depending on mode)
    //
    // The first instruction verifies the VAA.
    // The second instruction places the transfer in the inbox, then the third instruction
    // releases it.
    //
    // In case the redeemed amount exceeds the remaining inbound rate limit capacity,
    // the transaction gets delayed. If this happens, the second instruction will not actually
    // be able to release the transfer yet.
    // To make sure the transaction still succeeds, we set revertOnDelay to false, which will
    // just make the second instruction a no-op in case the transfer is delayed.
    const tx = new Transaction();
    tx.add(await ntt.createReceiveWormholeMessageInstruction(redeemArgs));
    tx.add(await ntt.createRedeemInstruction(redeemArgs));
    const releaseArgs = {
      ...redeemArgs,
      managerMessage,
      recipient: new PublicKey(managerMessage.payload.recipientAddress),
      chain: chainId,
      revertOnDelay: false,
    };
    if (config.mode.locking != null) {
      tx.add(await ntt.createReleaseInboundUnlockInstruction(releaseArgs));
    } else {
      tx.add(await ntt.createReleaseInboundMintInstruction(releaseArgs));
    }
    tx.feePayer = payerPublicKey;
    const txId = await this.signAndSendTransaction(
      tx,
      TransferWallet.RECEIVING,
    );
    return txId;
  }

  async getMessage(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<UnsignedNTTMessage> {
    const connection = this.getConnection();
    const response = await connection.getParsedTransaction(tx);
    if (!response) throw new Error('Transaction not found');
    // TODO: how to get this? should be an account passed in?
    const outboxItem = new PublicKey('');
    const ntt = this.getManager();
    const wormholeMessage = ntt.wormholeMessageAccountAddress(outboxItem);
    const wormholeMessageAccount = await connection.getAccountInfo(
      wormholeMessage,
    );
    if (wormholeMessageAccount === null) {
      throw new Error('wormhole message account not found');
    }
    const messageData = PostedMessageData.deserialize(
      wormholeMessageAccount.data,
    );
    const managerMessage = WormholeEndpointMessage.deserialize(
      messageData.message.payload,
      (a) => ManagerMessage.deserialize(a, NativeTokenTransfer.deserialize),
    ).managerPayload;
    const fromChain = wh.toChainName(chain);
    const toChain = wh.toChainName(managerMessage.payload.recipientChain);
    const tokenAddress = wh.formatAddress(
      hexlify(managerMessage.payload.sourceToken),
      fromChain,
    );
    const tokenId: TokenId = {
      chain: fromChain,
      address: tokenAddress,
    };
    const token = getTokenById(tokenId);
    if (!token) {
      throw new Error(`Token ${tokenId} not found`);
    }
    return {
      sendTx: tx,
      sender: wh.formatAddress(hexlify(managerMessage.sender), fromChain),
      amount: managerMessage.payload.normalizedAmount.amount.toString(),
      payloadID: 1,
      recipient: wh.parseAddress(
        hexlify(managerMessage.payload.recipientAddress),
        chain,
      ),
      toChain,
      fromChain,
      tokenAddress: wh.formatAddress(
        hexlify(managerMessage.payload.sourceToken),
        fromChain,
      ),
      tokenChain: token.nativeChain,
      tokenId,
      tokenKey: token.key,
      tokenDecimals: getTokenDecimals(wh.toChainId(fromChain), tokenId),
      receivedTokenKey: getNativeVersionOfToken(token.symbol, toChain),
      emitterAddress: wh.formatAddress(
        hexlify(messageData.message.emitterAddress),
        fromChain,
      ),
      sequence: messageData.message.sequence.toString(),
      block: response.slot,
      gasFee: '0',
      sourceManagerAddress: this.managerAddress,
      toManagerAddress: '',
      endpointMessage: hexlify(messageData.message.payload),
      relayerFee: '',
    };
  }

  async getCurrentOutboundCapacity(): Promise<string> {
    const {
      rateLimit: { limit, capacityAtLastTx, lastTxTimestamp },
    } = await this.getManager().getOutboxRateLimit();
    return this.getCurrentCapacity(limit, capacityAtLastTx, lastTxTimestamp);
  }

  async getCurrentInboundCapacity(
    fromChain: ChainName | ChainId,
  ): Promise<string> {
    const {
      rateLimit: { limit, capacityAtLastTx, lastTxTimestamp },
    } = await this.getManager().getInboxRateLimit(fromChain);
    return this.getCurrentCapacity(limit, capacityAtLastTx, lastTxTimestamp);
  }

  getCurrentCapacity(limit: BN, capacityAtLastTx: BN, lastTxTimestamp: BN) {
    const timePassed = BN.max(
      new BN(Date.now() / 1000).sub(lastTxTimestamp),
      new BN(0),
    );
    const calculatedCapacity = capacityAtLastTx.add(
      timePassed.mul(limit).div(new BN(RATE_LIMIT_DURATION)),
    );
    return calculatedCapacity.lt(limit)
      ? calculatedCapacity.toString()
      : limit.toString();
  }

  async getInboundQueuedTransfer(
    emitterChain: ChainName | ChainId,
    managerMessage: ManagerMessage<NativeTokenTransfer>,
  ): Promise<InboundQueuedTransfer | undefined> {
    const ntt = this.getManager();
    // TODO: does this throw if the account doesn't exist?
    const inboxItem = await ntt.getInboxItem(emitterChain, managerMessage);
    // TODO: what if it's released or not found,
    // race condition calling this immediately after tx confirmed?
    // TODO: not approved - hasn't been fully attested yet
    // inbox item will exist when we call redeem
    if (inboxItem.releaseStatus.releaseAfter) {
      return {
        recipient: inboxItem.recipientAddress.toString(),
        amount: inboxItem.amount.toString(),
        rateLimitExpiryTimestamp:
          inboxItem.releaseStatus.releaseAfter[0].toNumber(),
      };
    }
    return undefined;
  }

  async completeInboundQueuedTransfer(
    emitterChain: ChainName | ChainId,
    managerMessage: ManagerMessage<NativeTokenTransfer>,
    payer: string,
  ): Promise<string> {
    const payerPublicKey = new PublicKey(payer);
    const releaseArgs = {
      payer: payerPublicKey,
      managerMessage,
      // TODO: need to format?
      recipient: new PublicKey(managerMessage.payload.recipientAddress),
      chain: emitterChain,
      revertOnDelay: false,
    };
    const ntt = this.getManager();
    const config = await ntt.getConfig();
    const tx = new Transaction();
    if (config.mode.locking != null) {
      tx.add(await ntt.createReleaseInboundUnlockInstruction(releaseArgs));
    } else {
      tx.add(await ntt.createReleaseInboundMintInstruction(releaseArgs));
    }
    tx.feePayer = payerPublicKey;
    const txId = await this.signAndSendTransaction(
      tx,
      TransferWallet.RECEIVING,
    );
    return txId;
  }

  async isMessageExecuted(
    emitterChain: ChainName | ChainId,
    managerMessage: ManagerMessage<NativeTokenTransfer>,
  ): Promise<boolean> {
    const ntt = this.getManager();
    const inboxItem = await ntt.getInboxItem(emitterChain, managerMessage);
    // TODO: will this be undefined ever?
    return inboxItem.releaseStatus.released !== null;
  }

  async isPaused(): Promise<boolean> {
    return this.getManager().isPaused();
  }
}
