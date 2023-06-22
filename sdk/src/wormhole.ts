import { Network as Environment } from '@certusone/wormhole-sdk';
import { Domain, MultiProvider } from '@nomad-xyz/multi-provider';
import { BigNumber } from 'ethers';

import MAINNET_CONFIG, { MAINNET_CHAINS } from './config/MAINNET';
import TESTNET_CONFIG, { TESTNET_CHAINS } from './config/TESTNET';
import { AptosContext } from './contexts/aptos';
import { EthContext } from './contexts/eth';
import { SolanaContext } from './contexts/solana';
import { SuiContext } from './contexts/sui';
import {
  AnyContext,
  ChainId,
  ChainName,
  Context,
  Contracts,
  ParsedMessage,
  ParsedRelayerMessage,
  RedeemResult,
  SendResult,
  TokenId,
  WormholeConfig,
} from './types';
import { SeiContext } from './contexts/sei';

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
    this._contexts.set(Context.SUI, new SuiContext(this));
    this._contexts.set(Context.APTOS, new AptosContext(this));
    this._contexts.set(Context.SEI, new SeiContext(this));

    this.registerProviders();
  }

  get environment(): string {
    return this.conf.env;
  }

  registerProviders() {
    for (const network of Object.keys(this.conf.rpcs)) {
      const n = network as ChainName;
      const chains =
        this.conf.env === 'MAINNET' ? MAINNET_CHAINS : TESTNET_CHAINS;
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
      case Context.SUI: {
        return new SuiContext(this);
      }
      case Context.APTOS: {
        return new AptosContext(this);
      }
      case Context.SEI: {
        return new SeiContext(this);
      }
      default: {
        throw new Error('Not able to retrieve context');
      }
    }
  }

  async getForeignAsset(
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<string | null> {
    const context = this.getContext(chain);
    return await context.getForeignAsset(tokenId, chain);
  }

  async mustGetForeignAsset(
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<string> {
    const context = this.getContext(chain);
    return await context.mustGetForeignAsset(tokenId, chain);
  }

  async fetchTokenDecimals(
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<number> {
    const context = this.getContext(chain);
    const repr = await context.mustGetForeignAsset(tokenId, chain);
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
    payload?: Uint8Array,
  ): Promise<SendResult> {
    const context = this.getContext(sendingChain);

    if (!payload && recipientChain === 'sei') {
      const { payload: seiPayload, receiver } = await (
        this.getContext('sei') as SeiContext<WormholeContext>
      ).buildSendPayload(token, recipientAddress);
      recipientAddress = receiver || recipientAddress;
      payload = seiPayload || payload;
    }

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

  supportsSendWithRelay(chain: ChainName | ChainId): boolean {
    return !!(
      this.getContracts(chain)?.relayer &&
      'sendWithRelay' in this.getContext(chain)
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
  ): Promise<SendResult> {
    if (!this.supportsSendWithRelay(sendingChain)) {
      throw new Error(
        `Relayer is not supported on ${this.toChainName(sendingChain)}`,
      );
    }

    const context = this.getContext(sendingChain);
    if (!('sendWithRelay' in context)) {
      throw new Error('sendWithRelay function not found');
    }

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
    receivingAddr?: string,
  ): Promise<RedeemResult> {
    const context = this.getContext(destChain);
    return await context.redeem(destChain, signedVAA, overrides, receivingAddr);
  }

  async isTransferCompleted(
    destChain: ChainName | ChainId,
    signedVaa: string,
  ): Promise<boolean> {
    const context = this.getContext(destChain);
    return await context.isTransferCompleted(destChain, signedVaa);
  }

  formatAddress(address: string, chain: ChainName | ChainId): any {
    const context = this.getContext(chain);
    return context.formatAddress(address);
  }

  parseAddress(address: any, chain: ChainName | ChainId): string {
    const context = this.getContext(chain);
    return context.parseAddress(address);
  }

  async parseMessageFromTx(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<ParsedMessage[] | ParsedRelayerMessage[]> {
    const context = this.getContext(chain);
    return await context.parseMessageFromTx(tx, chain);
  }

  /**
   * Get the default config for Mainnet or Testnet
   *
   * @param environment 'MAINNET' or 'TESTNET'
   * @returns A Wormhole Config
   */
  static getConfig(env: Environment): WormholeConfig {
    return env === 'MAINNET' ? MAINNET_CONFIG : TESTNET_CONFIG;
  }
}
