import config from 'config';
import { TokenConfig } from 'config/types';

import { Chain, routes, TransactionId } from '@wormhole-foundation/sdk';

import SDKv2Route from './sdkv2';

import {
  nttAutomaticRoute,
  nttManualRoute,
  NttRoute,
} from '@wormhole-foundation/sdk-route-ntt';

import '@wormhole-foundation/sdk-definitions-ntt';
import '@wormhole-foundation/sdk-evm-ntt';
import '@wormhole-foundation/sdk-solana-ntt';

export interface TxInfo {
  route: string;
  receipt: routes.Receipt;
}

type forEachCallback<T> = (name: string, route: SDKv2Route) => T;

export const DEFAULT_ROUTES = [
  routes.AutomaticCCTPRoute,
  routes.CCTPRoute,
  routes.AutomaticTokenBridgeRoute,
  routes.TokenBridgeRoute,
];

export default class RouteOperator {
  preference: string[];
  routes: Record<string, SDKv2Route>;

  constructor(routesConfig: routes.RouteConstructor<any>[] = DEFAULT_ROUTES) {
    let routes = {};
    let preference: string[] = [];
    for (const rc of routesConfig) {
      const name = rc.meta.name;
      if (name === '') {
        throw new Error(`Route has empty meta.name`);
      } else if (name in routes) {
        throw new Error(`Route has duplicate meta.name: ${name}`);
      }
      preference.push(name);
      routes[name] = new SDKv2Route(rc);
    }
    this.routes = routes;
    this.preference = preference;
  }

  get(name: string): SDKv2Route {
    return this.routes[name];
  }

  async forEach<T>(callback: forEachCallback<T>): Promise<T[]> {
    return Promise.all(
      this.preference.map((name) => callback(name, this.routes[name])),
    );
  }

  async resumeFromTx(tx: TransactionId): Promise<TxInfo | null> {
    // This function identifies which route a transaction corresponds using brute force.
    // It tries to call resume() on every manual route until one of them succeeds.
    //
    // This was just the simpler approach. In the future we can possibly optimize this by
    // trying some tricks to identify which route the transaction is for, but this would
    // come at the cost of added code, complexity, and potential bugs.
    //
    // That trade-off might not be worth it though

    return new Promise((resolve, reject) => {
      // This promise runs resumeIfManual on each route in parallel and resolves as soon
      // as it finds a receipt from any of the available routes. This is different from just using
      // Promise.race, because we only want to resolve under specific conditions.
      //
      // The assumption is that at most one route will produce a receipt.
      const totalAttemptsToMake = Object.keys(this.routes).length;
      let failedAttempts = 0;

      this.forEach((name, route) => {
        route
          .resumeIfManual(tx)
          .then((receipt) => {
            if (receipt !== null) {
              resolve({ route: name, receipt });
            } else {
              failedAttempts += 1;
            }
          })
          .catch((e) => {
            failedAttempts += 1;
            // Possible reasons for error here:
            //
            // - Given transaction does not correspond to this route.
            //   We expect this case to happen because it's how we narrow down
            //   which route this transaction corresponds to. It's not a problem.
            //
            // - Otherwise, perhaps this is corresponding route but some other error
            //   happened when fetching the metadata required to construct a receipt.
            //
            // We handle both of these the same way for now - by continuing.
            //
            // If we add logic to identify the route in a different way in the future,
            // we can possibly handle these two error cases differently.
            //
            // If we reach the end of the for-loop without a successful result from resume()
            // then we tell the user that the transaction can't be resumed.
          })
          .finally(() => {
            // If we failed to get a receipt from all routes, resolve to null
            if (failedAttempts === totalAttemptsToMake) {
              resolve(null);
            }
          });
      });
    });
  }

  allSupportedChains(): Chain[] {
    const supported = new Set<Chain>();
    for (const key in config.chains) {
      const chain = key as Chain;
      this.forEach(async (_name, route) => {
        if (!supported.has(chain)) {
          const isSupported = route.isSupportedChain(chain);
          if (isSupported) {
            supported.add(chain);
          }
        }
      });
    }
    return Array.from(supported);
  }

  async allSupportedSourceTokens(
    destToken: TokenConfig | undefined,
    sourceChain?: Chain,
    destChain?: Chain,
  ): Promise<TokenConfig[]> {
    const supported: { [key: string]: TokenConfig } = {};
    await this.forEach(async (_name, route) => {
      try {
        const sourceTokens = await route.supportedSourceTokens(
          config.tokensArr,
          destToken,
          sourceChain,
          destChain,
        );

        for (const token of sourceTokens) {
          supported[token.key] = token;
        }
      } catch (e) {
        console.error(e);
      }
    });
    return Object.values(supported);
  }

  async allSupportedDestTokens(
    sourceToken: TokenConfig | undefined,
    sourceChain?: Chain,
    destChain?: Chain,
  ): Promise<TokenConfig[]> {
    const supported: { [key: string]: TokenConfig } = {};
    await this.forEach(async (_name, route) => {
      try {
        const destTokens = await route.supportedDestTokens(
          config.tokensArr,
          sourceToken,
          sourceChain,
          destChain,
        );

        for (const token of destTokens) {
          supported[token.key] = token;
        }
      } catch (e) {
        console.error(e);
      }
    });
    return Object.values(supported);
  }
}

// Convenience function for integrators when adding NTT routes to their config
//
// Example:
//
// routes: [
//   ...DEFAULT_ROUTES,
//   ...nttRoutes({ ... }),
// ]
export const nttRoutes = (nc: NttRoute.Config): routes.RouteConstructor[] => {
  return [nttManualRoute(nc), nttAutomaticRoute(nc)];
};
