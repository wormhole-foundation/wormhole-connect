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
import { arrayify, zeroPad } from 'ethers/lib/utils';
import { WormholeContext } from '../wormhole';
import { Context } from './contextAbstract';
import {
  TokenId,
  ChainName,
  ChainId,
  NATIVE,
  ParsedRelayerMessage,
  ParsedMessage,
} from '../types';

export class EthContext<T extends WormholeContext> extends Context {
  readonly context: T;

  constructor(context: T) {
    super();
    this.context = context;
  }

  async getForeignAsset(tokenId: TokenId, chain: ChainName | ChainId) {
    const toChainId = this.context.resolveDomain(chain);
    const chainId = this.context.resolveDomain(tokenId.chain);
    // if the token is already native, return the token address
    if (toChainId === chainId) return tokenId.address;
    // else fetch the representation
    const tokenBridge = this.context.mustGetBridge(chain);
    const tokenAddr = '0x' + this.formatAddress(tokenId.address);
    return await tokenBridge.wrappedAsset(
      chainId,
      ethers.utils.arrayify(tokenAddr),
    );
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
    token: TokenId,
    amount?: BigNumberish,
    overrides?: any,
  ) {
    const signer = this.context.getSigner(chain);
    if (!signer) throw new Error(`No signer for ${chain}`);
    const senderAddress = await signer.getAddress();
    const tokenAddress = await this.getForeignAsset(token, chain);
    const tokenImplementation = TokenImplementation__factory.connect(
      tokenAddress,
      signer,
    );
    if (!tokenImplementation)
      throw new Error(`token contract not available for ${token.address}`);

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
    const isAddress = ethers.utils.isAddress(recipientAddress);
    if (!isAddress)
      throw new Error(`invalid recipient address: ${recipientAddress}`);
    const recipientChainId = this.context.resolveDomain(recipientChain);
    const amountBN = ethers.BigNumber.from(amount);
    const bridge = this.context.mustGetBridge(sendingChain);

    if (token === NATIVE) {
      // sending native ETH
      const v = await bridge.wrapAndTransferETH(
        recipientChainId,
        '0x' + this.formatAddress(recipientAddress),
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
      await this.approve(sendingChain, bridge.address, token, amountBN);
      const v = await bridge.transferTokens(
        token.address,
        amountBN,
        recipientChainId,
        '0x' + this.formatAddress(recipientAddress),
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
    const isAddress = ethers.utils.isAddress(recipientAddress);
    if (!isAddress)
      throw new Error(`invalid recipient address: ${recipientAddress}`);
    const recipientChainId = this.context.resolveDomain(recipientChain);
    const bridge = this.context.mustGetBridge(sendingChain);
    const amountBN = ethers.BigNumber.from(amount);

    if (token === NATIVE) {
      // sending native ETH
      const v = await bridge.wrapAndTransferETHWithPayload(
        recipientChainId,
        recipientAddress,
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
      await this.approve(sendingChain, bridge.address, token, amountBN);
      const v = await bridge.transferTokensWithPayload(
        token.address,
        amountBN,
        recipientChainId,
        recipientAddress,
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
    const recipientChainId = this.context.resolveDomain(recipientChain);
    const amountBN = ethers.BigNumber.from(amount);
    const relayer = this.context.mustGetTBRelayer(sendingChain);
    const nativeTokenBN = ethers.BigNumber.from(toNativeToken);
    const formattedRecipient = `0x${this.formatAddress(recipientAddress)}`;
    // const unwrapWeth = await relayer.unwrapWeth(); // TODO: check unwrapWeth flag

    if (token === 'native') {
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
      const tokenAddr = (token as TokenId).address;
      if (!tokenAddr) throw new Error('no token address found');
      console.log('send with relay');
      // sending ERC-20
      //approve and send
      await this.approve(sendingChain, relayer.address, token as TokenId, amountBN);
      const tx = await relayer.transferTokensWithRelay(
        tokenAddr,
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
    const bridge = this.context.mustGetBridge(destChain);
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
    const relayer = this.context.mustGetTBRelayer(destChain);
    const token = await this.getForeignAsset(tokenId, destChain);
    return await relayer.calculateMaxSwapAmountIn(token);
  }

  async calculateNativeTokenAmt(
    destChain: ChainName | ChainId,
    tokenId: TokenId,
    amount: BigNumberish,
  ): Promise<BigNumber> {
    const relayer = this.context.mustGetTBRelayer(destChain);
    const token = await this.getForeignAsset(tokenId, destChain);
    return await relayer.calculateNativeSwapAmountOut(token, amount);
  }

  async parseMessageFromTx(tx: string, chain: ChainName | ChainId) {
    const provider = this.context.mustGetProvider(chain);
    const receipt = await provider.getTransactionReceipt(tx);
    console.log(receipt);
    if (!receipt) throw new Error(`No receipt for ${tx} on ${chain}`);
    // const core = context.mustGetCore(chain);
    const contracts = this.context.mustGetContracts(chain);
    if (!contracts.core || !contracts.bridge)
      throw new Error('contracts not found');
    const bridgeLogs = receipt.logs.filter((l: any) => {
      return l.address === contracts.core!.address;
    });
    const parsedLogs = bridgeLogs.map(async (bridgeLog) => {
      const parsed =
        Implementation__factory.createInterface().parseLog(bridgeLog);
      if (!contracts.tokenBridgeRelayer)
        throw new Error('relayer contract not found');

      const fromChain = this.context.resolveDomainName(chain) as ChainName;
      if (parsed.args.payload.startsWith('0x01')) {
        const parsedTransfer = await contracts.bridge!.parseTransfer(
          parsed.args.payload,
        ); // for bridge messages
        const parsedMessage: ParsedMessage = {
          sendTx: tx,
          sender: receipt.from,
          amount: parsedTransfer.amount,
          payloadID: parsedTransfer.payloadID,
          recipient: parsedTransfer.to,
          toChain: this.context.resolveDomainName(
            parsedTransfer.toChain,
          ) as ChainName,
          fromChain,
          tokenAddress: parsedTransfer.tokenAddress,
          tokenChain: this.context.resolveDomainName(
            parsedTransfer.tokenChain,
          ) as ChainName,
        };
        return parsedMessage;
      }
      const parsedTransfer = await contracts.bridge!.parseTransferWithPayload(
        parsed.args.payload,
      );
      const parsedPayload =
        await contracts.tokenBridgeRelayer!.decodeTransferWithRelay(
          parsedTransfer.payload,
        );
      const parsedMessage: ParsedRelayerMessage = {
        sendTx: tx,
        sender: receipt.from,
        amount: parsedTransfer.amount,
        payloadID: parsedTransfer.payloadID,
        to: this.parseAddress(parsedTransfer.to),
        toChain: this.context.resolveDomainName(
          parsedTransfer.toChain,
        ) as ChainName,
        fromChain,
        tokenAddress: this.parseAddress(parsedTransfer.tokenAddress),
        tokenChain: this.context.resolveDomainName(
          parsedTransfer.tokenChain,
        ) as ChainName,
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
    const relayer = this.context.mustGetTBRelayer(sourceChain);
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
    const destChainId = this.context.resolveDomain(destChain);
    return await relayer.calculateRelayerFee(destChainId, address, decimals);
  }

  formatAddress(address: string): string {
    return Buffer.from(zeroPad(arrayify(address), 32)).toString('hex');
  }

  parseAddress(address: string): string {
    if (address.length === 42) return address;
    return '0x' + address.slice(26);
  }
}
