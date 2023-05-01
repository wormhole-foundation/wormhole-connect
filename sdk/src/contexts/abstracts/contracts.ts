import { WormholeContext } from '../../wormhole';
import { ChainName, ChainId } from '../../types';

export abstract class ContractsAbstract<T extends WormholeContext> {
  protected abstract _contracts: Map<ChainName, any>;
  protected abstract readonly context: T;

  protected abstract getCore(chain: ChainName | ChainId): any | undefined;
  protected abstract mustGetCore(chain: ChainName | ChainId): any;
  protected abstract getBridge(chain: ChainName | ChainId): any | undefined;
  protected abstract mustGetBridge(chain: ChainName | ChainId): any;
  protected abstract getNftBridge(chain: ChainName | ChainId): any | undefined;
  protected abstract mustGetNftBridge(chain: ChainName | ChainId): any;
  protected abstract getTokenBridgeRelayer(chain: ChainName | ChainId): any;
  protected abstract mustGetTokenBridgeRelayer(chain: ChainName | ChainId): any;
}
