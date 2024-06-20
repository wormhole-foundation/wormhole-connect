import { Network } from './types';
import { Domain, MultiProvider } from '@nomad-xyz/multi-provider';
import { BigNumber } from 'ethers';

import MAINNET_CONFIG, { MAINNET_CHAINS } from './config/MAINNET';
import TESTNET_CONFIG, { TESTNET_CHAINS } from './config/TESTNET';
import { AptosContext } from './contexts/aptos';
import { EthContext } from './contexts/eth';
import { SolanaContext } from './contexts/solana/context';
import { SuiContext } from './contexts/sui';
import {
  AnyContext,
  ChainId,
  ChainName,
  Context,
  Contracts,
  NATIVE,
  ParsedMessage,
  ParsedRelayerMessage,
  RedeemResult,
  SendResult,
  TokenId,
  WormholeConfig,
} from './types';
import { SeiContext } from './contexts/sei';
import DEVNET_CONFIG, { DEVNET_CHAINS } from './config/DEVNET';
import { CosmosContext } from './contexts/cosmos';
import { ForeignAssetCache } from './utils';

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
  private foreignAssetCache: ForeignAssetCache;
  readonly conf: WormholeConfig;

  constructor(
    env: Network,
    conf?: WormholeConfig,
    foreignAssetCache?: ForeignAssetCache,
  ) {
    super();

    if (conf) {
      this.conf = conf;
    } else {
      this.conf = WormholeContext.getConfig(env);
    }

    this.foreignAssetCache = foreignAssetCache || new ForeignAssetCache();

    this.registerProviders();
  }

  get environment(): string {
    return this.conf.env;
  }

  /**
   * Registers evm providers
   */
  registerProviders() {
    for (const network of Object.keys(this.conf.rpcs)) {
      const n = network as ChainName;
      const chains =
        this.conf.env === 'mainnet'
          ? MAINNET_CHAINS
          : this.conf.env === 'devnet'
          ? DEVNET_CHAINS
          : TESTNET_CHAINS;
      const chainConfig = (chains as any)[n];
      if (!chainConfig) throw new Error(`invalid network name ${n}`);
      // register domain
      this.registerDomain({
        // @ts-ignore
        domain: chainConfig,
        name: network,
      });
      // register RPC provider
      if (this.conf.rpcs[n]) {
        if (this.conf.chains[n]?.context === Context.ETH) {
          this.registerRpcProvider(network, this.conf.rpcs[n]!);
        }
      }
    }
  }

  /**
   * Converts to chain id
   * @param nameOrId the chain name or chain id
   * @returns the chain id
   */
  toChainId(nameOrId: string | number) {
    return super.resolveDomain(nameOrId) as ChainId;
  }

  /**
   * Converts to chain name
   * @param nameOrId the chain name or chain id
   * @returns the chain name
   */
  toChainName(nameOrId: string | number) {
    return super.resolveDomainName(nameOrId) as ChainName;
  }

  /**
   * Gets the contract addresses for a given chain
   * @param chain the chain name or chain id
   * @returns the contract addresses
   */
  getContracts(chain: ChainName | ChainId): Contracts | undefined {
    const chainName = this.toChainName(chain);
    return this.conf.chains[chainName]?.contracts;
  }

  /**
   * Gets the contract addresses for a given chain
   * @param chain the chain name or chain id
   * @returns the contract addresses
   * @throws Errors if contracts are not found
   */
  mustGetContracts(chain: ChainName | ChainId): Contracts {
    const contracts = this.getContracts(chain);
    if (!contracts) throw new Error(`no contracts found for ${chain}`);
    return contracts;
  }

  /**
   * Returns the chain "context", i.e. the class with chain-specific logic and methods
   * @param chain the chain name or chain id
   * @returns the chain context class
   * @throws Errors if context is not found
   */
  getContext(chain: ChainName | ChainId): AnyContext {
    const chainName = this.toChainName(chain);
    const { context } = this.conf.chains[chainName]!;
    switch (context) {
      case Context.ETH: {
        return new EthContext(this, this.foreignAssetCache);
      }
      case Context.SOLANA: {
        return new SolanaContext(this, this.foreignAssetCache);
      }
      case Context.SUI: {
        return new SuiContext(this, this.foreignAssetCache);
      }
      case Context.APTOS: {
        return new AptosContext(this, this.foreignAssetCache);
      }
      case Context.SEI: {
        return new SeiContext(this, this.foreignAssetCache);
      }
      case Context.COSMOS: {
        return new CosmosContext(this, chainName, this.foreignAssetCache);
      }
      default: {
        throw new Error('Not able to retrieve context');
      }
    }
  }

  /**
   * Fetches the address for a token representation on any chain (These are the Wormhole token addresses, not necessarily the canonical version of that token)
   *
   * @param tokenId The Token ID (chain/address)
   * @param chain The chain name or id
   * @returns The Wormhole address on the given chain, null if it does not exist
   */
  async getForeignAsset(
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<string | null> {
    const context = this.getContext(chain);
    return await context.getForeignAsset(tokenId, chain);
  }

  /**
   * Fetches the address for a token representation on any chain (These are the Wormhole token addresses, not necessarily the canonical version of that token)
   *
   * @param tokenId The Token ID (chain/address)
   * @param chain The chain name or id
   * @returns The Wormhole address on the given chain
   * @throws Throws if the token does not exist
   */
  async mustGetForeignAsset(
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<string> {
    const context = this.getContext(chain);
    return await context.mustGetForeignAsset(tokenId, chain);
  }

  /**
   * Fetches the number of decimals for a token on a given chain
   *
   * @param tokenId The Token ID (home chain/address)
   * @param chain The chain name or id of the token/representation
   * @returns The number of decimals
   */
  async fetchTokenDecimals(
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<number> {
    const context = this.getContext(chain);
    const repr = await context.mustGetForeignAsset(tokenId, chain);
    return await context.fetchTokenDecimals(repr, chain);
  }

  /**
   * Fetches the native token balance for a wallet
   *
   * @param walletAddress The wallet address
   * @param chain The chain name or id
   * @returns The native balance as a BigNumber
   */
  async getNativeBalance(
    walletAddress: string,
    chain: ChainName | ChainId,
    asset?: string,
  ): Promise<BigNumber> {
    const context = this.getContext(chain);
    return await context.getNativeBalance(walletAddress, chain, asset);
  }

  /**
   * Fetches the balance of a given token for a wallet
   *
   * @param walletAddress The wallet address
   * @param tokenId The token ID (its home chain and address on the home chain)
   * @param chain The chain name or id
   * @returns The token balance of the wormhole asset as a BigNumber
   */
  async getTokenBalance(
    walletAddress: string,
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<BigNumber | null> {
    const context = this.getContext(chain);
    return await context.getTokenBalance(walletAddress, tokenId, chain);
  }

  /**
   * Fetches the balance of the given tokens for a wallet
   *
   * @param walletAddress The wallet address
   * @param tokenIds The token IDs (their home chain and address on the home chain)
   * @param chain The chain name or id
   * @returns The token balance of the wormhole asset as a BigNumber
   */
  async getTokenBalances(
    walletAddress: string,
    tokenIds: TokenId[],
    chain: ChainName | ChainId,
  ): Promise<(BigNumber | null)[]> {
    const context = this.getContext(chain);
    return await context.getTokenBalances(walletAddress, tokenIds, chain);
  }

  /**
   * Check whether a chain supports automatic relaying
   * @param chain the chain name or chain id
   * @returns boolean representing if automatic relay is available
   */
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

  async redeemRelay(
    destChain: ChainName | ChainId,
    signedVAA: Uint8Array,
    overrides: any,
    receivingAddr?: string,
  ): Promise<SendResult> {
    const context = this.getContext(destChain);
    if (!('redeemRelay' in context)) {
      throw new Error('redeemRelay function not found');
    }
    return await context.redeemRelay(
      destChain,
      signedVAA,
      overrides,
      receivingAddr,
    );
  }

  /**
   * Checks if a transfer has been completed or not
   *
   * @param destChain The destination chain name or id
   * @param signedVAA The Signed VAA bytes
   * @returns True if the transfer has been completed, otherwise false
   */
  async isTransferCompleted(
    destChain: ChainName | ChainId,
    signedVaa: string,
  ): Promise<boolean> {
    const context = this.getContext(destChain);
    return await context.isTransferCompleted(destChain, signedVaa);
  }

  /**
   * Format an address to a 32-byte universal address, which can be utilized by the Wormhole contracts
   *
   * @param address The address as a string
   * @returns The address as a 32-byte Wormhole address
   */
  formatAddress(address: string, chain: ChainName | ChainId): any {
    const context = this.getContext(chain);
    return context.formatAddress(address);
  }

  /**
   * Parse an address from a 32-byte universal address to a canonical address
   *
   * @param address The 32-byte wormhole address
   * @returns The address in the blockchain specific format
   */
  parseAddress(address: any, chain: ChainName | ChainId): string {
    const context = this.getContext(chain);
    return context.parseAddress(address);
  }

  async getMessage(
    tx: string,
    chain: ChainName | ChainId,
    parseRelayerPayload: boolean = true,
  ): Promise<ParsedMessage | ParsedRelayerMessage> {
    const context = this.getContext(chain);
    return await context.getMessage(tx, chain, parseRelayerPayload);
  }

  /**
   * Fetches the wrapped native token ID for a given chain
   *
   * @param chain The chain name or id
   * @returns The native token ID
   */
  async getWrappedNativeTokenId(chain: ChainName | ChainId): Promise<TokenId> {
    const context = this.getContext(chain);
    return await context.getWrappedNativeTokenId(chain);
  }

  /**
   * Get the default config for Mainnet or Testnet
   *
   * @param environment 'MAINNET' or 'TESTNET'
   * @returns A Wormhole Config
   */
  static getConfig(env: Network): WormholeConfig {
    return env === 'mainnet'
      ? MAINNET_CONFIG
      : env === 'devnet'
      ? DEVNET_CONFIG
      : TESTNET_CONFIG;
  }
}
