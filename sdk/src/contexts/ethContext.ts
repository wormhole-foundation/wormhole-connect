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
} from 'ethers';
import { utils } from 'ethers';

import { RelayerAbstract } from './abstracts';
import {
  TokenId,
  ChainName,
  ChainId,
  NATIVE,
  ParsedRelayerMessage,
  ParsedMessage,
} from '../types';
import { ChainsManager } from '../chainsManager';
import { EthContracts } from '../contracts/ethContracts';

export class EthContext<T extends ChainsManager> extends RelayerAbstract {
  protected contracts: EthContracts<T>;
  readonly context: T;

  constructor(context: T) {
    super();
    this.context = context;
    this.contracts = new EthContracts(context);
  }

  async getForeignAsset(tokenId: TokenId, chain: ChainName | ChainId) {
    const toChainId = this.context.toChainId(chain);
    const chainId = this.context.toChainId(tokenId.chain);
    // if the token is already native, return the token address
    if (toChainId === chainId) return tokenId.address;
    // else fetch the representation
    const tokenBridge = this.contracts.mustGetBridge(chain);
    const sourceContext = this.context.getContext(tokenId.chain);
    const tokenAddr = sourceContext.formatAddress(tokenId.address);
    return await tokenBridge.wrappedAsset(chainId, utils.arrayify(tokenAddr));
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
    if (address === constants.AddressZero) return null;
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
    const destContext = this.context.getContext(recipientChain);
    const recipientChainId = this.context.toChainId(recipientChain);
    const amountBN = ethers.BigNumber.from(amount);
    const bridge = this.contracts.mustGetBridge(sendingChain);

    if (token === NATIVE) {
      // sending native ETH
      const v = await bridge.wrapAndTransferETH(
        recipientChainId,
        destContext.formatAddress(recipientAddress),
        relayerFee,
        createNonce(),
        {
          // ...(overrides || {}), // TODO: fix overrides/gas limit here
          gasLimit: 250000,
          value: amountBN,
        },
      );
      return await v.wait();
    } else {
      // sending ERC-20
      //approve and send
      const tokenAddr = await this.getForeignAsset(token, sendingChain);
      await this.approve(sendingChain, bridge.address, tokenAddr, amountBN);
      const v = await bridge.transferTokens(
        destContext.parseAddress(tokenAddr),
        amountBN,
        recipientChainId,
        destContext.formatAddress(recipientAddress),
        relayerFee,
        createNonce(),
        // overrides,
        { gasLimit: 250000 },
      );
      return await v.wait();
    }
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
      const tokenAddr = await this.getForeignAsset(token, sendingChain);
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
    const isAddress = ethers.utils.isAddress(recipientAddress);
    if (!isAddress)
      throw new Error(`invalid recipient address: ${recipientAddress}`);
    const recipientChainId = this.context.toChainId(recipientChain);
    const amountBN = ethers.BigNumber.from(amount);
    const relayer = this.contracts.mustGetTokenBridgeRelayer(sendingChain);
    const nativeTokenBN = ethers.BigNumber.from(toNativeToken);
    const formattedRecipient = this.formatAddress(recipientAddress);
    // const unwrapWeth = await relayer.unwrapWeth(); // TODO: check unwrapWeth flag

    if (token === NATIVE) {
      console.log('wrap and send with relay');
      // sending native ETH
      const v = await relayer.wrapAndTransferEthWithRelay(
        nativeTokenBN,
        recipientChainId,
        formattedRecipient,
        0, // opt out of batching
        {
          // ...(overrides || {}), // TODO: fix overrides/gas limit here
          gasLimit: 250000,
          value: amountBN,
        },
      );
      return await v.wait();
    } else {
      console.log('send with relay');
      // sending ERC-20
      //approve and send
      const tokenAddr = await this.getForeignAsset(token, sendingChain);
      await this.approve(sendingChain, relayer.address, tokenAddr, amountBN);
      const tx = await relayer.transferTokensWithRelay(
        this.parseAddress(tokenAddr),
        amountBN,
        nativeTokenBN,
        recipientChainId,
        formattedRecipient,
        0, // opt out of batching
        {
          gasLimit: 250000,
        },
      );
      return await tx.wait();
    }
  }

  async redeem(
    destChain: ChainName | ChainId,
    signedVAA: Uint8Array,
    overrides: Overrides & { from?: string | Promise<string> } = {},
  ): Promise<ContractReceipt> {
    // TODO: could get destination chain by parsing VAA
    const bridge = this.contracts.mustGetBridge(destChain);
    const v = await bridge.completeTransfer(signedVAA, overrides);
    const receipt = await v.wait();
    return receipt;
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
    const token = await this.getForeignAsset(tokenId, destChain);
    return await relayer.calculateMaxSwapAmountIn(token);
  }

  async calculateNativeTokenAmt(
    destChain: ChainName | ChainId,
    tokenId: TokenId,
    amount: BigNumberish,
  ): Promise<BigNumber> {
    const relayer = this.contracts.mustGetTokenBridgeRelayer(destChain);
    const token = await this.getForeignAsset(tokenId, destChain);
    return await relayer.calculateNativeSwapAmountOut(token, amount);
  }

  async parseMessageFromTx(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<ParsedMessage[] | ParsedRelayerMessage[]> {
    const provider = this.context.mustGetProvider(chain);
    const receipt = await provider.getTransactionReceipt(tx);
    console.log(receipt);
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

      const fromChain = this.context.toChainName(chain);
      if (parsed.args.payload.startsWith('0x01')) {
        const parsedTransfer = await bridge.parseTransfer(parsed.args.payload); // for bridge messages
        const parsedMessage: ParsedMessage = {
          sendTx: tx,
          sender: receipt.from,
          amount: parsedTransfer.amount,
          payloadID: parsedTransfer.payloadID,
          recipient: parsedTransfer.to,
          toChain: this.context.toChainName(parsedTransfer.toChain),
          fromChain,
          tokenAddress: this.parseAddress(parsedTransfer.tokenAddress),
          tokenChain: this.context.toChainName(parsedTransfer.tokenChain),
          sequence: parsed.args.sequence,
        };
        return parsedMessage;
      }
      if (!relayer)
        throw new Error('no relayer contract to decode message payload');
      const parsedTransfer = await bridge.parseTransferWithPayload(
        parsed.args.payload,
      );
      const parsedPayload = await relayer.decodeTransferWithRelay(
        parsedTransfer.payload,
      );
      const parsedMessage: ParsedRelayerMessage = {
        sendTx: tx,
        sender: receipt.from,
        amount: parsedTransfer.amount,
        payloadID: parsedTransfer.payloadID,
        to: this.parseAddress(parsedTransfer.to),
        toChain: this.context.toChainName(parsedTransfer.toChain),
        fromChain,
        tokenAddress: this.parseAddress(parsedTransfer.tokenAddress),
        tokenChain: this.context.toChainName(parsedTransfer.tokenChain),
        sequence: parsed.args.sequence,
        payload: parsedTransfer.payload,
        relayerPayloadId: parsedPayload.payloadId,
        recipient: this.parseAddress(parsedPayload.targetRecipient),
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
    const address = await this.getForeignAsset(tokenId, sourceChain);
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
    signedVaaHash: string,
  ): Promise<boolean> {
    const tokenBridge = this.contracts.mustGetBridge(destChain);
    return await tokenBridge.isTransferCompleted(signedVaaHash);
  }

  formatAddress(address: string): ethers.utils.BytesLike {
    return Buffer.from(utils.zeroPad(address, 32));
  }

  parseAddress(address: ethers.utils.BytesLike): string {
    return utils.hexlify(utils.stripZeros(address));
  }
}
