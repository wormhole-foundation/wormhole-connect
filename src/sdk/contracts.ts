import { ethers } from 'ethers';
import {
  ethers_contracts,
  Network as Environment,
} from '@certusone/wormhole-sdk';
import {
  Wormhole,
  Bridge,
  NFTBridge,
} from '@certusone/wormhole-sdk/lib/cjs/ethers-contracts';
import { WormholeContext } from './wormhole';
import { NoProviderError } from './errors';
import { ChainName, ChainId, Contracts } from './types';

export class WHContracts<T extends WormholeContext> {
  protected env: Environment;
  protected chain: ChainName | ChainId;
  protected conf: Contracts;
  readonly context: T;

  constructor(env: Environment, context: T, chain: ChainName | ChainId) {
    this.env = env;
    this.chain = chain;
    this.context = context;
    const n = this.context.resolveDomainName(chain) as ChainName;
    this.conf = context.conf.chains[n]!.contracts;
  }

  get connection(): ethers.Signer | ethers.providers.Provider {
    const chain = this.context.resolveDomainName(this.chain);
    const connection = this.context.mustGetConnection(chain);
    return connection;
  }

  /**
   * Returns core wormhole contract for the chain
   *
   * @returns An interface for the core contract, undefined if not found
   */
  get core(): Wormhole | undefined {
    if (!this.connection) throw new Error(NoProviderError(this.chain));
    const address = this.conf.core;
    if (!address) return undefined;
    return ethers_contracts.Wormhole__factory.connect(address, this.connection);
  }

  /**
   * Returns core wormhole contract for the chain
   *
   * @returns An interface for the core contract, errors if not found
   */
  mustGetCore(): Wormhole {
    if (!this.connection) throw new Error(NoProviderError(this.chain));
    const address = this.conf.core;
    if (!address)
      throw new Error(`Core contract for domain ${this.chain} not found`);
    return ethers_contracts.Wormhole__factory.connect(address, this.connection);
  }

  /**
   * Returns wormhole bridge contract for the chain
   *
   * @returns An interface for the bridge contract, undefined if not found
   */
  get bridge(): Bridge | undefined {
    if (!this.connection) throw new Error(NoProviderError(this.chain));
    const address = this.conf.token_bridge;
    if (!address) return undefined;
    return ethers_contracts.Bridge__factory.connect(address, this.connection);
  }

  /**
   * Returns wormhole bridge contract for the chain
   *
   * @returns An interface for the bridge contract, errors if not found
   */
  mustGetBridge(): Bridge {
    if (!this.connection) throw new Error(NoProviderError(this.chain));
    const address = this.conf.token_bridge;
    if (!address)
      throw new Error(`Bridge contract for domain ${this.chain} not found`);
    return ethers_contracts.Bridge__factory.connect(address, this.connection);
  }

  /**
   * Returns wormhole NFT bridge contract for the chain
   *
   * @returns An interface for the NFT bridge contract, undefined if not found
   */
  get nftBridge(): NFTBridge | undefined {
    if (!this.connection) throw new Error(NoProviderError(this.chain));
    const address = this.conf.token_bridge;
    if (!address) return undefined;
    return ethers_contracts.NFTBridge__factory.connect(
      address,
      this.connection,
    );
  }

  /**
   * Returns wormhole NFT bridge contract for the chain
   *
   * @returns An interface for the NFT bridge contract, errors if not found
   */
  mustGetNftBridge(): NFTBridge {
    if (!this.connection) throw new Error(NoProviderError(this.chain));
    const address = this.conf.token_bridge;
    if (!address)
      throw new Error(`NFT Bridge contract for domain ${this.chain} not found`);
    return ethers_contracts.NFTBridge__factory.connect(
      address,
      this.connection,
    );
  }

  /**
   * Returns wormhole Token Bridge Relayer contract for the chain
   *
   * @returns An interface for the Token Bridge Relayer contract, undefined if not found
   */
  get tokenBridgeRelayer(): Bridge | undefined {
    if (!this.connection) throw new Error(NoProviderError(this.chain));
    const address = this.conf.token_bridge;
    if (!address) return undefined;
    return ethers_contracts.Bridge__factory.connect(
      address,
      this.connection,
    );
  }

  /**
   * Returns wormhole Token Bridge Relayer contract for the chain
   *
   * @returns An interface for the Token Bridge Relayer contract, errors if not found
   */
  mustGetTokenBridgeRelayer(): Bridge {
    if (!this.connection) throw new Error(NoProviderError(this.chain));
    const address = this.conf.token_bridge;
    if (!address)
      throw new Error(`Token Bridge contract for domain ${this.chain} not found`);
    return ethers_contracts.Bridge__factory.connect(
      address,
      this.connection,
    );
  }
}
