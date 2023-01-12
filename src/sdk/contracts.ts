import { ethers } from 'ethers';
import {
  ethers_contracts,
  Network as Environment,
  Contracts,
} from '@certusone/wormhole-sdk';
import {
  Wormhole,
  Bridge,
  NFTBridge,
} from '@certusone/wormhole-sdk/lib/cjs/ethers-contracts';
import { MultiProvider, Domain } from '@nomad-xyz/multi-provider';
import { NoProviderError } from './errors';
import { ChainName, ChainId } from './types';

export class WHContracts extends MultiProvider<Domain> {
  protected env: Environment;
  protected chain: ChainName | ChainId;
  protected conf: Contracts;

  constructor(env: Environment, chain: ChainName | ChainId, conf: Contracts) {
    super();
    this.env = env;
    this.chain = chain;
    this.conf = conf;
  }

  get connection(): ethers.Signer | ethers.providers.Provider {
    const chain = this.resolveDomainName(this.chain);
    const connection = this.mustGetConnection(chain);
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
    if (!address) return;
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
    if (!address) return;
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
    if (!address) return;
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
}
