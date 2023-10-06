import {
  Connection,
  JsonRpcProvider,
  PaginatedCoins,
  SUI_CLOCK_OBJECT_ID,
  SUI_TYPE_ARG,
  TransactionBlock,
  getTotalGasUsed,
  getTransactionSender,
  isValidSuiAddress,
} from '@mysten/sui.js';
import { BigNumber, BigNumberish } from 'ethers';

import {
  getForeignAssetSui,
  getIsTransferCompletedSui,
  getOriginalAssetSui,
  redeemOnSui,
  transferFromSui,
} from '@certusone/wormhole-sdk';
import { getPackageId } from '@certusone/wormhole-sdk/lib/esm/sui';
import { arrayify, hexlify } from 'ethers/lib/utils';
import {
  ChainId,
  ChainName,
  Context,
  NATIVE,
  ParsedMessage,
  ParsedRelayerMessage,
  TokenId,
} from '../../types';
import { parseTokenTransferPayload } from '../../vaa';
import { WormholeContext } from '../../wormhole';
import { RelayerAbstract } from '../abstracts/relayer';
import { SolanaContext } from '../solana';
import { SuiContracts } from './contracts';
import { SuiRelayer } from './relayer';
import { ForeignAssetCache } from '../../utils';

export class SuiContext<
  T extends WormholeContext,
> extends RelayerAbstract<TransactionBlock> {
  readonly type = Context.SUI;
  protected contracts: SuiContracts<T>;
  readonly context: T;
  readonly provider: JsonRpcProvider;
  private foreignAssetCache: ForeignAssetCache;

  constructor(context: T, foreignAssetCache: ForeignAssetCache) {
    super();
    this.context = context;
    const connection = context.conf.rpcs.sui;
    if (connection === undefined) throw new Error('no connection');
    this.provider = new JsonRpcProvider(
      new Connection({ fullnode: connection }),
    );
    this.contracts = new SuiContracts(context, this.provider);
    this.foreignAssetCache = foreignAssetCache;
  }

  async getTxGasFee(
    txId: string,
    chain: ChainName | ChainId,
  ): Promise<BigNumber | undefined> {
    const txBlock = await this.provider.getTransactionBlock({
      digest: txId,
      options: { showEvents: true, showEffects: true, showInput: true },
    });
    return BigNumber.from(getTotalGasUsed(txBlock) || 0);
  }

  async getCoins(coinType: string, owner: string) {
    let coins: { coinType: string; coinObjectId: string }[] = [];
    let cursor: string | null = null;
    do {
      const result: PaginatedCoins = await this.provider.getCoins({
        owner,
        coinType,
        cursor,
      });
      coins = [...coins, ...result.data];
      cursor = result.hasNextPage ? result.nextCursor : null;
    } while (cursor);
    return coins;
  }

  async innerSend(
    token: TokenId | typeof NATIVE,
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    relayerFee: any,
    payload?: Uint8Array | undefined,
  ): Promise<TransactionBlock> {
    const destContext = this.context.getContext(recipientChain);
    const recipientChainId = this.context.toChainId(recipientChain);
    const relayerFeeBigInt = relayerFee ? BigInt(relayerFee) : undefined;
    const amountBigInt = BigNumber.from(amount).toBigInt();

    let recipientAccount = recipientAddress;
    // get token account for solana
    if (recipientChainId === 1) {
      let tokenId = token;
      if (token === NATIVE) {
        tokenId = {
          address: SUI_TYPE_ARG,
          chain: 'sui',
        };
      }
      const account = await (
        destContext as SolanaContext<WormholeContext>
      ).getAssociatedTokenAddress(tokenId as TokenId, recipientAddress);
      recipientAccount = account.toString();
    }
    const formattedRecipientAccount = arrayify(
      destContext.formatAddress(recipientAccount),
    );

    let coinType;
    if (token === NATIVE) {
      coinType = SUI_TYPE_ARG;
    } else {
      coinType = await this.mustGetForeignAsset(token, sendingChain);
    }
    const coins = await this.getCoins(coinType, senderAddress);

    const { core, token_bridge } = this.context.mustGetContracts('sui');
    if (!core || !token_bridge) throw new Error('contracts not found');

    const tx = await transferFromSui(
      this.provider,
      core,
      token_bridge,
      coins,
      coinType,
      amountBigInt,
      recipientChainId,
      formattedRecipientAccount,
      BigInt(0), // TODO: wormhole fee
      relayerFeeBigInt,
      payload,
      undefined,
      undefined,
      payload ? senderAddress : undefined,
    );
    return tx;
  }

  async send(
    token: TokenId | typeof NATIVE,
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    relayerFee: any,
  ): Promise<TransactionBlock> {
    return this.innerSend(
      token,
      amount,
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
      relayerFee,
    );
  }

  async sendWithPayload(
    token: TokenId | typeof NATIVE,
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    payload: Uint8Array | undefined,
  ): Promise<TransactionBlock> {
    return this.innerSend(
      token,
      amount,
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
      undefined,
      payload,
    );
  }

  async estimateSendGas(
    token: TokenId | typeof NATIVE,
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
  ): Promise<BigNumber> {
    const provider = this.provider as JsonRpcProvider;
    if (!provider) throw new Error('no provider');
    const tx = await this.send(
      token,
      amount,
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
      undefined,
    );
    tx.setSenderIfNotSet(senderAddress);
    const dryRunTxBytes = await tx.build({
      provider,
    });
    const response = await provider.dryRunTransactionBlock({
      transactionBlock: dryRunTxBytes,
    });
    const gasFee = getTotalGasUsed(response.effects);
    if (!gasFee) throw new Error('cannot estimate gas fee');
    return BigNumber.from(gasFee);
  }
  async estimateClaimGas(destChain: ChainName | ChainId): Promise<BigNumber> {
    throw new Error('not implemented');
  }
  async estimateSendWithRelayGas(
    token: TokenId | typeof NATIVE,
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    relayerFee: any,
    toNativeToken: string,
  ): Promise<BigNumber> {
    const provider = this.provider as JsonRpcProvider;
    if (!provider) throw new Error('no provider');
    const tx = await this.sendWithRelay(
      token,
      amount.toString(), // must be > min amount to succeed
      toNativeToken,
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
    );
    tx.setSenderIfNotSet(senderAddress);
    const dryRunTxBytes = await tx.build({
      provider,
    });
    const response = await provider.dryRunTransactionBlock({
      transactionBlock: dryRunTxBytes,
    });
    const gasFee = getTotalGasUsed(response.effects);
    if (!gasFee) throw new Error('cannot estimate gas fee');
    return BigNumber.from(gasFee);
  }

  formatAddress(address: string): Uint8Array {
    if (!isValidSuiAddress(address)) {
      throw new Error(`can't format an invalid sui address: ${address}`);
    }
    // valid sui addresses are already 32 bytes, hex prefixed
    return arrayify(address);
  }

  parseAddress(address: string): string {
    if (!isValidSuiAddress(address)) {
      throw new Error(`can't parse an invalid sui address: ${address}`);
    }
    // valid sui addresses are already 32 bytes, hex prefixed
    return address;
  }

  /**
   * @param address The asset's address (the Sui `CoinType`)
   * @returns The external address associated with the asset address
   */
  async formatAssetAddress(address: string): Promise<Uint8Array> {
    try {
      const { token_bridge } = this.contracts.mustGetContracts('sui');
      if (!token_bridge) throw new Error('token bridge contract not found');
      // this will throw if the asset hasn't been attested
      const { assetAddress } = await getOriginalAssetSui(
        this.provider,
        token_bridge,
        address,
      );
      return assetAddress;
    } catch (e) {
      console.error(`formatAssetAddress - error: ${e}`);
      throw e;
    }
  }

  /**
   * @param address The asset's external address
   * @returns The asset's address (the Sui `CoinType`) associated with the external address
   */
  async parseAssetAddress(address: string): Promise<string> {
    try {
      const { token_bridge } = this.contracts.mustGetContracts('sui');
      if (!token_bridge) throw new Error('token bridge contract not found');
      const coinType = await getForeignAssetSui(
        this.provider,
        token_bridge,
        this.context.toChainId('sui'),
        arrayify(address),
      );
      if (coinType === null) {
        throw new Error('coinType is null');
      }
      return coinType;
    } catch (e) {
      console.error(`parseAssetAddress - error: ${e}`);
      throw e;
    }
  }

  async getForeignAsset(
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<string | null> {
    const chainName = this.context.toChainName(chain);
    if (this.foreignAssetCache.get(tokenId.chain, tokenId.address, chainName)) {
      return this.foreignAssetCache.get(
        tokenId.chain,
        tokenId.address,
        chainName,
      )!;
    }

    try {
      const chainId = this.context.toChainId(tokenId.chain);
      const toChainId = this.context.toChainId(chain);
      if (toChainId === chainId) return tokenId.address;
      const { token_bridge } = this.contracts.mustGetContracts('sui');
      if (!token_bridge) throw new Error('token bridge contract not found');

      const tokenContext = this.context.getContext(tokenId.chain);
      const formattedAddr = await tokenContext.formatAssetAddress(
        tokenId.address,
      );
      const coinType = await getForeignAssetSui(
        this.provider,
        token_bridge,
        chainId,
        arrayify(formattedAddr),
      );

      if (!coinType) return null;

      this.foreignAssetCache.set(
        tokenId.chain,
        tokenId.address,
        chainName,
        coinType,
      );
      return coinType;
    } catch (e) {
      console.log(`getForeignAsset - error: ${e}`);
      throw e;
    }
  }

  async mustGetForeignAsset(
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<string> {
    const coinType = await this.getForeignAsset(tokenId, chain);
    if (!coinType) throw new Error('token not registered');
    return coinType;
  }

  async fetchTokenDecimals(
    tokenAddr: string,
    chain: ChainName | ChainId,
  ): Promise<number> {
    const metadata = await this.provider.getCoinMetadata({
      coinType: tokenAddr,
    });
    if (metadata === null) {
      throw new Error(`Can't fetch decimals for token ${tokenAddr}`);
    }
    return metadata.decimals;
  }

  async getMessage(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<ParsedMessage | ParsedRelayerMessage> {
    const txBlock = await this.provider.getTransactionBlock({
      digest: tx,
      options: { showEvents: true, showEffects: true, showInput: true },
    });
    const message = txBlock.events?.find((event) =>
      event.type.endsWith('WormholeMessage'),
    );
    if (!message || !message.parsedJson) {
      throw new Error('WormholeMessage not found');
    }
    const { payload, sender: emitterAddress, sequence } = message.parsedJson;

    const parsed = parseTokenTransferPayload(Buffer.from(payload));

    const tokenContext = this.context.getContext(parsed.tokenChain as ChainId);
    const destContext = this.context.getContext(parsed.toChain as ChainId);
    const tokenAddress = await tokenContext.parseAssetAddress(
      hexlify(parsed.tokenAddress),
    );
    const tokenChain = this.context.toChainName(parsed.tokenChain);
    const gasFee = getTotalGasUsed(txBlock);
    const to = destContext.parseAddress(hexlify(parsed.to));
    const parsedMessage: ParsedMessage = {
      sendTx: txBlock.digest,
      sender: getTransactionSender(txBlock) || '',
      amount: BigNumber.from(parsed.amount),
      payloadID: parsed.payloadType,
      recipient: to,
      toChain: this.context.toChainName(parsed.toChain),
      fromChain: this.context.toChainName(chain),
      tokenAddress,
      tokenChain,
      tokenId: {
        chain: tokenChain,
        address: tokenAddress,
      },
      sequence: BigNumber.from(sequence),
      emitterAddress: hexlify(emitterAddress),
      block: Number(txBlock.checkpoint || ''),
      gasFee: gasFee ? BigNumber.from(gasFee) : undefined,
    };
    if (parsed.payloadType === 3) {
      const relayerPayload = destContext.parseRelayerPayload(
        Buffer.from(parsed.tokenTransferPayload),
      );
      const relayerMessage: ParsedRelayerMessage = {
        ...parsedMessage,
        relayerFee: relayerPayload.relayerFee,
        relayerPayloadId: parsed.payloadType as number,
        to,
        recipient: destContext.parseAddress(hexlify(relayerPayload.to)),
        toNativeTokenAmount: relayerPayload.toNativeTokenAmount,
        payload: parsed.tokenTransferPayload.length
          ? hexlify(parsed.tokenTransferPayload)
          : undefined,
      };
      return relayerMessage;
    }
    return parsedMessage;
  }

  async getNativeBalance(
    walletAddress: string,
    chain: ChainName | ChainId,
  ): Promise<BigNumber> {
    const { totalBalance } = await this.provider.getBalance({
      owner: walletAddress,
    });
    return BigNumber.from(totalBalance);
  }

  async getTokenBalance(
    walletAddress: string,
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<BigNumber | null> {
    const coinType = await this.getForeignAsset(tokenId, chain);
    if (!coinType) return null;
    const { totalBalance } = await this.provider.getBalance({
      owner: walletAddress,
      coinType,
    });
    return BigNumber.from(totalBalance);
  }

  async getTokenBalances(
    walletAddr: string,
    tokenIds: TokenId[],
    chain: ChainName | ChainId,
  ): Promise<(BigNumber | null)[]> {
    return await Promise.all(
      tokenIds.map((tokenId) =>
        this.getTokenBalance(walletAddr, tokenId, chain),
      ),
    );
  }

  async redeem(
    destChain: ChainName | ChainId,
    signedVAA: Uint8Array,
    overrides: any,
    payerAddr?: any,
  ): Promise<TransactionBlock> {
    const { core, token_bridge } = this.contracts.mustGetContracts('sui');
    if (!core || !token_bridge) throw new Error('contracts not found');
    const tx = await redeemOnSui(this.provider, core, token_bridge, signedVAA);
    return tx;
  }

  async isTransferCompleted(
    destChain: ChainName | ChainId,
    signedVaa: string,
  ): Promise<boolean> {
    const { token_bridge } = this.contracts.mustGetContracts('sui');
    if (!token_bridge) throw new Error('token bridge contract not found');
    return await getIsTransferCompletedSui(
      this.provider,
      token_bridge,
      arrayify(signedVaa, { allowMissingPrefix: true }),
    );
  }

  async sendWithRelay(
    token: TokenId | 'native',
    amount: string,
    toNativeToken: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    overrides?: any,
  ): Promise<TransactionBlock> {
    const destContext = this.context.getContext(recipientChain);
    const recipientChainId = this.context.toChainId(recipientChain);
    const amountBigInt = BigNumber.from(amount).toBigInt();
    const toNativeTokenBigInt = BigNumber.from(toNativeToken).toBigInt();

    const formattedRecipientAccount = `0x${Buffer.from(
      arrayify(destContext.formatAddress(recipientAddress)),
    ).toString('hex')}`;

    let coinType: string;
    if (token === NATIVE) {
      coinType = SUI_TYPE_ARG;
    } else {
      coinType = await this.mustGetForeignAsset(token, sendingChain);
    }
    const coins = await this.getCoins(coinType, senderAddress);
    const [primaryCoin, ...mergeCoins] = coins.filter(
      (coin) => coin.coinType === coinType,
    );
    if (primaryCoin === undefined) {
      throw new Error(
        `Coins array doesn't contain any coins of type ${coinType}`,
      );
    }
    const { core, token_bridge, relayer, suiRelayerPackageId } =
      this.context.mustGetContracts('sui');
    if (!core || !token_bridge || !relayer || !suiRelayerPackageId)
      throw new Error('contracts not found');
    const coreBridgePackageId = await getPackageId(this.provider, core);
    if (!coreBridgePackageId)
      throw new Error('unable to get core bridge package id');
    const tokenBridgePackageId = await getPackageId(
      this.provider,
      token_bridge,
    );
    if (!tokenBridgePackageId)
      throw new Error('unable to get token bridge package id');

    const tx = new TransactionBlock();
    const feeAmount = BigInt(0); // TODO: wormhole fee
    const [feeCoin] = tx.splitCoins(tx.gas, [tx.pure(feeAmount)]);
    const [transferCoin] = (() => {
      if (coinType === SUI_TYPE_ARG) {
        return tx.splitCoins(tx.gas, [tx.pure(amountBigInt)]);
      } else {
        const primaryCoinInput = tx.object(primaryCoin.coinObjectId);
        if (mergeCoins.length) {
          tx.mergeCoins(
            primaryCoinInput,
            mergeCoins.map((coin) => tx.object(coin.coinObjectId)),
          );
        }
        return tx.splitCoins(primaryCoinInput, [tx.pure(amountBigInt)]);
      }
    })();
    const [assetInfo] = tx.moveCall({
      target: `${tokenBridgePackageId}::state::verified_asset`,
      arguments: [tx.object(token_bridge)],
      typeArguments: [coinType],
    });
    const [transferTicket] = tx.moveCall({
      target: `${suiRelayerPackageId}::transfer::transfer_tokens_with_relay`,
      arguments: [
        tx.object(relayer),
        transferCoin,
        assetInfo,
        tx.pure(toNativeTokenBigInt),
        tx.pure(recipientChainId),
        tx.pure(formattedRecipientAccount),
        tx.pure(117),
      ],
      typeArguments: [coinType],
    });
    const [messageTicket] = tx.moveCall({
      target: `${tokenBridgePackageId}::transfer_tokens_with_payload::transfer_tokens_with_payload`,
      arguments: [tx.object(token_bridge), transferTicket],
      typeArguments: [coinType],
    });
    tx.moveCall({
      target: `${coreBridgePackageId}::publish_message::publish_message`,
      arguments: [
        tx.object(core),
        feeCoin,
        messageTicket,
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });
    return tx;
  }

  async calculateNativeTokenAmt(
    destChain: ChainName | ChainId,
    tokenId: TokenId,
    amount: BigNumberish,
    walletAddress: string,
  ): Promise<BigNumber> {
    const relayer = this.contracts.mustGetTokenBridgeRelayer(
      'sui',
    ) as SuiRelayer;
    const coinType = await this.mustGetForeignAsset(tokenId, destChain);
    const nativeTokenAmount = await relayer.calculateNativeSwapAmountOut(
      walletAddress,
      coinType,
      amount,
    );
    return nativeTokenAmount;
  }

  async calculateMaxSwapAmount(
    destChain: ChainName | ChainId,
    tokenId: TokenId,
    walletAddress: string,
  ): Promise<BigNumber> {
    const relayer = this.contracts.mustGetTokenBridgeRelayer(
      'sui',
    ) as SuiRelayer;
    const coinType = await this.mustGetForeignAsset(tokenId, destChain);
    const maxSwap = await relayer.calculateMaxSwapAmountIn(
      walletAddress,
      coinType,
    );
    return maxSwap;
  }

  async getRelayerFee(
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    tokenId: TokenId,
  ): Promise<BigNumber> {
    const relayer = this.contracts.mustGetTokenBridgeRelayer(
      'sui',
    ) as SuiRelayer;
    const address = await this.mustGetForeignAsset(tokenId, sourceChain);
    const decimals = await this.fetchTokenDecimals(address, sourceChain);
    const destChainId = this.context.toChainId(destChain);
    const fee = await relayer.calculateRelayerFee(
      destChainId,
      address,
      decimals,
    );
    return fee;
  }

  async getCurrentBlock(): Promise<number> {
    if (!this.provider) throw new Error('no provider');
    const sequence = await this.provider.getLatestCheckpointSequenceNumber();
    return Number(sequence);
  }
}
