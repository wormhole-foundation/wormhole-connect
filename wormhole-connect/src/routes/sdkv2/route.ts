import { RelayAbstract } from 'routes/abstracts';
import { routes, Network } from '@wormhole-foundation/sdk';
import {
  ChainName,
  ChainId,
  TokenId,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber, utils } from 'ethers';

export class SDKV2Route implements RelayAbstract {
  private readonly routeConstructor: routes.RouteConstructor;

  constructor(rc: routes.RouteConstructor) {
    this.routeConstructor = rc;
  }

  async isRouteSupported(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    // TODO this doesnt currently listen to the config.routes whitelist
    return false;
  }

  isSupportedChain(chain: ChainName): boolean {
    // TODO
    return false;
  }
}
