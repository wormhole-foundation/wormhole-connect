import { Network as Environment } from '@certusone/wormhole-sdk';
import { MultiProvider, Domain } from '@nomad-xyz/multi-provider';

import MAINNET_CONFIG, { MAINNET_CHAINS } from './config/MAINNET';
import TESTNET_CONFIG, { TESTNET_CHAINS } from './config/TESTNET';
import {
  WormholeConfig,
  ChainName,
  ChainId,
  Context,
  AnyContext,
  Contracts,
} from './types';
import { EthContext } from './contexts/ethContext';
import { SolanaContext } from './contexts/solanaContext';

export class ChainsManager extends MultiProvider<Domain> {
  protected _contexts: Map<Context, AnyContext>;
  readonly conf: WormholeConfig;

  constructor(env: Environment, conf?: WormholeConfig) {
    super();

    if (conf) {
      this.conf = conf;
    } else {
      this.conf = env === 'MAINNET' ? MAINNET_CONFIG : TESTNET_CONFIG;
    }

    this._contexts = new Map();
    this._contexts.set(Context.ETH, new EthContext(this));
    this._contexts.set(Context.SOLANA, new SolanaContext(this));

    for (const network of Object.keys(this.conf.rpcs)) {
      const n = network as ChainName;
      const chains = env === 'MAINNET' ? MAINNET_CHAINS : TESTNET_CHAINS;
      const chainConfig = (chains as any)[n];
      if (!chainConfig) throw new Error('invalid network name');
      // register domain
      this.registerDomain({
        // @ts-ignore
        domain: chainConfig,
        name: network,
      });
      // register RPC provider
      if (this.conf.rpcs[n]) {
        this.registerRpcProvider(network, this.conf.rpcs[n]!);
      }
    }
  }

  get environment(): string {
    return this.conf.env;
  }

  getContracts(chain: ChainName | ChainId): Contracts | undefined {
    const chainName = this.resolveDomainName(chain) as ChainName;
    return this.conf.chains[chainName]?.contracts;
  }

  mustGetContracts(chain: ChainName | ChainId): Contracts {
    const contracts = this.getContracts(chain);
    if (!contracts) throw new Error(`no contracts found for ${chain}`);
    return contracts;
  }

  getContext(chain: ChainName | ChainId): AnyContext {
    const chainName = this.resolveDomainName(chain) as ChainName;
    const { context } = this.conf.chains[chainName]!;
    switch (context) {
      case Context.ETH: {
        return new EthContext(this);
      }
      case Context.SOLANA: {
        return new SolanaContext(this);
      }
      default: {
        throw new Error('Not able to retrieve context');
      }
    }
  }
}
