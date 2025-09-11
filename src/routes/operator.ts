import config from 'config';
import type { Token } from 'config/tokens';
import { parseTokenKey, tokenKey } from 'config/tokens';
import { maybeLogSdkError } from 'utils/errors';
import memoize from 'fast-memoize';

import type {
  Chain,
  TransactionId,
  TokenId,
  Network,
  Signer,
} from '@wormhole-foundation/sdk';
import { routes, amount as sdkAmount } from '@wormhole-foundation/sdk';

import SDKv2Route from './sdkv2/route';
import type { QuoteMetadata } from './types';
import { getDefaultQuoteExpiry, getQuoteExpiry } from 'utils/routes';

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
  quoteMetadataCache: QuoteMetadataCache;

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
    this.quoteMetadataCache = new QuoteMetadataCache();
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
    // Check each route for supported chains
    for (const routeName of this.preference) {
      const route = this.routes[routeName];
      // Get fresh list from route constructor to avoid stale cached data
      const supportedChains = route.rc.supportedChains(config.network);
      supportedChains.forEach((chain: Chain) => supported.add(chain));
    }
    return Array.from(supported);
  }

  async allSupportedDestTokens(
    sourceToken: Token | undefined,
    sourceChain: Chain,
    destChain: Chain,
  ): Promise<TokenId[]> {
    const supported: Set<string> = new Set();

    await this.forEach(async (_, route) => {
      try {
        const destTokenIds = await route.supportedDestTokens(
          sourceToken,
          sourceChain,
          destChain,
        );

        for (const token of destTokenIds) {
          supported.add(tokenKey(token));
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
  ): Promise<Record<string, QuoteResult>> {
    const results = await Promise.allSettled(
      routes.map((route) => {
        const quoteMetadata = this.quoteMetadataCache.get(route, params);

        if (quoteMetadata?.quote) {
          return quoteMetadata.quote;
        }

        return this.quoteMetadataCache.fetchQuote(
          route,
          params,
          this.get(route),
        );
      }),
    );

    const quotes: Record<string, QuoteResult> = {};

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

  isSameChainSwapSupported = memoize((chain: Chain): boolean => {
    const isSupported = Object.values(this.routes).some((route) => {
      const { supportsSameChainSwaps, supportedChains } = route.rc;

      const sameChainSwapSupported =
        typeof supportsSameChainSwaps === 'function' &&
        supportsSameChainSwaps(config.network, chain);

      return (
        sameChainSwapSupported &&
        supportedChains(config.network).includes(chain)
      );
    });

    return isSupported;
  });

  async execute(
    routeName: string,
    sourceToken: Token,
    amount: sdkAmount.Amount,
    sourceChain: Chain,
    signer: Signer,
    destChain: Chain,
    recipientAddress: string,
    destToken: Token,
    options: routes.AutomaticTokenBridgeRoute.Options,
  ) {
    const route = this.get(routeName);

    const quoteParams: QuoteParams = {
      amount,
      sourceChain,
      sourceToken,
      destChain,
      destToken,
      nativeGas: options.nativeGas,
      recipient: recipientAddress,
    };

    let quoteMetadata = this.quoteMetadataCache.get(routeName, quoteParams);

    if (!quoteMetadata) {
      quoteMetadata = await route.getQuote(
        amount,
        sourceToken,
        destToken,
        sourceChain,
        destChain,
        options,
        recipientAddress,
      );
    }

    return route.send(quoteMetadata, signer, destChain, recipientAddress);
  }
}

// This caches successful quote results from SDK routes and handles multiple concurrent
// async functions asking for the same quote gracefully.
//
// If we are already fetching a quote and a second hook requests the same quote elsewhere,
// we queue up a Promise in `QuoteMetadataEntry.pending` that we resolve when the original
// quote request is resolved. This just prevents us from making redundant API calls when
// multiple components or hooks are interested in a quote.
class QuoteMetadataCache {
  cache: Record<string, QuoteMetadataEntry>;
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

  get(routeName: string, params: QuoteParams): QuoteMetadata | null {
    const key = this.quoteParamsKey(routeName, params);
    const quoteMetadata = this.cache[key];
    const hasQuoteExpired = quoteMetadata?.ttl() <= 5_000;

    if (!quoteMetadata || hasQuoteExpired) {
      delete this.cache[key];
      return null;
    }

    return {
      quote: quoteMetadata.quote,
      request: quoteMetadata.request,
      routeInstance: quoteMetadata.routeInstance,
    };
  }

  async fetchQuote(
    routeName: string,
    params: QuoteParams,
    route: SDKv2Route,
  ): Promise<QuoteResult> {
    const key = this.quoteParamsKey(routeName, params);
    const pending = this.pending[key];

    if (pending) {
      // We already have a pending request for this key, so don't create a new one.
      // Instead, subscribe to its result when it resolves
      return new Promise((resolve, reject) => {
        pending.push({ resolve, reject });
      });
    }

    // We don't yet have a pending request for this key, so initiate one
    route
      .getQuote(
        params.amount,
        params.sourceToken,
        params.destToken,
        params.sourceChain,
        params.destChain,
        { nativeGas: params.nativeGas },
        params.recipient,
      )
      .then(({ routeInstance, quote, request }: QuoteMetadata) => {
        const pending = this.pending[key];

        for (const { resolve } of pending) {
          resolve(quote);
        }

        delete this.pending[key];

        if (quote.success) {
          quote.expires = getQuoteExpiry(quote.expires);
        }

        this.cache[key] = new QuoteMetadataEntry(quote, routeInstance, request);
      })
      .catch((err: any) => {
        const pending = this.pending[key];

        for (const { reject } of pending) {
          reject(err);
        }

        delete this.pending[key];

        // Cache uncaught error
        this.cache[key] = new QuoteMetadataEntry(
          {
            success: false,
            error: err,
          },
          {} as routes.Route<Network>,
          {} as routes.RouteTransferRequest<Network>,
        );
      });

    return new Promise((resolve, reject) => {
      this.pending[key] = [{ resolve, reject }];
    });
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

class QuoteMetadataEntry {
  // Last quote we received
  quote: QuoteResult;
  // Last time we fetched a quote
  timestamp: Date;
  // Optional route used for the quote
  routeInstance: routes.Route<Network>;
  // Optional request used for the quote
  request: routes.RouteTransferRequest<Network>;

  constructor(
    quote: QuoteResult,
    routeInstance: routes.Route<Network>,
    request: routes.RouteTransferRequest<Network>,
  ) {
    this.quote = quote;
    this.routeInstance = routeInstance;
    this.request = request;
    this.timestamp = new Date();
  }

  // Number of seconds this quote is still valid for before we should fetch a new one
  expires() {
    if (this.quote.success) {
      return (
        this.quote.expires ?? getDefaultQuoteExpiry(this.timestamp.getTime())
      );
    } else {
      // We cache errors for 120 seconds
      return new Date(this.timestamp.getTime() + 120_000);
    }
  }

  // TTL in ms before quote expires
  ttl() {
    return this.expires().getTime() - Date.now();
  }
}
