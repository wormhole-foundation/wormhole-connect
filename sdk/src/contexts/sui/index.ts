import {
  JsonRpcProvider,
  SUI_TYPE_ARG,
  TransactionBlock,
  SuiTransactionBlockResponse,
  testnetConnection,
  PaginatedCoins,
  getTransactionSender,
  getTotalGasUsed,
  isValidSuiAddress,
} from '@mysten/sui.js';
import { BigNumber, BigNumberish } from 'ethers';

import {
  TokenId,
  ParsedRelayerMessage,
  ChainName,
  ChainId,
  NATIVE,
  ParsedMessage,
} from '../../types';
import { WormholeContext } from '../../wormhole';
import { RelayerAbstract } from '../abstracts/relayer';
import {
  getForeignAssetSui,
  getIsTransferCompletedSui,
  getOriginalAssetSui,
  redeemOnSui,
  transferFromSui,
} from '@certusone/wormhole-sdk';
import { arrayify, hexlify } from 'ethers/lib/utils';
import { SuiContracts } from './contracts';
import { SolanaContext } from '../solana';
import { parseTokenTransferPayload } from '../../vaa';
import { SuiRelayer } from './relayer';

export class SuiContext<T extends WormholeContext> extends RelayerAbstract {
  protected contracts: SuiContracts<T>;
  readonly context: T;
  readonly provider: JsonRpcProvider;

  constructor(context: T) {
    super();
    this.context = context;
    const connection =
      context.environment === 'MAINNET' ? undefined : testnetConnection;
    if (connection === undefined) throw new Error('no connection');
    this.provider = new JsonRpcProvider(connection);
    this.contracts = new SuiContracts(context, this.provider);
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

  async send(
    token: TokenId | typeof NATIVE,
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    relayerFee: any,
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

    const coinType = token === NATIVE ? SUI_TYPE_ARG : token.address;
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
    );
    return tx;
  }

  async sendWithPayload(
    token: TokenId | typeof NATIVE,
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    payload: any,
  ): Promise<TransactionBlock> {
    throw new Error('not implemented');
  }

  formatAddress(address: string): string {
    // const result = Buffer.from(utils.zeroPad(address, 32));
    // console.log(`native to hex ${address} - ${result}`);
    if (!isValidSuiAddress(address)) {
      throw new Error(`can't format an invalid sui address: ${address}`);
    }
    console.log(`sui format address - ${address}`);
    // valid sui addresses are already 32 bytes, hex prefixed
    return address;
  }

  parseAddress(address: string): string {
    //const result = utils.hexlify(utils.stripZeros(address));
    //console.log(`hex to native ${address} - ${result}`);
    if (!isValidSuiAddress(address)) {
      throw new Error(`can't parse an invalid sui address: ${address}`);
    }
    console.log(`sui parse address - ${address}`);
    // valid sui addresses are already 32 bytes, hex prefixed
    return address;
  }

  /**
   * @param address The asset's address (the Sui `CoinType`)
   * @returns The external address associated with the asset address
   */
  async formatAssetAddress(address: string): Promise<Uint8Array> {
    console.log(`formatAssetAddress - external address: ${address}`);
    try {
      const { token_bridge } = this.contracts.mustGetContracts('sui');
      if (!token_bridge) throw new Error('token bridge contract not found');
      // TODO: this will throw if the asset hasn't been attested
      const { assetAddress } = await getOriginalAssetSui(
        this.provider,
        token_bridge,
        address,
      );
      console.log(
        `formatAssetAddress - address: ${address}, external address: ${assetAddress}`,
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
    console.log(`parseAssetAddress - external address: ${address}`);
    // TODO: remove this when getForeignAssetSui is fixed in the SDK
    if (
      address ===
      '0x9d31091f5decefeb373de2218d634dbe198c72feac6e50fba0a5330cb5e65cff'
    ) {
      return SUI_TYPE_ARG;
    }
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
      console.log(
        `parseAssetAddress - external address: ${address}, coinType: ${coinType}`,
      );
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
    console.log(
      `getForeignAsset - native address: ${tokenId.address}, token chain: ${tokenId.chain}`,
    );
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
      console.log(`getForeignAsset returned ${coinType}`);
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
    // optimization to avoid rpc call for native sui
    if (tokenAddr === SUI_TYPE_ARG) {
      return 9;
    }
    const metadata = await this.provider.getCoinMetadata({
      coinType: tokenAddr,
    });
    if (metadata === null) {
      throw new Error(`Can't fetch decimals for token ${tokenAddr}`);
    }
    return metadata.decimals;
  }

  async parseMessageFromTx(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<ParsedMessage[] | ParsedRelayerMessage[]> {
    const txBlock = await this.provider.getTransactionBlock({
      digest: tx,
      options: { showEvents: true, showEffects: true, showInput: true },
    });
    // console.log(JSON.stringify(txBlock));
    // TODO: search for full type instead?
    // "type": "0x15e1e51cb59fe1f987b037da12745a278855c8ac73050f4f194466096a0ca05b::publish_message::WormholeMessage",
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
    console.log(`transferred token from sui ${tokenAddress}`);
    const tokenChain = this.context.toChainName(parsed.tokenChain);
    const gasFee = getTotalGasUsed(txBlock);
    const parsedMessage: ParsedMessage = {
      sendTx: tx,
      sender: getTransactionSender(txBlock) || '',
      amount: BigNumber.from(parsed.amount),
      payloadID: parsed.payloadType,
      recipient: destContext.parseAddress(hexlify(parsed.to)),
      toChain: this.context.toChainName(parsed.toChain),
      fromChain: this.context.toChainName(chain),
      tokenAddress,
      tokenChain,
      tokenId: {
        chain: tokenChain,
        address: tokenAddress,
      },
      sequence: BigNumber.from(sequence),
      emitterAddress,
      block: Number(txBlock.checkpoint || ''),
      gasFee: gasFee ? BigNumber.from(gasFee) : undefined,
    };
    return [parsedMessage];
  }

  getTxIdFromReceipt(receipt: SuiTransactionBlockResponse) {
    return receipt.digest;
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
      arrayify(signedVaa),
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
    throw new Error('sui send with relay not implemented');
    //const tx = new TransactionBlock();
    //const feeAmount = BigInt(0); // TODO: wormhole fee
    //const [feeCoin] = tx.splitCoins(tx.gas, [tx.pure(feeAmount)]);
    //const [transferCoin] = tx.splitCoins(tx.object(coin.coinObjectId), [
    //  tx.pure(outboundTransferAmount),
    //]);
    //const [assetInfo] = tx.moveCall({
    //  target: `${TOKEN_BRIDGE_ID}::state::verified_asset`,
    //  arguments: [tx.object(TOKEN_BRIDGE_STATE_ID)],
    //  typeArguments: [COIN_8_TYPE],
    //});

    //// Fetch the transfer ticket.
    //const [transferTicket] = tx.moveCall({
    //  target: `${RELAYER_ID}::transfer::transfer_tokens_with_relay`,
    //  arguments: [
    //    tx.object(stateId),
    //    transferCoin,
    //    assetInfo,
    //    tx.pure(toNativeAmount),
    //    tx.pure(foreignChain),
    //    tx.pure(walletAddress),
    //    tx.pure(nonce),
    //  ],
    //  typeArguments: [COIN_8_TYPE],
    //});

    //// Transfer the tokens with payload.
    //const [messageTicket] = tx.moveCall({
    //  target: `${TOKEN_BRIDGE_ID}::transfer_tokens_with_payload::transfer_tokens_with_payload`,
    //  arguments: [tx.object(TOKEN_BRIDGE_STATE_ID), transferTicket],
    //  typeArguments: [COIN_8_TYPE],
    //});

    //// Publish the message.
    //tx.moveCall({
    //  target: `${WORMHOLE_ID}::publish_message::publish_message`,
    //  arguments: [
    //    tx.object(WORMHOLE_STATE_ID),
    //    feeCoin,
    //    messageTicket,
    //    tx.object(SUI_CLOCK_OBJECT_ID),
    //  ],
    //});
    //return tx;
  }

  async calculateNativeTokenAmt(
    destChain: ChainName | ChainId,
    tokenId: TokenId,
    amount: BigNumberish,
  ): Promise<BigNumber> {
    // throw new Error('Method not implemented.');
    return BigNumber.from(1);
  }

  async calculateMaxSwapAmount(
    destChain: ChainName | ChainId,
    tokenId: TokenId,
  ): Promise<BigNumber> {
    // throw new Error('Method not implemented.');
    const relayer = this.contracts.mustGetTokenBridgeRelayer(
      destChain,
    ) as SuiRelayer;
    const coinType = await this.mustGetForeignAsset(tokenId, destChain);
    // TODO: use actual sender's address
    const dummyAddress =
      '0xed867315e3f7c83ae82e6d5858b6a6cc57c291fd84f7509646ebc8162169cf96';
    const maxSwap = await relayer.calculateMaxSwapAmountIn(
      dummyAddress,
      coinType,
    );
    return BigNumber.from(maxSwap);
  }

  async getRelayerFee(
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    tokenId: TokenId,
  ): Promise<BigNumber> {
    // when calculating relayer fees, it's from the source chain to the dest chain
    console.log(
      `getRelayerFee - sourceChain ${sourceChain}, destChain: ${destChain}, tokenId: ${tokenId}`,
    );
    return BigNumber.from(0);
    //// sourceChain fuji, destChain: sui
    //const relayer = this.contracts.mustGetTokenBridgeRelayer(sourceChain);
    //// get asset address
    //const address = await this.mustGetForeignAsset(tokenId, sourceChain);
    ////  get token decimals
    //const decimals = await this.fetchTokenDecimals(address, sourceChain);
    //// get relayer fee as token amt
    //const destChainId = this.context.toChainId(destChain);
    //return await relayer.calculateRelayerFee(destChainId, address, decimals);
  }
}
