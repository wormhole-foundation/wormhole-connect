import { Network } from './types';
import { Domain, MultiProvider } from './multi-provider';

import MAINNET_CONFIG, { MAINNET_CHAINS } from './config/MAINNET';
import TESTNET_CONFIG, { TESTNET_CHAINS } from './config/TESTNET';
import {
  AnyContext,
  ChainId,
  ChainName,
  Context,
  ParsedMessage,
  ParsedRelayerMessage,
  TokenId,
  WormholeConfig,
} from './types';
import DEVNET_CONFIG, { DEVNET_CHAINS } from './config/DEVNET';

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
  readonly conf: WormholeConfig;

  constructor(env: Network, conf?: WormholeConfig) {
    super();

    if (conf) {
      this.conf = conf;
    } else {
      this.conf = WormholeContext.getConfig(env);
    }

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
   * Returns the chain "context", i.e. the class with chain-specific logic and methods
   * @param chain the chain name or chain id
   * @returns the chain context class
   * @throws Errors if context is not found
   */
  getContext(chain: ChainName | ChainId): AnyContext {
    // TODO SDKV2 REMOVE
    return this;
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
    parseRelayerPayload = true,
  ): Promise<ParsedMessage | ParsedRelayerMessage> {
    const context = this.getContext(chain);
    /* @ts-ignore TODO SDKV2 */
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

  // BEGIN stubbed methods for SDKV2 migration
  // TODO SDKV2

  sign() {
    console.log('TODO remove');
  }

  async approve(a: any, b: any, c: any, d: any): Promise<boolean> {
    return true;
  }

  getCurrentBlock() {
    return 0;
  }

  /* @ts-ignore */
  mustGetProvider(a: any) {
    console.log('TODO remove');
  }

  get contracts() {
    return {
      mustGetCore(a: any) {
        console.log('TODO remove');
      },
      mustGetBridge(a: any) {
        console.log('TODO remove');
      },
    };
  }
}
