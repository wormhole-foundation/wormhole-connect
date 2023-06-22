import { WormholeContext } from '../../wormhole';
import { ChainName, ChainId } from '../../types';

/**
 * A standard set of methods for accessing interfaces for Wormhole contracts on a given chain
 *
 * @example
 * const context = Wormhole.getContext(chain);
 * const coreContract = context.contracts.mustGetCore(chain);
 * coreContract.someMethod(...);
 */
export abstract class ContractsAbstract<T extends WormholeContext> {
  /**
   * Contract addresses mapped to a ChainName
   * @internal
   */
  protected abstract readonly _contracts: Map<ChainName, any>;
  /**
   * A reference to the chain Context
   * @internal
   */
  protected abstract readonly context: T;

  /**
   * Get the core wormhole contract interface
   * @param chain The name or ID of a supported chain
   * @returns The contract interface or undefined
   */
  protected abstract getCore(chain: ChainName | ChainId): any | undefined;
  /**
   * Get the core wormhole contract interface
   * @param chain The name or ID of a supported chain
   * @throws Errors if the contract doesn't exist
   * @returns The contract interface
   */
  protected abstract mustGetCore(chain: ChainName | ChainId): any;
  /**
   * Get the Token Bridge contract interface
   * @param chain The name or ID of a supported chain
   * @returns The token bridge contract interface or undefined
   */
  protected abstract getBridge(chain: ChainName | ChainId): any | undefined;
  /**
   * Get the Token Bridge contract interface
   * @param chain The name or ID of a supported chain
   * @throws Errors if the contract doesn't exist
   * @returns The Token Bridge contract interface
   */
  protected abstract mustGetBridge(chain: ChainName | ChainId): any;
  /**
   * Get the NFT Bridge contract interface
   * @param chain The name or ID of a supported chain
   * @returns The NFT bridge contract interface or undefined
   */
  protected abstract getNftBridge(chain: ChainName | ChainId): any | undefined;
  /**
   * Get the NFT Bridge contract interface
   * @param chain The name or ID of a supported chain
   * @throws Errors if the contract doesn't exist
   * @returns The NFT Bridge contract interface
   */
  protected abstract mustGetNftBridge(chain: ChainName | ChainId): any;
  /**
   * Get the Token Bridge Relayer contract interface
   * @param chain The name or ID of a supported chain
   * @returns The Token Bridge Relayer contract interface or undefined
   */
  protected abstract getTokenBridgeRelayer(
    chain: ChainName | ChainId,
  ): any | undefined;
  /**
   * Get the Token Bridge Relayer contract interface
   * @param chain The name or ID of a supported chain
   * @throws Errors if the contract doesn't exist
   * @returns The Token Bridge Relayer contract interface
   */
  protected abstract mustGetTokenBridgeRelayer(chain: ChainName | ChainId): any;
}
