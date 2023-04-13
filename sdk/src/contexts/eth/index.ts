import {
  Implementation__factory,
  TokenImplementation__factory,
} from '@certusone/wormhole-sdk/lib/cjs/ethers-contracts';
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
} from '../../types';
import { WormholeContext } from '../../wormhole';
import { EthContracts } from './contracts';
import { parseVaa } from '../../vaa';
import { RelayerAbstract } from '../abstracts/relayer';
import { SolanaContext } from '../solana';

export class EthContext<T extends WormholeContext> extends RelayerAbstract {
  protected contracts: EthContracts<T>;
  readonly context: T;

  constructor(context: T) {
    super();
    this.context = context;
    this.contracts = new EthContracts(context);
  }

  async getForeignAsset(
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<string | null> {
    const toChainId = this.context.toChainId(chain);
    const chainId = this.context.toChainId(tokenId.chain);
    // if the token is already native, return the token address
    if (toChainId === chainId) return tokenId.address;
    // else fetch the representation
    const tokenBridge = this.contracts.mustGetBridge(chain);
    const sourceContext = this.context.getContext(tokenId.chain);
    const tokenAddr = sourceContext.formatAddress(tokenId.address);
    const foreignAddr = await tokenBridge.wrappedAsset(
      chainId,
      utils.arrayify(tokenAddr),
    );
    if (foreignAddr === constants.AddressZero) return null;
    return foreignAddr;
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
    overrides?: any,
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
        // overrides,
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
    overrides?: PayableOverrides & { from?: string | Promise<string> },
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
          // ...(overrides || {}), // TODO: fix overrides/gas limit here
          gasLimit: 250000,
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
          // ...(overrides || {}), // TODO: fix overrides/gas limit here
          gasLimit: 250000,
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
        // overrides,
        { gasLimit: 250000, from: senderAddress },
      );
      return bridge.populateTransaction.transferTokens(
        tokenAddr,
        amountBN,
        recipientChainId,
        destContext.formatAddress(recipientAccount),
        relayerFee,
        createNonce(),
        // overrides,
        { gasLimit: 250000 },
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
    overrides?: PayableOverrides & { from?: string | Promise<string> },
  ): Promise<ethers.ContractReceipt> {
    const signer = this.context.getSigner(sendingChain);
    if (!signer) throw new Error(`No signer for ${sendingChain}`);

    // approve for ERC-20 token transfers
    if (token !== NATIVE) {
      const amountBN = ethers.BigNumber.from(amount);
      const bridge = this.contracts.mustGetBridge(sendingChain);
      const tokenAddr = await this.mustGetForeignAsset(token, sendingChain);
      await this.approve(sendingChain, bridge.address, tokenAddr, amountBN);
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
    overrides?: PayableOverrides & { from?: string | Promise<string> },
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
          ...(overrides || {}),
          value: amountBN,
        },
      );
      return await v.wait();
    } else {
      // sending ERC-20
      const tokenAddr = await this.mustGetForeignAsset(token, sendingChain);
      await this.approve(sendingChain, bridge.address, tokenAddr, amountBN);
      const v = await bridge.transferTokensWithPayload(
        destContext.parseAddress(tokenAddr),
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
    overrides?: PayableOverrides & { from?: string | Promise<string> },
  ): Promise<ethers.PopulatedTransaction> {
    const isAddress = ethers.utils.isAddress(recipientAddress);
    if (!isAddress)
      throw new Error(`invalid recipient address: ${recipientAddress}`);
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
          // ...(overrides || {}), // TODO: fix overrides/gas limit here
          gasLimit: 300000,
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
        {
          gasLimit: 300000,
        },
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
    overrides?: PayableOverrides & { from?: string | Promise<string> },
  ): Promise<ethers.ContractReceipt> {
    const signer = this.context.getSigner(sendingChain);
    if (!signer) throw new Error(`No signer for ${sendingChain}`);

    // approve for ERC-20 token transfers
    if (token !== NATIVE) {
      const amountBN = ethers.BigNumber.from(amount);
      const relayer = this.contracts.mustGetTokenBridgeRelayer(sendingChain);
      const tokenAddr = await this.mustGetForeignAsset(token, sendingChain);
      await this.approve(sendingChain, relayer.address, tokenAddr, amountBN);
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

  async calculateMaxSwapAmount(
    destChain: ChainName | ChainId,
    tokenId: TokenId,
  ): Promise<BigNumber> {
    const relayer = this.contracts.mustGetTokenBridgeRelayer(destChain);
    const token = await this.mustGetForeignAsset(tokenId, destChain);
    return await relayer.calculateMaxSwapAmountIn(token);
  }

  async calculateNativeTokenAmt(
    destChain: ChainName | ChainId,
    tokenId: TokenId,
    amount: BigNumberish,
  ): Promise<BigNumber> {
    const relayer = this.contracts.mustGetTokenBridgeRelayer(destChain);
    const token = await this.mustGetForeignAsset(tokenId, destChain);
    return await relayer.calculateNativeSwapAmountOut(token, amount);
  }

  async parseMessageFromTx(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<ParsedMessage[] | ParsedRelayerMessage[]> {
    const provider = this.context.mustGetProvider(chain);
    const receipt = await provider.getTransactionReceipt(tx);

    if (!receipt) throw new Error(`No receipt for ${tx} on ${chain}`);

    const core = this.contracts.mustGetCore(chain);
    const bridge = this.contracts.mustGetBridge(chain);
    const relayer = this.contracts.getTokenBridgeRelayer(chain);
    const bridgeLogs = receipt.logs.filter((l: any) => {
      return l.address === core.address;
    });
    const parsedLogs = bridgeLogs.map(async (bridgeLog) => {
      const parsed =
        Implementation__factory.createInterface().parseLog(bridgeLog);
      const gasFee = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice);

      // parse token bridge message
      const fromChain = this.context.toChainName(chain);
      if (parsed.args.payload.startsWith('0x01')) {
        const parsedTransfer = await bridge.parseTransfer(parsed.args.payload); // for bridge messages
        const destContext = this.context.getContext(
          parsedTransfer.toChain as ChainId,
        );
        const tokenContext = this.context.getContext(
          parsedTransfer.tokenChain as ChainId,
        );
        const parsedMessage: ParsedMessage = {
          sendTx: tx,
          sender: receipt.from,
          amount: parsedTransfer.amount,
          payloadID: parsedTransfer.payloadID,
          recipient: destContext.parseAddress(parsedTransfer.to),
          toChain: this.context.toChainName(parsedTransfer.toChain),
          fromChain,
          tokenAddress: tokenContext.parseAddress(parsedTransfer.tokenAddress),
          tokenChain: this.context.toChainName(parsedTransfer.tokenChain),
          sequence: parsed.args.sequence,
          emitterAddress: utils.hexlify(this.formatAddress(bridge.address)),
          block: receipt.blockNumber,
          gasFee,
        };
        return parsedMessage;
      }

      // parse token bridge relayer message
      if (!relayer)
        throw new Error('no relayer contract to decode message payload');
      const parsedTransfer = await bridge.parseTransferWithPayload(
        parsed.args.payload,
      );
      const destContext = this.context.getContext(
        parsedTransfer.toChain as ChainId,
      );
      const parsedPayload = await relayer.decodeTransferWithRelay(
        parsedTransfer.payload,
      );
      const parsedMessage: ParsedRelayerMessage = {
        sendTx: tx,
        sender: receipt.from,
        amount: parsedTransfer.amount,
        payloadID: parsedTransfer.payloadID,
        to: destContext.parseAddress(parsedTransfer.to),
        toChain: this.context.toChainName(parsedTransfer.toChain),
        fromChain,
        tokenAddress: this.parseAddress(parsedTransfer.tokenAddress),
        tokenChain: this.context.toChainName(parsedTransfer.tokenChain),
        sequence: parsed.args.sequence,
        emitterAddress: utils.hexlify(this.formatAddress(bridge.address)),
        block: receipt.blockNumber,
        gasFee,
        payload: parsedTransfer.payload,
        relayerPayloadId: parsedPayload.payloadId,
        recipient: destContext.parseAddress(parsedPayload.targetRecipient),
        relayerFee: parsedPayload.targetRelayerFee,
        toNativeTokenAmount: parsedPayload.toNativeTokenAmount,
      };
      return parsedMessage;
    });
    return await Promise.all(parsedLogs);
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
    const hash = parseVaa(utils.arrayify(signedVaa)).hash;
    return await tokenBridge.isTransferCompleted(hash);
  }

  formatAddress(address: string): ethers.utils.BytesLike {
    return Buffer.from(utils.zeroPad(address, 32));
  }

  parseAddress(address: ethers.utils.BytesLike): string {
    const parsed = utils.hexlify(utils.stripZeros(address));
    return utils.getAddress(parsed);
  }

  getTxIdFromReceipt(receipt: ethers.ContractReceipt) {
    return receipt.transactionHash;
  }
}
