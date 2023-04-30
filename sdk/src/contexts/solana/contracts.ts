import { Connection, clusterApiUrl } from '@solana/web3.js';
import { Program } from '@project-serum/anchor';
import { TokenBridge } from '@certusone/wormhole-sdk/lib/cjs/solana/types/tokenBridge';
import { NftBridge } from '@certusone/wormhole-sdk/lib/cjs/solana/types/nftBridge';
import { Wormhole } from '@certusone/wormhole-sdk/lib/cjs/solana/types/wormhole';

import { ChainName, ChainId, Contracts, Context } from '../../types';
import {
  ContractsAbstract,
  TokenBridgeRelayerInterface,
} from '../abstracts/contracts';
import { WormholeContext } from '../../wormhole';
import { filterByContext } from '../../utils';
import { SolanaContext } from '.';
import { createReadOnlyWormholeProgramInterface } from './solana/wormhole';
import { createReadOnlyTokenBridgeProgramInterface } from './solana/tokenBridge';
import { createReadOnlyNftBridgeProgramInterface } from './solana/nftBridge';

export class SolContracts<
  T extends WormholeContext,
> extends ContractsAbstract<T> {
  connection: Connection | undefined;
  protected _contracts: Map<ChainName, any>;
  readonly context: T;

  constructor(context: T) {
    super();
    this.context = context;
    const tag = context.environment === 'MAINNET' ? 'mainnet-beta' : 'devnet';
    this.connection = new Connection(clusterApiUrl(tag));
    this._contracts = new Map();
    const chains = filterByContext(context.conf, Context.SOLANA);
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
    if (!contracts) throw new Error(`no Solana contracts found for ${chain}`);
    return contracts;
  }

  /**
   * Returns core wormhole contract for the chain
   *
   * @returns An interface for the core contract, undefined if not found
   */
  getCore(chain?: ChainName | ChainId): Program<Wormhole> | undefined {
    const context = this.context.getContext(
      'solana',
    ) as SolanaContext<WormholeContext>;
    const connection = context.connection;
    if (!connection) throw new Error('no connection');

    const contracts = this.context.mustGetContracts('solana');
    if (!contracts.core) return;

    return createReadOnlyWormholeProgramInterface(
      contracts.core,
      this.connection,
    );
  }

  /**
   * Returns core wormhole contract for the chain
   *
   * @returns An interface for the core contract, errors if not found
   */
  mustGetCore(chain?: ChainName | ChainId): Program<Wormhole> {
    const core = this.getCore(chain);
    if (!core) throw new Error(`Core contract for domain ${chain} not found`);
    return core;
  }

  /**
   * Returns wormhole bridge contract for the chain
   *
   * @returns An interface for the bridge contract, undefined if not found
   */
  getBridge(chain?: ChainName | ChainId): Program<TokenBridge> | undefined {
    const context = this.context.getContext(
      'solana',
    ) as SolanaContext<WormholeContext>;
    const connection = context.connection;
    if (!connection) throw new Error('no connection');

    const contracts = this.context.mustGetContracts('solana');
    if (!contracts.token_bridge) return;

    return createReadOnlyTokenBridgeProgramInterface(
      contracts.token_bridge,
      connection,
    );
  }

  /**
   * Returns wormhole bridge contract for the chain
   *
   * @returns An interface for the bridge contract, errors if not found
   */
  mustGetBridge(chain?: ChainName | ChainId): Program<TokenBridge> {
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
  getNftBridge(chain?: ChainName | ChainId): Program<NftBridge> | undefined {
    const context = this.context.getContext(
      'solana',
    ) as SolanaContext<WormholeContext>;
    const connection = context.connection;
    if (!connection) throw new Error('no connection');

    const contracts = this.context.mustGetContracts('solana');
    if (!contracts.nft_bridge) return;

    return createReadOnlyNftBridgeProgramInterface(
      contracts.nft_bridge,
      connection,
    );
  }

  /**
   * Returns wormhole NFT bridge contract for the chain
   *
   * @returns An interface for the NFT bridge contract, errors if not found
   */
  mustGetNftBridge(chain: ChainName | ChainId): Program<NftBridge> {
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
    chain?: ChainName | ChainId,
  ): TokenBridgeRelayerInterface | undefined {
    return undefined;
  }

  /**
   * Returns wormhole Token Bridge Relayer contract for the chain
   *
   * @returns An interface for the Token Bridge Relayer contract, errors if not found
   */
  mustGetTokenBridgeRelayer(
    chain: ChainName | ChainId,
  ): TokenBridgeRelayerInterface {
    throw new Error('relayer not deployed on Solana');
  }
}
