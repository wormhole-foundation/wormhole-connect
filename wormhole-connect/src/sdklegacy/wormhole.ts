import { Network } from './types';
import { Domain, MultiProvider } from './multi-provider';

import MAINNET_CONFIG from './config/MAINNET';
import TESTNET_CONFIG from './config/TESTNET';
import { AnyContext, Context, TokenId, WormholeConfig } from './types';
import DEVNET_CONFIG from './config/DEVNET';
import { Chain, toChainId } from '@wormhole-foundation/sdk';

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
 * let bridge = context.mustGetBridge('Ethereum');
 *
 * // interact easily with any chain!
 * // supports EVM, Solana, Terra, etc
 * const tokenId = {
 *   chain: 'Ethereum',
 *   address: '0x123...',
 * }
 * const receipt = context.send(
 *   tokenId,
 *   '10', // amount
 *   'Ethereum', // sending chain
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
    for (const chain of Object.keys(this.conf.rpcs)) {
      const chainId = toChainId(chain);
      if (!chainId) throw new Error(`Unknown chain ${chain}`);
      // register domain
      this.registerDomain({
        domain: chainId,
        name: chain,
      });
      // register RPC provider
      if (this.conf.chains[chain]?.context === Context.ETH) {
        this.registerRpcProvider(chain, this.conf.rpcs[chain]);
      }
    }
  }

  /**
   * Returns the chain "context", i.e. the class with chain-specific logic and methods
   * @param chain the chain name or chain id
   * @returns the chain context class
   * @throws Errors if context is not found
   */
  getContext(chain: Chain): AnyContext {
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
    destChain: Chain,
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
  formatAddress(address: string, chain: Chain): any {
    const context = this.getContext(chain);
    return context.formatAddress(address);
  }

  /**
   * Parse an address from a 32-byte universal address to a canonical address
   *
   * @param address The 32-byte wormhole address
   * @returns The address in the blockchain specific format
   */
  parseAddress(address: any, chain: Chain): string {
    const context = this.getContext(chain);
    return context.parseAddress(address);
  }

  /**
   * Fetches the wrapped native token ID for a given chain
   *
   * @param chain The chain name or id
   * @returns The native token ID
   */
  async getWrappedNativeTokenId(chain: Chain): Promise<TokenId> {
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
