import { ChainName, ChainId, Contracts, Context } from '../../types';
import { ContractsAbstract } from '../abstracts/contracts';
import { WormholeContext } from '../../wormhole';
import { filterByContext } from '../../utils';
import { AptosClient } from 'aptos';

/**
 * @category Aptos
 */
export class AptosContracts<
  T extends WormholeContext,
> extends ContractsAbstract<T> {
  protected _contracts: Map<ChainName, any>;
  readonly context: T;
  readonly client: AptosClient;

  constructor(context: T, client: AptosClient) {
    super();
    this.context = context;
    this.client = client;
    this._contracts = new Map();
    const chains = filterByContext(context.conf, Context.APTOS);
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
    if (!contracts) throw new Error(`no Aptos contracts found for ${chain}`);
    return contracts;
  }

  getCore(chain: ChainName | ChainId): string | undefined {
    return this.getContracts(chain)?.core;
  }

  mustGetCore(chain: ChainName | ChainId): string {
    const core = this.getCore(chain);
    if (!core) throw new Error(`Core contract for domain ${chain} not found`);
    return core;
  }

  getBridge(chain: ChainName | ChainId): string | undefined {
    return this.getContracts(chain)?.token_bridge;
  }

  mustGetBridge(chain: ChainName | ChainId) {
    const bridge = this.getBridge(chain);
    if (!bridge)
      throw new Error(`Bridge contract for domain ${chain} not found`);
    return bridge;
  }

  getNftBridge(chain: ChainName | ChainId): string | undefined {
    return this.getContracts(chain)?.nft_bridge;
  }

  mustGetNftBridge(chain: ChainName | ChainId) {
    const nftBridge = this.getNftBridge(chain);
    if (!nftBridge)
      throw new Error(`NFT Bridge contract for domain ${chain} not found`);
    return nftBridge;
  }

  getTokenBridgeRelayer(chain: ChainName | ChainId): string | undefined {
    return undefined;
  }

  mustGetTokenBridgeRelayer(chain: ChainName | ChainId) {
    throw new Error('relayer not deployed on Aptos');
  }
}
