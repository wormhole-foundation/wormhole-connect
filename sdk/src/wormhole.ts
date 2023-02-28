import { Network as Environment } from '@certusone/wormhole-sdk';
import { MultiProvider, Domain } from '@nomad-xyz/multi-provider';
import { ContractReceipt, BigNumber } from 'ethers';
import { Transaction } from '@solana/web3.js';

import MAINNET_CONFIG, { MAINNET_CHAINS } from './config/MAINNET';
import TESTNET_CONFIG, { TESTNET_CHAINS } from './config/TESTNET';
import {
  WormholeConfig,
  ChainName,
  ChainId,
  Context,
  AnyContext,
  Contracts,
} from './types';
import { EthContext } from './contexts/ethContext';
import { SolanaContext } from './contexts/solanaContext';
import { TokenId } from './types';

/**
 * The WormholeContext manages connections to Wormhole Core, Bridge and NFT Bridge contracts.
 * It inherits from the {@link MultiProvider}, and ensures that its contracts
 * always use the latest registered providers and signers.
 *
 * For convenience, we've pre-constructed contexts for mainnet, testnet and devnet
 * deployments. These can be imported directly from the wormhole sdk.
 *
 * @example
 * // Set up mainnet and then access contracts as below:
 * const context = new WormholeContext('MAINNET');
 * let bridge = context.mustGetBridge('ethereum');
 *
 * // interact easily with any chain!
 * // supports EVM, Solana, Terra, etc
 * const tokenId = {
 *   chain: 'ethereum',
 *   address: '0x123...',
 * }
 * const receipt = context.send(
 *   tokenId,
 *   '10', // amount
 *   'ethereum', // sending chain
 *   '0x789...', // sender address
 *   'moonbeam', // destination chain
 *   '0x789..., // recipient address on destination chain
 * )
 */
export class WormholeContext extends MultiProvider<Domain> {
  protected _contexts: Map<Context, AnyContext>;
  readonly conf: WormholeConfig;

  constructor(env: Environment, conf?: WormholeConfig) {
    super();

    if (conf) {
      this.conf = conf;
    } else {
      this.conf = env === 'MAINNET' ? MAINNET_CONFIG : TESTNET_CONFIG;
    }

    this._contexts = new Map();
    this._contexts.set(Context.ETH, new EthContext(this));
    this._contexts.set(Context.SOLANA, new SolanaContext(this));

    for (const network of Object.keys(this.conf.rpcs)) {
      const n = network as ChainName;
      const chains = env === 'MAINNET' ? MAINNET_CHAINS : TESTNET_CHAINS;
      const chainConfig = (chains as any)[n];
      if (!chainConfig) throw new Error('invalid network name');
      // register domain
      this.registerDomain({
        // @ts-ignore
        domain: chainConfig,
        name: network,
      });
      // register RPC provider
      if (this.conf.rpcs[n]) {
        this.registerRpcProvider(network, this.conf.rpcs[n]!);
      }
    }
  }

  get environment(): string {
    return this.conf.env;
  }

  toChainId(nameOrId: string | number) {
    return super.resolveDomain(nameOrId) as ChainId;
  }

  toChainName(nameOrId: string | number) {
    return super.resolveDomainName(nameOrId) as ChainName;
  }

  getContracts(chain: ChainName | ChainId): Contracts | undefined {
    const chainName = this.toChainName(chain);
    return this.conf.chains[chainName]?.contracts;
  }

  mustGetContracts(chain: ChainName | ChainId): Contracts {
    const contracts = this.getContracts(chain);
    if (!contracts) throw new Error(`no contracts found for ${chain}`);
    return contracts;
  }

  getContext(chain: ChainName | ChainId): AnyContext {
    const chainName = this.toChainName(chain);
    const { context } = this.conf.chains[chainName]!;
    switch (context) {
      case Context.ETH: {
        return new EthContext(this);
      }
      case Context.SOLANA: {
        return new SolanaContext(this);
      }
      default: {
        throw new Error('Not able to retrieve context');
      }
    }
  }

  async getForeignAsset(tokenId: TokenId, chain: ChainName | ChainId) {
    const context = this.getContext(chain);
    return await context.getForeignAsset(tokenId, chain);
  }

  async fetchTokenDecimals(
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<number> {
    const context = this.getContext(chain);
    const repr = await context.getForeignAsset(tokenId, chain);
    return await context.fetchTokenDecimals(repr, chain);
  }

  async getNativeBalance(
    walletAddress: string,
    chain: ChainName | ChainId,
  ): Promise<BigNumber> {
    const context = this.getContext(chain);
    return await context.getNativeBalance(walletAddress, chain);
  }

  async getTokenBalance(
    walletAddress: string,
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<BigNumber | null> {
    const context = this.getContext(chain);
    return await context.getTokenBalance(walletAddress, tokenId, chain);
  }

  /**
   * Sends transaction to the bridge
   *
   * @param token The tokenId (chain and address) of the token being sent. Pass in 'native' to send native token
   * @param amount The amount to bridge
   * @param sendingChain The chain name or chain id of the source chain
   * @param senderAddress The address executing the transaction
   * @param recipientChain The chain name or chain id of the destination chain
   * @param recipientAddress The address which will receive funds on the destination chain
   * @param relayerFee
   * @param payload Extra bytes that can be passed along with the transfer
   * @throws If unable to get the signer or contracts, or if there is a problem executing the transaction
   */
  async send(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    relayerFee?: string,
    payload?: any,
  ): Promise<ContractReceipt | Transaction> {
    const context = this.getContext(sendingChain);
    if (payload) {
      return context.sendWithPayload(
        token,
        amount,
        sendingChain,
        senderAddress,
        recipientChain,
        recipientAddress,
        payload,
      );
    }
    return context.send(
      token,
      amount,
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
      relayerFee,
    );
  }

  /**
   * Sends transaction to the bridge using the relayer
   *
   * @param token The tokenId (chain and address) of the token being sent. Pass in 'native' to send native token
   * @param amount The amount to bridge
   * @param sendingChain The chain name or chain id of the source chain
   * @param senderAddress The address executing the transaction
   * @param recipientChain The chain name or chain id of the destination chain
   * @param recipientAddress The address which will receive funds on the destination chain
   * @param toNativeToken The amount of bridged funds that will be converted to the native gas token on the destination chain
   * @throws If unable to get the signer or contracts, or if there is a problem executing the transaction
   */
  async sendWithRelay(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    toNativeToken: string,
    relayerFee?: string,
  ): Promise<ContractReceipt> {
    // only supported on EVM
    const context = this.getContext(
      sendingChain,
    ) as EthContext<WormholeContext>;
    return context.sendWithRelay(
      token,
      amount,
      toNativeToken,
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
    );
  }

  async redeem(
    destChain: ChainName | ChainId,
    signedVAA: Uint8Array,
    overrides: any,
  ): Promise<any> {
    const context = this.getContext(destChain);
    return await context.redeem(destChain, signedVAA, overrides);
  }

  async isTransferCompleted(
    destChain: ChainName | ChainId,
    signedVaaHash: string,
  ): Promise<boolean> {
    const context = this.getContext(destChain);
    return await context.isTransferCompleted(destChain, signedVaaHash);
  }

  formatAddress(address: string, chain: ChainName | ChainId): any {
    const context = this.getContext(chain);
    return context.formatAddress(address);
  }

  parseAddress(address: any, chain: ChainName | ChainId): string {
    const context = this.getContext(chain);
    return context.parseAddress(address);
  }

  getTxIdFromReceipt(chain: ChainName | ChainId, receipt: any): string {
    const context = this.getContext(chain);
    return context.getTxIdFromReceipt(receipt);
  }

  /**
   * Get the default config for Mainnet or Testnet
   *
   * @param environment 'MAINNET' or 'TESTNET'
   * @returns A Wormhole Config
   */
  static async getConfig(env: Environment): Promise<WormholeConfig> {
    return env === 'MAINNET' ? MAINNET_CONFIG : TESTNET_CONFIG;
  }
}
