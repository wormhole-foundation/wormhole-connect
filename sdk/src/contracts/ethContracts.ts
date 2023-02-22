import { ethers_contracts } from '@certusone/wormhole-sdk';
import {
  Wormhole,
  Bridge,
  NFTBridge,
} from '@certusone/wormhole-sdk/lib/cjs/ethers-contracts';

import { ChainName, ChainId, Contracts, Context } from '../types';
import { TokenBridgeRelayer } from '../abis/TokenBridgeRelayer';
import { TokenBridgeRelayer__factory } from '../abis/TokenBridgeRelayer__factory';
import { ContractsAbstract } from './abstracts';
import { ChainsManager } from '../chainsManager';
import { filterByContext } from '../utils';

export class EthContracts<
  T extends ChainsManager,
> extends ContractsAbstract<T> {
  protected _contracts: Map<ChainName, any>;
  readonly context: T;

  constructor(context: T) {
    super();
    this.context = context;
    this._contracts = new Map();
    const chains = filterByContext(context.conf, Context.ETH);
    chains.forEach((c) => {
      this._contracts.set(c.key, c.contracts);
    });
  }

  getContracts(chain: ChainName | ChainId): Contracts | undefined {
    const chainName = this.context.resolveDomainName(chain);
    return this._contracts.get(chainName as ChainName);
  }

  mustGetContracts(chain: ChainName | ChainId): Contracts {
    const chainName = this.context.resolveDomainName(chain);
    const contracts = this._contracts.get(chainName as ChainName);
    if (!contracts) throw new Error(`no EVM contracts found for ${chain}`);
    return contracts;
  }

  /**
   * Returns core wormhole contract for the chain
   *
   * @returns An interface for the core contract, undefined if not found
   */
  getCore(chain: ChainName | ChainId): Wormhole | undefined {
    const connection = this.context.mustGetConnection(chain);
    const address = this.mustGetContracts(chain).core;
    if (!address) return undefined;
    return ethers_contracts.Wormhole__factory.connect(address, connection);
  }

  /**
   * Returns core wormhole contract for the chain
   *
   * @returns An interface for the core contract, errors if not found
   */
  mustGetCore(chain: ChainName | ChainId): Wormhole {
    const core = this.getCore(chain);
    if (!core) throw new Error(`Core contract for domain ${chain} not found`);
    return core;
  }

  /**
   * Returns wormhole bridge contract for the chain
   *
   * @returns An interface for the bridge contract, undefined if not found
   */
  getBridge(chain: ChainName | ChainId): Bridge | undefined {
    const connection = this.context.mustGetConnection(chain);
    const address = this.mustGetContracts(chain).token_bridge;
    if (!address) return undefined;
    return ethers_contracts.Bridge__factory.connect(address, connection);
  }

  /**
   * Returns wormhole bridge contract for the chain
   *
   * @returns An interface for the bridge contract, errors if not found
   */
  mustGetBridge(chain: ChainName | ChainId): Bridge {
    const bridge = this.getBridge(chain);
    if (!bridge)
      throw new Error(`Bridge contract for domain ${chain} not found`);
    return bridge;
  }

  /**
   * Returns wormhole NFT bridge contract for the chain
   *
   * @returns An interface for the NFT bridge contract, undefined if not found
   */
  getNftBridge(chain: ChainName | ChainId): NFTBridge | undefined {
    const connection = this.context.mustGetConnection(chain);
    const address = this.mustGetContracts(chain).nft_bridge;
    if (!address) return undefined;
    return ethers_contracts.NFTBridge__factory.connect(address, connection);
  }

  /**
   * Returns wormhole NFT bridge contract for the chain
   *
   * @returns An interface for the NFT bridge contract, errors if not found
   */
  mustGetNftBridge(chain: ChainName | ChainId): NFTBridge {
    const nftBridge = this.getNftBridge(chain);
    if (!nftBridge)
      throw new Error(`NFT Bridge contract for domain ${chain} not found`);
    return nftBridge;
  }

  /**
   * Returns wormhole Token Bridge Relayer contract for the chain
   *
   * @returns An interface for the Token Bridge Relayer contract, undefined if not found
   */
  getTokenBridgeRelayer(
    chain: ChainName | ChainId,
  ): TokenBridgeRelayer | undefined {
    const connection = this.context.mustGetConnection(chain);
    const address = this.mustGetContracts(chain).relayer;
    if (!address) return undefined;
    return TokenBridgeRelayer__factory.connect(address, connection);
  }

  /**
   * Returns wormhole Token Bridge Relayer contract for the chain
   *
   * @returns An interface for the Token Bridge Relayer contract, errors if not found
   */
  mustGetTokenBridgeRelayer(chain: ChainName | ChainId): TokenBridgeRelayer {
    const relayer = this.getTokenBridgeRelayer(chain);
    if (!relayer)
      throw new Error(
        `Token Bridge Relayer contract for domain ${chain} not found`,
      );
    return relayer;
  }
}
