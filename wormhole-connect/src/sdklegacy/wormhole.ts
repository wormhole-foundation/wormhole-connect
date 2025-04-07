import { Domain, MultiProvider } from './multi-provider';

import MAINNET_CONFIG from './config/MAINNET';
import TESTNET_CONFIG from './config/TESTNET';
import { AnyContext, WormholeConfig } from './types';
import DEVNET_CONFIG from './config/DEVNET';
import { Network, Chain } from '@wormhole-foundation/sdk';

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
  }

  get environment(): string {
    return this.conf.env;
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
   * Get the default config for Mainnet or Testnet
   *
   * @param environment 'MAINNET' or 'TESTNET'
   * @returns A Wormhole Config
   */
  static getConfig(env: Network): WormholeConfig {
    return env === 'Mainnet'
      ? MAINNET_CONFIG
      : env === 'Devnet'
      ? DEVNET_CONFIG
      : TESTNET_CONFIG;
  }
}
