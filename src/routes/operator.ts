import config from 'config';
import { parseTokenKey, Token, tokenKey } from 'config/tokens';
import { maybeLogSdkError } from 'utils/errors';

import {
  Chain,
  routes,
  TransactionId,
  amount as sdkAmount,
  TokenId,
  Wormhole,
  circle,
} from '@wormhole-foundation/sdk';

import SDKv2Route from './sdkv2';

export interface TxInfo {
  route: string;
  receipt: routes.Receipt;
}

export type QuoteResult = routes.QuoteResult<routes.Options>;

type forEachCallback<T> = (name: string, route: SDKv2Route) => T;

export const DEFAULT_ROUTES = [
  routes.AutomaticCCTPRoute,
  routes.CCTPRoute,
  routes.AutomaticTokenBridgeRoute,
  routes.TokenBridgeRoute,
  routes.TBTCRoute,
];

export interface QuoteParams {
  sourceChain: Chain;
  sourceToken: Token;
  destChain: Chain;
  destToken: Token;
  amount: sdkAmount.Amount;
  nativeGas: number;
  recipient?: string; // wallet may be undefined when not connected
}

export default class RouteOperator {
  preference: string[];
  routes: Record<string, SDKv2Route>;
  quoteCache: QuoteCache;

  constructor(routesConfig: routes.RouteConstructor<any>[] = DEFAULT_ROUTES) {
    const routes = {};
    const preference: string[] = [];
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
    this.quoteCache = new QuoteCache();
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
    // First, try to identify the route via Wormholescan API
    const routesToTry = await this.getRoutesFromWormholescan(tx);

    if (routesToTry.length > 0) {
      // Try only the specific routes identified by Wormholescan
      const result = await this.trySpecificRoutes(tx, routesToTry);
      if (result !== null) {
        return result;
      }
    }

    // Fall back to brute force approach if:
    // 1. Wormholescan API didn't return any routes
    // 2. The identified routes didn't succeed
    return this.tryAllRoutes(tx);
  }

  private async getRoutesFromWormholescan(
    tx: TransactionId,
  ): Promise<string[]> {
    try {
      const response = await fetch(
        `${config.wormholeApi}api/v1/operations?txHash=${tx.txid}`,
        { headers: { accept: 'application/json' } },
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const operations = data?.operations;

      if (!operations || operations.length === 0) {
        return [];
      }

      // Get appIds from the first matching operation
      const appIds =
        operations[0]?.content?.standarizedProperties?.appIds || [];

      // Map appIds to route names
      const routeNames = new Set<string>();

      for (const appId of appIds) {
        switch (appId) {
          case 'CCTP_WORMHOLE_INTEGRATION':
            routeNames.add('ManualCCTP');
            routeNames.add('AutomaticCCTPRoute');
            routeNames.add('CCTPRoute');
            routeNames.add('CCTPExecutorRoute');
            routeNames.add('CCTPv2StandardExecutorRoute');
            routeNames.add('CCTPv2FastExecutorRoute');
            break;
          case 'PORTAL_TOKEN_BRIDGE':
            routeNames.add('ManualTokenBridge');
            routeNames.add('AutomaticTokenBridgeRoute');
            routeNames.add('TokenBridgeRoute');
            routeNames.add('TokenBridgeExecutorRoute');
            break;
          case 'NATIVE_TOKEN_TRANSFER':
            routeNames.add('ManualNtt');
            routeNames.add('NttExecutorRoute');
            break;
          case 'GENERIC_RELAYER':
            // Could be various routes, add common relayer-based routes
            routeNames.add('AutomaticTokenBridgeRoute');
            routeNames.add('AutomaticCCTPRoute');
            break;
          // TBTCRoute doesn't have a specific appId mapping in Wormholescan
          // It will be tried in the fallback brute force approach
        }
      }

      // Filter to only routes that are actually configured
      return Array.from(routeNames).filter((name) => name in this.routes);
    } catch (error) {
      // Silently fail and return empty array to trigger fallback
      return [];
    }
  }

  private async trySpecificRoutes(
    tx: TransactionId,
    routeNames: string[],
  ): Promise<TxInfo | null> {
    return new Promise((resolve) => {
      let attempts = 0;
      const totalAttempts = routeNames.length;

      if (totalAttempts === 0) {
        resolve(null);
        return;
      }

      for (const name of routeNames) {
        const route = this.routes[name];
        if (!route) {
          attempts += 1;
          if (attempts === totalAttempts) {
            resolve(null);
          }
          continue;
        }

        route
          .resumeIfManual(tx)
          .then((receipt) => {
            if (receipt !== null) {
              resolve({ route: name, receipt });
            } else {
              attempts += 1;
              if (attempts === totalAttempts) {
                resolve(null);
              }
            }
          })
          .catch(() => {
            attempts += 1;
            if (attempts === totalAttempts) {
              resolve(null);
            }
          });
      }
    });
  }

  private async tryAllRoutes(tx: TransactionId): Promise<TxInfo | null> {
    // This is the original brute force implementation
    return new Promise((resolve) => {
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
          .catch(() => {
            failedAttempts += 1;
          })
          .finally(() => {
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

  async allSupportedDestTokens(
    sourceToken: Token | undefined,
    sourceChain: Chain,
    destChain: Chain,
  ): Promise<TokenId[]> {
    const supported: Set<string> = new Set();

    await this.forEach(async (name, route) => {
      try {
        // TODO remove once the SDK has a special return value that represents infinite supported tokens
        if (name.includes('Mayan')) {
          // If we have Mayan available, which is a swap route, by default we show the gas token and USDC.
          supported.add(tokenKey(Wormhole.tokenId(destChain, 'native')));

          const usdcAddr = circle.usdcContract.get(config.network, destChain);
          if (usdcAddr) {
            supported.add(tokenKey(Wormhole.tokenId(destChain, usdcAddr)));
          }
        } else {
          const destTokenIds = await route.supportedDestTokens(
            sourceToken,
            sourceChain,
            destChain,
          );

          for (const token of destTokenIds) {
            supported.add(tokenKey(token));
          }
        }
      } catch (e) {
        maybeLogSdkError(e);
      }
    });

    return Array.from(supported).map(parseTokenKey);
  }

  async getQuotes(
    routes: string[],
    params: QuoteParams,
  ): Promise<Record<string, routes.QuoteResult<routes.Options>>> {
    const results = await Promise.allSettled(
      routes.map((route) => {
        const cachedResult = this.quoteCache.get(route, params);
        if (cachedResult) {
          return cachedResult;
        } else {
          return this.quoteCache.fetch(route, params, this.get(route));
        }
      }),
    );

    // Convert the array of promise results to a quoteName=>quoteResult map
    const quotes = {};

    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      const result = results[i];
      if (result.status === 'rejected') {
        quotes[route] = {
          success: false,
          error: result.reason,
        };
      } else {
        quotes[route] = result.value;
      }
    }

    return quotes;
  }
}

// This caches successful quote results from SDK routes and handles multiple concurrent
// async functions asking for the same quote gracefully.
//
// If we are already fetching a quote and a second hook requests the same quote elsewhere,
// we queue up a Promise in `QuoteCacheEntry.pending` that we resolve when the original
// quote request is resolved. This just prevents us from making redundant API calls when
// multiple components or hooks are interested in a quote.
class QuoteCache {
  cache: Record<string, QuoteCacheEntry>;
  pending: Record<string, QuotePromiseHandlers[]>;

  constructor() {
    this.cache = {};
    this.pending = {};
  }

  quoteParamsKey(routeName: string, params: QuoteParams): string {
    return `${routeName}:${
      params.sourceChain
    }:${params.sourceToken.address.toString()}:${
      params.destChain
    }:${params.destToken.address.toString()}:${sdkAmount.units(
      params.amount,
    )}:${params.nativeGas}:${params.recipient}`;
  }

  get(routeName: string, params: QuoteParams): QuoteResult | null {
    const key = this.quoteParamsKey(routeName, params);
    const cachedVal = this.cache[key];
    if (cachedVal) {
      if (cachedVal.ttl() > 5) {
        return cachedVal.result;
      } else {
        delete this.cache[key];
      }
    }

    return null;
  }

  async fetch(
    routeName: string,
    params: QuoteParams,
    route: SDKv2Route,
  ): Promise<QuoteResult> {
    console.debug('Fetching quote', routeName, params);

    const key = this.quoteParamsKey(routeName, params);
    const pending = this.pending[key];
    if (pending) {
      // We already have a pending request for this key, so don't create a new one.
      // Instead, subscribe to its result when it resolves
      return new Promise((resolve, reject) => {
        pending.push({ resolve, reject });
      });
    } else {
      // Initialize list of promises awaiting this result
      const returnPromise: Promise<QuoteResult> = new Promise(
        (resolve, reject) => {
          this.pending[key] = [{ resolve, reject }];
        },
      );

      // We don't yet have a pending request for this key, so initiate one
      route
        .computeQuote(
          params.amount,
          params.sourceToken,
          params.destToken,
          params.sourceChain,
          params.destChain,
          { nativeGas: params.nativeGas },
          params.recipient,
        )
        .then((result: QuoteResult) => {
          const pending = this.pending[key];
          for (const { resolve } of pending) {
            resolve(result);
          }
          delete this.pending[key];

          if (result.success && result.expires === undefined) {
            // Default to 60 seconds expiry
            result.expires = new Date(Date.now() + 60_000);
          }

          console.debug(`Fetched quote`, routeName, result);

          this.cache[key] = new QuoteCacheEntry(result);
        })
        .catch((err: any) => {
          console.debug(`Error fetching quote`, routeName, err);
          const pending = this.pending[key];
          for (const { reject } of pending) {
            reject(err);
          }
          delete this.pending[key];

          // Cache uncaught error
          this.cache[key] = new QuoteCacheEntry({
            success: false,
            error: err,
          });
        });

      return returnPromise;
    }
  }

  nextExpiry(routes: string[], params: QuoteParams): Date | undefined {
    const expirations: Date[] = routes
      .map((r) => {
        const key = this.quoteParamsKey(r, params);
        if (this.cache[key]) {
          return this.cache[key].expires();
        }
      })
      .filter((e: Date | undefined) => e !== undefined)
      .sort((a, b) => a.valueOf() - b.valueOf());

    if (expirations.length > 0) {
      return expirations[0];
    }

    return undefined;
  }
}

interface QuotePromiseHandlers {
  resolve: (quote: QuoteResult) => void;
  reject: (err: Error) => void;
}

class QuoteCacheEntry {
  // Last quote we received (the cached value)
  result: QuoteResult;
  // Last time we fetched a quote
  timestamp: Date;

  constructor(result: QuoteResult) {
    this.result = result;
    this.timestamp = new Date();
  }

  // Number of seconds this quote is still valid for before we should fetch a new one
  expires(): Date {
    if (this.result.success) {
      // For a successful quote, if it specifies an expiry we return that
      // otherwise we default to a TTL 1 minute
      return this.result.expires ?? new Date(this.timestamp.valueOf() + 60_000);
    } else {
      // We cache errors for 10 seconds
      return new Date(this.timestamp.valueOf() + 120_000);
    }
  }

  // TTL in seconds before quote expires
  ttl(): number {
    return (this.expires().valueOf() - Date.now().valueOf()) / 1000;
  }
}
