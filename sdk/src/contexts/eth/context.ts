import {
  Implementation__factory,
  TokenImplementation__factory,
} from '@certusone/wormhole-sdk/lib/esm/ethers-contracts';
import { createNonce } from '@certusone/wormhole-sdk';
import {
  BigNumber,
  BigNumberish,
  constants,
  ContractReceipt,
  ethers,
  Overrides,
  PayableOverrides,
  PopulatedTransaction,
} from 'ethers';
import { utils } from 'ethers';

import {
  TokenId,
  ChainName,
  ChainId,
  NATIVE,
  ParsedRelayerMessage,
  ParsedMessage,
  Context,
  ParsedRelayerPayload,
} from '../../types';
import { WormholeContext } from '../../wormhole';
import { EthContracts } from './contracts';
import { parseVaa } from '../../vaa';
import { RelayerAbstract } from '../abstracts/relayer';
import { SolanaContext } from '../solana';
import { arrayify } from 'ethers/lib/utils';
import { ForeignAssetCache, chunkArray } from '../../utils';

export const NO_VAA_FOUND = 'No message publish found in logs';

export class EthContext<
  T extends WormholeContext,
> extends RelayerAbstract<ethers.ContractReceipt> {
  readonly type = Context.ETH;
  readonly contracts: EthContracts<T>;
  readonly context: T;
  private foreignAssetCache: ForeignAssetCache;

  constructor(context: T, foreignAssetCache: ForeignAssetCache) {
    super();
    this.context = context;
    this.contracts = new EthContracts(context);
    this.foreignAssetCache = foreignAssetCache;
  }

  async getTxGasFee(
    txId: string,
    chain: ChainName | ChainId,
  ): Promise<BigNumber | undefined> {
    const provider = this.context.mustGetProvider(chain);
    const receipt = await provider.getTransactionReceipt(txId);
    const { gasUsed, effectiveGasPrice } = receipt;
    if (!gasUsed || !effectiveGasPrice) return;
    return gasUsed.mul(effectiveGasPrice);
  }

  // This helper is needed so that the `wrappedAsset` calls can be batched efficiently
  async getForeignAssetPartiallyUnresolved(
    tokenId: TokenId,
    chain: ChainName | ChainId,
    provider?: ethers.providers.Provider,
  ): Promise<string | (() => Promise<string | null>)> {
    const chainName = this.context.toChainName(chain);
    if (this.foreignAssetCache.get(tokenId.chain, tokenId.address, chainName)) {
      return this.foreignAssetCache.get(
        tokenId.chain,
        tokenId.address,
        chainName,
      )!;
    }

    const toChainId = this.context.toChainId(chain);
    const chainId = this.context.toChainId(tokenId.chain);
    // if the token is already native, return the token address
    if (toChainId === chainId) return tokenId.address;
    // else fetch the representation
    const tokenBridge = this.contracts.mustGetBridge(chain, provider);
    const sourceContext = this.context.getContext(tokenId.chain);
    const tokenAddr = await sourceContext.formatAssetAddress(tokenId.address);
    return async () => {
      const foreignAddr = await tokenBridge.wrappedAsset(
        chainId,
        utils.arrayify(tokenAddr),
      );
      if (foreignAddr === constants.AddressZero) return null;
      this.foreignAssetCache.set(
        tokenId.chain,
        tokenId.address,
        chainName,
        foreignAddr,
      );
      return foreignAddr;
    };
  }

  async getForeignAsset(
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<string | null> {
    const result = await this.getForeignAssetPartiallyUnresolved(
      tokenId,
      chain,
    );
    return typeof result === 'function' ? await result() : result;
  }

  async mustGetForeignAsset(
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<string> {
    const addr = await this.getForeignAsset(tokenId, chain);
    if (!addr) throw new Error('token not registered');
    return addr;
  }

  async fetchTokenDecimals(
    tokenAddr: string,
    chain: ChainName | ChainId,
  ): Promise<number> {
    const provider = this.context.mustGetProvider(chain);
    const tokenContract = TokenImplementation__factory.connect(
      tokenAddr,
      provider,
    );
    const decimals = await tokenContract.decimals();
    return decimals;
  }

  async getNativeBalance(
    walletAddr: string,
    chain: ChainName | ChainId,
  ): Promise<BigNumber> {
    const provider = this.context.mustGetProvider(chain);
    return await provider.getBalance(walletAddr);
  }

  async getTokenBalance(
    walletAddr: string,
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<BigNumber | null> {
    const address = await this.getForeignAsset(tokenId, chain);
    if (!address) return null;
    const provider = this.context.mustGetProvider(chain);
    const token = TokenImplementation__factory.connect(address, provider);
    const balance = await token.balanceOf(walletAddr);
    return balance;
  }

  async getTokenBalances(
    walletAddr: string,
    tokenIds: TokenId[],
    chain: ChainName | ChainId,
  ): Promise<(BigNumber | null)[]> {
    // The complex chunking into maxBatchSize and reconstituting
    // should not be required when using ethers v6 batch provider
    const contextProvider = this.context.mustGetProvider(chain);
    // attempt to batch the balance calls
    // @ts-ignore connection definitely exists on provider
    const rpc: string = contextProvider.connection?.url || '';
    const provider =
      rpc.startsWith('http://') || rpc.startsWith('https://')
        ? new ethers.providers.JsonRpcBatchProvider(rpc)
        : contextProvider;
    const maxBatchSize = 100; // 100 is the default used by ethers v6

    let addresses: (string | null)[] = [];
    {
      const partiallyUnresolvedAddresses = await Promise.all(
        tokenIds.map((tokenId) =>
          this.getForeignAssetPartiallyUnresolved(tokenId, chain, provider),
        ),
      );
      // we don't want to include resolved addresses in our chunks, as we want to pack in the most per-query
      const unresolvedIndexes = partiallyUnresolvedAddresses
        .map((_, idx) => idx)
        .filter(
          (aIdx) => typeof partiallyUnresolvedAddresses[aIdx] === 'function',
        );
      const idxChunks = chunkArray(unresolvedIndexes, maxBatchSize);
      let queriedAddresses: (string | null)[] = [];
      // batch request each chunk
      for (const chunk of idxChunks) {
        queriedAddresses = [
          ...queriedAddresses,
          ...(await Promise.all(
            chunk.map((idx) => {
              const result = partiallyUnresolvedAddresses[idx];
              return typeof result === 'function'
                ? result()
                : Promise.resolve(result);
            }),
          )),
        ];
      }
      // re-assemble the balances array to match the input order
      let queriedIdx = 0;
      for (let i = 0; i < partiallyUnresolvedAddresses.length; i++) {
        const maybeResult = partiallyUnresolvedAddresses[i];
        if (typeof maybeResult === 'string') {
          addresses.push(maybeResult);
        } else {
          addresses.push(queriedAddresses[queriedIdx++]);
        }
      }
    }

    let balances: (BigNumber | null)[] = [];
    {
      // we don't want to include nulls in our chunks, as we want to pack in the most per-query
      const nonNullIndexes = addresses
        .map((_, idx) => idx)
        .filter((aIdx) => !!addresses[aIdx]);
      const idxChunks = chunkArray(nonNullIndexes, maxBatchSize);
      let queriedBalances: (BigNumber | null)[] = [];
      // batch request each chunk
      for (const chunk of idxChunks) {
        queriedBalances = [
          ...queriedBalances,
          ...(await Promise.all(
            chunk.map((idx) => {
              const address = addresses[idx];
              return !address
                ? Promise.resolve(null)
                : // TODO: this connect may trigger extra requests
                  TokenImplementation__factory.connect(
                    address,
                    provider,
                  ).balanceOf(walletAddr);
            }),
          )),
        ];
      }
      // re-assemble the balances array to match the input order
      let queriedIdx = 0;
      for (let i = 0; i < addresses.length; i++) {
        if (i === nonNullIndexes[queriedIdx]) {
          balances.push(queriedBalances[queriedIdx++]);
        } else {
          balances.push(null);
        }
      }
    }
    return balances;
  }

  /**
   * Approves amount for bridge transfer. If no amount is specified, the max amount is approved
   *
   * @param token The tokenId (chain and address) of the token being sent
   * @param Amount The amount to approve. If absent, will approve the maximum amount
   * @throws If unable to get the signer or contracts
   */
  async approve(
    chain: ChainName | ChainId,
    contractAddress: string,
    token: string,
    amount?: BigNumberish,
    overrides: PayableOverrides & { from?: string | Promise<string> } = {},
  ): Promise<ethers.ContractReceipt | void> {
    const signer = this.context.getSigner(chain);
    if (!signer) throw new Error(`No signer for ${chain}`);
    const senderAddress = await signer.getAddress();
    const tokenImplementation = TokenImplementation__factory.connect(
      token,
      signer,
    );
    if (!tokenImplementation)
      throw new Error(`token contract not available for ${token}`);

    const approved = await tokenImplementation.allowance(
      senderAddress,
      contractAddress,
    );
    const approveAmount = amount || constants.MaxUint256;
    // Approve if necessary
    if (approved.lt(approveAmount)) {
      const tx = await tokenImplementation.approve(
        contractAddress,
        approveAmount,
        overrides,
      );
      await tx.wait();
    }
  }

  async prepareSend(
    token: TokenId | typeof NATIVE,
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    relayerFee: ethers.BigNumberish = 0,
    overrides: PayableOverrides & { from?: string | Promise<string> } = {},
  ): Promise<ethers.PopulatedTransaction> {
    const destContext = this.context.getContext(recipientChain);
    const recipientChainId = this.context.toChainId(recipientChain);
    const sendingChainName = this.context.toChainName(sendingChain);
    const amountBN = ethers.BigNumber.from(amount);
    const bridge = this.contracts.mustGetBridge(sendingChain);

    let recipientAccount = recipientAddress;
    // get token account for solana
    if (recipientChainId === 1) {
      let tokenId = token;
      if (token === NATIVE) {
        tokenId = {
          address: await bridge.WETH(),
          chain: sendingChainName,
        };
      }
      const account = await (
        destContext as SolanaContext<WormholeContext>
      ).getAssociatedTokenAddress(tokenId as TokenId, recipientAddress);
      recipientAccount = account.toString();
    }

    if (token === NATIVE) {
      // sending native ETH
      await bridge.callStatic.wrapAndTransferETH(
        recipientChainId,
        destContext.formatAddress(recipientAccount),
        relayerFee,
        createNonce(),
        {
          ...overrides,
          value: amountBN,
          from: senderAddress,
        },
      );
      return bridge.populateTransaction.wrapAndTransferETH(
        recipientChainId,
        destContext.formatAddress(recipientAccount),
        relayerFee,
        createNonce(),
        {
          ...overrides,
          value: amountBN,
        },
      );
    } else {
      // sending ERC-20
      //approve and send
      const tokenAddr = await this.mustGetForeignAsset(token, sendingChain);
      // simulate transaction
      await bridge.callStatic.transferTokens(
        tokenAddr,
        amountBN,
        recipientChainId,
        destContext.formatAddress(recipientAccount),
        relayerFee,
        createNonce(),
        {
          ...overrides,
          from: senderAddress,
        },
      );
      return bridge.populateTransaction.transferTokens(
        tokenAddr,
        amountBN,
        recipientChainId,
        destContext.formatAddress(recipientAccount),
        relayerFee,
        createNonce(),
        overrides,
      );
    }
  }

  async send(
    token: TokenId | typeof NATIVE,
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    relayerFee: ethers.BigNumberish = 0,
    overrides: PayableOverrides & { from?: string | Promise<string> } = {},
  ): Promise<ethers.ContractReceipt> {
    const signer = this.context.getSigner(sendingChain);
    if (!signer) throw new Error(`No signer for ${sendingChain}`);

    // approve for ERC-20 token transfers
    if (token !== NATIVE) {
      const amountBN = ethers.BigNumber.from(amount);
      const bridge = this.contracts.mustGetBridge(sendingChain);
      const tokenAddr = await this.mustGetForeignAsset(token, sendingChain);
      await this.approve(
        sendingChain,
        bridge.address,
        tokenAddr,
        amountBN,
        overrides,
      );
    }

    // prepare and simulate transfer
    const tx = await this.prepareSend(
      token,
      amount,
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
      relayerFee,
      overrides,
    );

    const v = await signer.sendTransaction(tx);
    return await v.wait();
  }

  async sendWithPayload(
    token: TokenId | typeof NATIVE,
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    payload: Uint8Array,
    overrides: PayableOverrides & { from?: string | Promise<string> } = {},
  ): Promise<ethers.ContractReceipt> {
    const destContext = this.context.getContext(recipientChain);
    const recipientChainId = this.context.toChainId(recipientChain);
    const bridge = this.contracts.mustGetBridge(sendingChain);
    const amountBN = ethers.BigNumber.from(amount);

    if (token === NATIVE) {
      // sending native ETH
      const v = await bridge.wrapAndTransferETHWithPayload(
        recipientChainId,
        destContext.formatAddress(recipientAddress),
        createNonce(),
        payload,
        {
          ...overrides,
          value: amountBN,
        },
      );
      return await v.wait();
    } else {
      // sending ERC-20
      const tokenAddr = await this.mustGetForeignAsset(token, sendingChain);
      await this.approve(sendingChain, bridge.address, tokenAddr, amountBN);
      const v = await bridge.transferTokensWithPayload(
        tokenAddr,
        amountBN,
        recipientChainId,
        destContext.formatAddress(recipientAddress),
        createNonce(),
        payload,
        overrides,
      );
      return await v.wait();
    }
  }

  async prepareSendWithRelay(
    token: TokenId | 'native',
    amount: string,
    toNativeToken: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    overrides: PayableOverrides & { from?: string | Promise<string> } = {},
  ): Promise<ethers.PopulatedTransaction> {
    const destContext = this.context.getContext(recipientChain);
    const recipientChainId = this.context.toChainId(recipientChain);
    const amountBN = ethers.BigNumber.from(amount);
    const relayer = this.contracts.mustGetTokenBridgeRelayer(sendingChain);
    const nativeTokenBN = ethers.BigNumber.from(toNativeToken);

    if (token === NATIVE) {
      // sending native ETH
      return relayer.populateTransaction.wrapAndTransferEthWithRelay(
        nativeTokenBN,
        recipientChainId,
        destContext.formatAddress(recipientAddress),
        0, // opt out of batching
        {
          ...overrides,
          value: amountBN,
        },
      );
    } else {
      // sending ERC-20
      const tokenAddr = await this.mustGetForeignAsset(token, sendingChain);
      return relayer.populateTransaction.transferTokensWithRelay(
        this.parseAddress(tokenAddr),
        amountBN,
        nativeTokenBN,
        recipientChainId,
        destContext.formatAddress(recipientAddress),
        0, // opt out of batching
        overrides,
      );
    }
  }

  async sendWithRelay(
    token: TokenId | 'native',
    amount: string,
    toNativeToken: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    overrides: PayableOverrides & { from?: string | Promise<string> } = {},
  ): Promise<ethers.ContractReceipt> {
    const signer = this.context.getSigner(sendingChain);
    if (!signer) throw new Error(`No signer for ${sendingChain}`);

    // approve for ERC-20 token transfers
    if (token !== NATIVE) {
      const amountBN = ethers.BigNumber.from(amount);
      const relayer = this.contracts.mustGetTokenBridgeRelayer(sendingChain);
      const tokenAddr = await this.mustGetForeignAsset(token, sendingChain);
      await this.approve(
        sendingChain,
        relayer.address,
        tokenAddr,
        amountBN,
        overrides,
      );
    }

    // prepare and simulate transfer
    const tx = await this.prepareSendWithRelay(
      token,
      amount,
      toNativeToken,
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
      overrides,
    );

    const v = await signer.sendTransaction(tx);
    return await v.wait();
  }

  async prepareRedeem(
    destChain: ChainName | ChainId,
    signedVAA: Uint8Array,
    overrides: Overrides & { from?: string | Promise<string> } = {},
  ): Promise<PopulatedTransaction> {
    const bridge = this.contracts.mustGetBridge(destChain);
    await bridge.callStatic.completeTransfer(signedVAA, overrides);
    return bridge.populateTransaction.completeTransfer(signedVAA, overrides);
  }

  async redeem(
    destChain: ChainName | ChainId,
    signedVAA: Uint8Array,
    overrides: Overrides & { from?: string | Promise<string> } = {},
  ): Promise<ContractReceipt> {
    const signer = this.context.getSigner(destChain);
    if (!signer) throw new Error(`No signer for ${destChain}`);
    const tx = await this.prepareRedeem(destChain, signedVAA, overrides);
    const v = await signer.sendTransaction(tx);
    return await v.wait();
    // TODO: unwrap native assets
    // const v = await bridge.completeTransferAndUnwrapETH(signedVAA, overrides);
    // const receipt = await v.wait();
    // return receipt;
  }

  async estimateSendGas(
    token: TokenId | typeof NATIVE,
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
  ): Promise<BigNumber> {
    const provider = this.context.mustGetProvider(sendingChain);
    const { gasPrice } = await provider.getFeeData();
    if (!gasPrice)
      throw new Error('gas price not available, cannot estimate fees');
    const tx = await this.prepareSend(
      token,
      amount,
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
      undefined,
    );
    const est = await provider.estimateGas(tx);
    return est.mul(gasPrice);
  }
  async estimateClaimGas(
    destChain: ChainName | ChainId,
    VAA: Uint8Array,
  ): Promise<BigNumber> {
    const provider = this.context.mustGetProvider(destChain);
    const { gasPrice } = await provider.getFeeData();
    if (!gasPrice)
      throw new Error('gas price not available, cannot estimate fees');
    const tx = await this.prepareRedeem(destChain, VAA);
    const est = await provider.estimateGas(tx);
    return est.mul(gasPrice);
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
    const provider = this.context.mustGetProvider(sendingChain);
    const { gasPrice } = await provider.getFeeData();
    if (!gasPrice)
      throw new Error('gas price not available, cannot estimate fees');
    const tx = await this.prepareSendWithRelay(
      token,
      amount,
      toNativeToken,
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
    );
    const est = await provider.estimateGas(tx);
    return est.mul(gasPrice);
  }

  async calculateMaxSwapAmount(
    destChain: ChainName | ChainId,
    tokenId: TokenId,
    walletAddress: string,
  ): Promise<BigNumber> {
    const relayer = this.contracts.mustGetTokenBridgeRelayer(destChain);
    const token = await this.mustGetForeignAsset(tokenId, destChain);
    return await relayer.calculateMaxSwapAmountIn(token);
  }

  async calculateNativeTokenAmt(
    destChain: ChainName | ChainId,
    tokenId: TokenId,
    amount: BigNumberish,
    walletAddress: string,
  ): Promise<BigNumber> {
    const relayer = this.contracts.mustGetTokenBridgeRelayer(destChain);
    const token = await this.mustGetForeignAsset(tokenId, destChain);
    return await relayer.calculateNativeSwapAmountOut(token, amount);
  }

  async getReceipt(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<ContractReceipt> {
    const provider = this.context.mustGetProvider(chain);
    const receipt = await provider.getTransactionReceipt(tx);
    if (!receipt) throw new Error(`No receipt for ${tx} on ${chain}`);
    return receipt;
  }

  async getMessage(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<ParsedMessage | ParsedRelayerMessage> {
    const provider = this.context.mustGetProvider(chain);
    const receipt = await provider.getTransactionReceipt(tx);
    if (!receipt) throw new Error(`No receipt for ${tx} on ${chain}`);

    const bridge = this.contracts.mustGetBridge(chain);
    const core = this.contracts.mustGetCore(chain);
    const bridgeLogs = receipt.logs.filter((l: any) => {
      return l.address === core.address;
    });

    if (bridgeLogs.length === 0) {
      throw new Error(NO_VAA_FOUND);
    }

    let gasFee: BigNumber = BigNumber.from(0);
    if (receipt.gasUsed && receipt.effectiveGasPrice) {
      gasFee = receipt.gasUsed.mul(receipt.effectiveGasPrice);
    }

    const fromChain = this.context.toChainName(chain);

    const parsed = Implementation__factory.createInterface().parseLog(
      bridgeLogs[0],
    );

    // TODO: refactor everything from here to the end
    if (parsed.args.payload.startsWith('0x01')) {
      const transfer = await bridge.parseTransfer(parsed.args.payload);
      const tokenChain = this.context.toChainName(transfer.tokenChain);
      const toChain = this.context.toChainName(transfer.toChain);
      const destContext = this.context.getContext(toChain);
      const tokenContext = this.context.getContext(tokenChain);
      const tokenAddress = await tokenContext.parseAssetAddress(
        utils.hexlify(transfer.tokenAddress),
      );
      return {
        sendTx: tx,
        sender: receipt.from,
        amount: transfer.amount,
        payloadID: transfer.payloadID,
        recipient: destContext.parseAddress(transfer.to),
        toChain: this.context.toChainName(transfer.toChain),
        fromChain,
        tokenAddress,
        tokenChain,
        tokenId: {
          chain: tokenChain,
          address: tokenAddress,
        },
        sequence: parsed.args.sequence,
        emitterAddress: utils.hexlify(this.formatAddress(bridge.address)),
        block: receipt.blockNumber,
        gasFee,
      };
    }

    const transferWithPayload = await bridge.parseTransferWithPayload(
      parsed.args.payload,
    );
    const tokenChain = this.context.toChainName(transferWithPayload.tokenChain);
    const toChain = this.context.toChainName(transferWithPayload.toChain);
    const destContext = this.context.getContext(toChain);
    const tokenContext = this.context.getContext(tokenChain);
    const tokenAddress = await tokenContext.parseAssetAddress(
      utils.hexlify(transferWithPayload.tokenAddress),
    );
    /**
     * Not all relayers follow the same payload structure (i.e. sei)
     * so we request the destination context to parse the payload
     */
    const relayerPayload: ParsedRelayerPayload =
      destContext.parseRelayerPayload(
        Buffer.from(arrayify(transferWithPayload.payload)),
      );

    const relayerMessage: ParsedRelayerMessage = {
      sendTx: tx,
      sender: receipt.from,
      amount: transferWithPayload.amount,
      payloadID: transferWithPayload.payloadID,
      toChain: this.context.toChainName(transferWithPayload.toChain),
      fromChain,
      tokenAddress,
      tokenChain,
      tokenId: {
        chain: tokenChain,
        address: tokenAddress,
      },
      sequence: parsed.args.sequence,
      emitterAddress: utils.hexlify(this.formatAddress(bridge.address)),
      block: receipt.blockNumber,
      gasFee,
      relayerPayloadId: relayerPayload.relayerPayloadId,
      recipient: destContext.parseAddress(relayerPayload.to),
      relayerFee: relayerPayload.relayerFee,
      toNativeTokenAmount: relayerPayload.toNativeTokenAmount,
      to: destContext.parseAddress(utils.hexlify(transferWithPayload.to)),
      payload: transferWithPayload.payload,
    };
    return relayerMessage;
  }

  async getRelayerFee(
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    tokenId: TokenId,
  ): Promise<BigNumber> {
    const relayer = this.contracts.mustGetTokenBridgeRelayer(sourceChain);
    // get asset address
    const address = await this.mustGetForeignAsset(tokenId, sourceChain);
    // get token decimals
    const provider = this.context.mustGetProvider(sourceChain);
    const tokenContract = TokenImplementation__factory.connect(
      address,
      provider,
    );
    const decimals = await tokenContract.decimals();
    // get relayer fee as token amt
    const destChainId = this.context.toChainId(destChain);
    return await relayer.calculateRelayerFee(destChainId, address, decimals);
  }

  async isTransferCompleted(
    destChain: ChainName | ChainId,
    signedVaa: string,
  ): Promise<boolean> {
    const tokenBridge = this.contracts.mustGetBridge(destChain);
    const hash = parseVaa(
      utils.arrayify(signedVaa, { allowMissingPrefix: true }),
    ).hash;
    return await tokenBridge.isTransferCompleted(hash);
  }

  formatAddress(address: string): Uint8Array {
    return Buffer.from(utils.zeroPad(address, 32));
  }

  parseAddress(address: ethers.utils.BytesLike): string {
    const parsed = utils.hexlify(utils.stripZeros(address));
    return utils.getAddress(parsed);
  }

  async formatAssetAddress(address: string): Promise<Uint8Array> {
    return this.formatAddress(address);
  }

  async parseAssetAddress(address: string): Promise<string> {
    return this.parseAddress(address);
  }

  async getCurrentBlock(chain: ChainName | ChainId): Promise<number> {
    const provider = this.context.mustGetProvider(chain);
    return await provider.getBlockNumber();
  }
}
