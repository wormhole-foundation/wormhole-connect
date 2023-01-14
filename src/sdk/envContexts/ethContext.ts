import { Implementation__factory, TokenImplementation__factory } from '@certusone/wormhole-sdk/lib/cjs/ethers-contracts';
import { createNonce } from '@certusone/wormhole-sdk';
import { BigNumberish, constants, ethers, PayableOverrides } from 'ethers';
import { WormholeContext } from '../wormhole';
import { Context } from './contextAbstract';
import { TokenId, ChainName, ChainId, NATIVE } from '../types';
export class EthContext<T extends WormholeContext> extends Context {
  readonly context: T;

  constructor(context: T) {
    super();
    this.context = context;
  }
  /**
   * Approves amount for bridge transfer. If no amount is specified, the max amount is approved
   *
   * @param token The tokenId (chain and address) of the token being sent
   * @param Amount The amount to approve. If absent, will approve the maximum amount
   * @throws If unable to get the signer or contracts
   */
  async approve(token: TokenId, amount?: BigNumberish, overrides?: any) {
    const signer = this.context.getSigner(token.chain);
    if (!signer) throw new Error(`No signer for ${token.chain}`);
    const senderAddress = await signer.getAddress();
    const tokenImplementation = TokenImplementation__factory.connect(
      token.address,
      signer,
    );
    if (!tokenImplementation)
      throw new Error(`token contract not available for ${token.address}`);

    const bridgeAddress = this.context.mustGetBridge(token.chain).address;
    const approved = await tokenImplementation.allowance(
      senderAddress,
      bridgeAddress,
    );
    const approveAmount = amount || constants.MaxUint256;
    // Approve if necessary
    if (approved.lt(approveAmount)) {
      const tx = await tokenImplementation.approve(
        bridgeAddress,
        approveAmount,
        overrides,
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
        recipientAddress,
        relayerFee,
        createNonce(),
        {
          ...(overrides || {}),
          value: amountBN,
        },
      );
      return await v.wait();
    } else {
      // sending ERC-20
      const v = await bridge.transferTokens(
        token.address,
        amountBN,
        recipientChainId,
        recipientAddress,
        relayerFee,
        createNonce(),
        overrides,
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

  parseSequenceFromLog(receipt: ethers.ContractReceipt, chain: ChainName | ChainId): string {
    const sequences = this.parseSequencesFromLog(receipt, chain);
    if (sequences.length === 0) throw new Error('no sequence found in log');
    return sequences[0];
  }

  parseSequencesFromLog(receipt: ethers.ContractReceipt, chain: ChainName | ChainId): string[] {
    const bridgeAddress = this.context.mustGetBridge(chain);
    // TODO: dangerous!(?)
    const bridgeLogs = receipt.logs.filter((l: any) => {
      return l.address === bridgeAddress;
    });
    return bridgeLogs.map((bridgeLog) => {
      const {
        args: { sequence },
      } = Implementation__factory.createInterface().parseLog(bridgeLog);
      return sequence.toString();
    });
  }
}
