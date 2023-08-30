import { ChainId, ChainName, Context, Contracts } from '../../types';
import { filterByContext } from '../../utils';
import { WormholeContext } from '../../wormhole';
import { ContractsAbstract } from '../abstracts/contracts';

/**
 * @category Cosmos
 * Cosmos Contracts class. Contains methods for accessing ts interfaces for all available contracts
 */
export class CosmosContracts<
  T extends WormholeContext,
> extends ContractsAbstract<T> {
  protected _contracts: Map<ChainName, any>;
  readonly context: T;

  constructor(context: T) {
    super();
    this.context = context;
    this._contracts = new Map();
    const chains = filterByContext(context.conf, Context.COSMOS);
    chains.forEach((c) => {
      this._contracts.set(c.key, c.contracts);
    });
  }

  getContracts(chain: ChainName | ChainId): Contracts | undefined {
    const chainName = this.context.toChainName(chain);
    return this._contracts.get(chainName);
  }

  mustGetContracts(chain: ChainName | ChainId): Contracts {
    const chainName = this.context.toChainName(chain);
    const contracts = this._contracts.get(chainName);
    if (!contracts) throw new Error(`no contracts found for ${chain}`);
    return contracts;
  }

  /**
   * Returns core wormhole address contract for the chain
   *
   * @returns The core contract address, undefined if not found
   */
  getCore(chain: ChainName | ChainId): any | undefined {
    return undefined;
  }

  /**
   * Returns core wormhole address contract for the chain
   *
   * @returns The core contract address, errors if not found
   */
  mustGetCore(chain: ChainName | ChainId): any {
    const core = this.getCore(chain);
    if (!core) throw new Error(`Core contract for domain ${chain} not found`);
    return core;
  }

  /**
   * Returns wormhole bridge address contract for the chain
   *
   * @returns The bridge contract address, undefined if not found
   */
  getBridge(chain: ChainName | ChainId): any | undefined {
    return undefined;
  }

  /**
   * Returns wormhole bridge address contract for the chain
   *
   * @returns The bridge contract address, errors if not found
   */
  mustGetBridge(chain: ChainName | ChainId): any {
    const bridge = this.getBridge(chain);
    if (!bridge)
      throw new Error(`Bridge contract for domain ${chain} not found`);
    return bridge;
  }

  /**
   * Returns wormhole NFT bridge address contract for the chain
   *
   * @returns The NFT bridge address, undefined if not found
   */
  getNftBridge(chain: ChainName | ChainId): any | undefined {
    return undefined;
  }

  /**
   * Returns wormhole NFT bridge address contract for the chain
   *
   * @returns The NFT bridge address, errors if not found
   */
  mustGetNftBridge(chain: ChainName | ChainId): any {
    const nftBridge = this.getNftBridge(chain);
    if (!nftBridge)
      throw new Error(`NFT Bridge contract for domain ${chain} not found`);
    return nftBridge;
  }

  /**
   * Returns wormhole Token Bridge Relayer address contract for the chain
   *
   * @returns The Token Bridge Relayer address, undefined if not found
   */
  getTokenBridgeRelayer(chain: ChainName | ChainId): any | undefined {
    return undefined;
  }

  /**
   * Returns wormhole Token Bridge Relayer address contract for the chain
   *
   * @returns The Token Bridge Relayer address, errors if not found
   */
  mustGetTokenBridgeRelayer(chain: ChainName | ChainId): any {
    const relayer = this.getTokenBridgeRelayer(chain);
    if (!relayer)
      throw new Error(
        `Token Bridge Relayer contract for domain ${chain} not found`,
      );
    return relayer;
  }

  /**
   * Returns wormhole CCTP relayer contract for the chain
   *
   * @returns An interface for the Wormhole CCTP relayer contract, undefined if not found
   */
  getWormholeCircleRelayer(chain: ChainName | ChainId) {
    return undefined;
  }

  /**
   * Returns wormhole CCTP relayer contract for the chain
   *
   * @returns An interface for the Wormhole CCTP relayer contract, errors if not found
   */
  mustGetWormholeCircleRelayer(chain: ChainName | ChainId) {
    throw new Error(
      `Wormhole circle relayer contract for domain ${chain} not found`,
    );
  }
}
