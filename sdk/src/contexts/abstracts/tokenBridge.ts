import { BigNumber } from 'ethers';
import { AnyContracts, TokenId, ChainName, ChainId, NATIVE } from '../../types';
import { WormholeContext } from 'wormhole';
import { TokenNotRegisteredError } from '../../errors';

/**
 * @abstract
 *
 * A standard set of methods for interacting with the Token Bridge contracts across any of the supported chains
 *
 * @example
 * const context = Wormhole.getContext(chain); // get the chain Context
 * context.send(...); // call any of the supported methods in a standardized uniform fashion
 */
export abstract class TokenBridgeAbstract<TransactionResult> {
  /**
   * A standard set of methods for accessing interfaces for Wormhole contracts on a given chain
   */
  protected abstract contracts: AnyContracts;
  protected abstract context: WormholeContext;

  /**
   * Format an address to a 32-byte universal address, which can be utilized by the Wormhole contracts
   *
   * @param address The address as a string
   * @returns The address as a 32-byte Wormhole address
   */
  protected abstract formatAddress(address: string): any;
  /**
   * Parse an address from a 32-byte universal address to a cannonical address
   *
   * @param address The 32-byte wormhole address
   * @returns The address in the blockchain specific format
   */
  protected abstract parseAddress(address: any): string;

  /**
   * Format a token address to 32-bytes universal address, which can be utilized by the Wormhole contracts
   *
   * How is this different from {@link WormholeContext#formatAddress | formatAddress}? Converting some assets to a universal representation might require querying a registry first
   *
   * @param address The token address as a string
   * @returns The token address as a 32-byte Wormhole address
   */
  protected abstract formatAssetAddress(address: string): Promise<any>;
  /**
   * Parse a token address from a 32-byte universal address to a cannonical token address
   *
   * How is this different from {@link WormholeContext#parseAddress | parseAddress}? Converting some assets from a universal to cannonical representation might require querying a registry first
   *
   * @param address The 32-byte wormhole address
   * @returns The token address in the blockchain specific format
   */
  protected abstract parseAssetAddress(address: any): Promise<string>;

  /**
   * Checks if a transfer has been completed or not
   *
   * @param destChain The destination chain name or id
   * @param signedVAA The Signed VAA bytes
   * @returns True if the transfer has been completed, otherwise false
   */
  protected abstract isTransferCompleted(
    destChain: ChainName | ChainId,
    signedVaa: string,
  ): Promise<boolean>;
}
