import { ChainName, ChainId, Context, Contracts } from '../../types';
import { filterByContext } from '../../utils';
import { WormholeContext } from '../../wormhole';
import { ContractsAbstract } from '../abstracts/contracts';

export class SeiContracts<
  T extends WormholeContext,
> extends ContractsAbstract<T> {
  protected _contracts: Map<ChainName, any>;
  protected context: T;

  constructor(context: T) {
    super();
    this.context = context;
    this._contracts = new Map();
    const chains = filterByContext(context.conf, Context.SEI);
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
    if (!contracts) throw new Error(`no Sui contracts found for ${chain}`);
    return contracts;
  }

  getCore(chain: ChainName | ChainId) {
    throw new Error('Method not implemented.');
  }

  mustGetCore(chain: ChainName | ChainId) {
    throw new Error('Method not implemented.');
  }

  getBridge(chain: ChainName | ChainId) {
    throw new Error('Method not implemented.');
  }

  mustGetBridge(chain: ChainName | ChainId) {
    throw new Error('Method not implemented.');
  }

  getNftBridge(chain: ChainName | ChainId) {
    throw new Error('Method not implemented.');
  }

  mustGetNftBridge(chain: ChainName | ChainId) {
    throw new Error('Method not implemented.');
  }

  getTokenBridgeRelayer(chain: ChainName | ChainId) {
    throw new Error('Method not implemented.');
  }

  mustGetTokenBridgeRelayer(chain: ChainName | ChainId) {
    throw new Error('Method not implemented.');
  }
}
