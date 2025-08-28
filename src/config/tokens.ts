import type { Chain, TokenId, TokenAddress } from '@wormhole-foundation/sdk';
import {
  canonicalAddress,
  isTokenId,
  isChain,
  toNative,
  isNative,
  chainToPlatform,
  UniversalAddress,
} from '@wormhole-foundation/sdk';
import type { TokenIcon, TokenConfig, WrappedTokenAddresses } from './types';
import { getWormholeContextV2 } from './index';
import { isValidSuiType } from '@wormhole-foundation/sdk-sui';

import { fetchTokenMetadata } from 'utils/coingecko';

const TOKEN_CACHE_VERSION = 1;

const HAS_LOCALSTORAGE = typeof localStorage !== 'undefined';

// A TokenId initialized from a string address, which only parses the address to a NativeAddress when it's needed
// This is just a speed optimization
class TokenIdLazy<C extends Chain = Chain> implements TokenId<C> {
  chain: C;
  addressString: string;
  _address?: TokenAddress<Chain>;

  constructor(chain: C, addr: string) {
    this.chain = chain;
    this.addressString = addr;
  }

  get address(): TokenAddress<C> {
    if (isNative(this.addressString)) return this.addressString;

    if (!this._address) {
      this._address = toNative(
        this.chain,
        this.addressString,
      ) as TokenAddress<C>;
    }
    return this._address as TokenAddress<C>;
  }

  static fromTokenTuple(tuple: TokenTuple): TokenIdLazy {
    return new TokenIdLazy(tuple[0], tuple[1]);
  }
}

export class Token extends TokenIdLazy {
  decimals: number;
  symbol: string;
  name?: string;

  // Display info
  icon?: TokenIcon | string;

  // If this is a Wormhole Token Bridge wrapped token, tokenBridgeOriginalTokenId
  // is the original token's TokenId. Otherwise, it's just undefined.
  tokenBridgeOriginalTokenId?: TokenId;

  // web_slug in Coingecko API response
  // Corresponds to URLs like https://www.coingecko.com/en/coins/:id
  coingeckoWebId?: string;

  // Flag that's set to true if the token was built in to Connect via config
  // Used when filtering out unknown/unverified tokens
  isBuiltin?: boolean;

  constructor(
    chain: Chain,
    address: string,
    decimals: number,
    symbol: string,
    name?: string,
    icon?: TokenIcon | string,
    tokenBridgeOriginalTokenId?: TokenId,
    coingeckoId?: string,
  ) {
    super(chain, address);
    this.decimals = decimals;
    this.symbol = symbol;
    this.name = name;
    this.icon = icon;
    this.tokenBridgeOriginalTokenId = tokenBridgeOriginalTokenId;
    this.coingeckoWebId = coingeckoId;
  }

  get display(): string {
    if (this.name) {
      return this.name;
    }
    if (this.symbol !== '') {
      return this.symbol;
    }
    return this.shortAddress;
  }

  get shortAddress(): string {
    const addr = this.addressString;
    return `${addr.substring(0, 5)}...${addr.substring(addr.length - 6)}`;
  }

  get tuple(): TokenTuple {
    return [this.chain, this.addressString];
  }

  get key(): string {
    return tokenKey(this.tokenId);
  }

  get tokenId(): TokenId {
    return {
      chain: this.chain,
      address: this.address,
    };
  }

  get isNativeGasToken() {
    return isNative(this.address);
  }

  get isTokenBridgeWrappedToken() {
    return !!this.tokenBridgeOriginalTokenId;
  }

  get nativeChain() {
    // This returns the chain of the original token, for wormhole-wrapped tokens.
    return this.tokenBridgeOriginalTokenId?.chain || this.chain;
  }

  equals(other: Token): boolean {
    return isSameToken(this, other);
  }

  toJson(): TokenJson {
    return {
      chain: this.chain,
      address: this.addressString,
      decimals: this.decimals,
      symbol: this.symbol,
      name: this.name ?? '',
      icon: this.icon ? (this.icon as string) : '',
      tokenBridgeOriginalTokenId: this.tokenBridgeOriginalTokenId
        ? tokenIdToTuple(this.tokenBridgeOriginalTokenId)
        : undefined,
      coingeckoWebId: this.coingeckoWebId,
    };
  }

  static fromJson({
    chain,
    address,
    decimals,
    symbol,
    name,
    icon,
    tokenBridgeOriginalTokenId,
    coingeckoWebId,
  }: TokenJson) {
    return new Token(
      chain as Chain,
      address,
      decimals,
      symbol,
      name,
      icon === '' ? undefined : icon,
      tokenBridgeOriginalTokenId
        ? tokenIdFromTuple(tokenBridgeOriginalTokenId)
        : undefined,
      coingeckoWebId,
    );
  }
}

interface TokenJson {
  chain: string;
  address: string;
  decimals: number;
  symbol: string;
  name: string;
  icon: string;
  tokenBridgeOriginalTokenId: TokenTuple | undefined;
  coingeckoWebId: string | undefined;
}

// Mapping of tokens to some value
export class TokenMapping<T> {
  lastUpdate: Date;

  _localStorageKey?: string;

  // Mapping of Chain -> token address -> T
  _mapping: Map<Chain, Map<string, T>>;

  size: number;

  constructor() {
    this.lastUpdate = new Date();
    this._mapping = new Map();
    this.size = 0;
  }

  add(token: TokenId, value: T) {
    if (!this._mapping.has(token.chain)) {
      this._mapping.set(token.chain, new Map());
    }

    this._mapping
      .get(token.chain)!
      .set(addressString(token).toLowerCase(), value);
    this.lastUpdate = new Date();
    this.size += 1;
  }

  // You can get a token either using its string key, TokenId, or with (chain, address)
  get(key: string): T | undefined;
  get(tokenId: TokenId): T | undefined;
  get(tokenTuple: TokenTuple): T | undefined;
  get(chain: Chain, address: string): T | undefined;
  get(
    firstArg: Chain | string | TokenId | TokenTuple,
    address?: string,
  ): T | undefined {
    if (
      typeof firstArg === 'string' &&
      typeof address === 'string' &&
      isChain(firstArg)
    ) {
      return this._mapping.get(firstArg)?.get(address.toLowerCase());
    } else if (firstArg instanceof TokenIdLazy) {
      // Doing the instanceof TokenIdLazy check before isTokenId() is important here for perf reasons.
      // All we need is the stringified address. TokenIdLazy is optimized for that.
      // The Wormhole SDK's TokenId is not.
      //
      // Both a TokenIdLazy and vanilla TokenId will pass the isTokenId check. So we catch the lazy version
      // first, otherwise we will isTokenId will parse the TokenIdLazy's addressString and then we will
      // immediately re-stringifiy it.
      //
      // It's weird but it speeds up token cache operations a lot.
      return this._mapping
        .get(firstArg.chain)
        ?.get(firstArg.addressString.toLowerCase());
    } else if (isTokenId(firstArg)) {
      return this._mapping
        .get(firstArg.chain)
        ?.get(firstArg.address.toString().toLowerCase());
    } else if (isTokenTuple(firstArg)) {
      return this._mapping.get(firstArg[0])?.get(firstArg[1].toLowerCase());
    } else {
      const tokenId = parseTokenKey(firstArg);
      return this._mapping
        .get(tokenId.chain)
        ?.get(addressString(tokenId).toLowerCase());
    }
  }

  mustGet(key: string): T;
  mustGet(tokenId: TokenId): T;
  mustGet(tokenTuple: TokenTuple): T;
  mustGet(chain: Chain, address: string): T;
  mustGet(
    firstArg: Chain | string | TokenId | TokenTuple,
    address?: string,
  ): T {
    // @ts-ignore - TS is complaining about this and I cant figure out why
    const t = this.get(firstArg, address);
    if (!t) {
      throw new Error('Failed to get token');
    }
    return t;
  }

  getList(keys: string[]): Token[];
  getList(keys: TokenId[]): Token[];
  getList(keys: TokenTuple[]): Token[];
  getList(keys: string[] | TokenId[] | TokenTuple[]): Token[] {
    return (
      keys
        // Typescript is throwing a fit here because of the overload in get()
        // but the code is type compliant. If you comment this out you can see
        // the ts error is nonsense.
        /* @ts-ignore */
        .map((k: string | TokenId) => this.get(k))
        .filter((t) => t !== undefined) as Token[]
    );
  }

  getAllForChain(chain: Chain): T[] {
    const chainTokens = this._mapping.get(chain);
    return chainTokens ? Array.from(chainTokens.values()) : [];
  }

  getAll(): T[] {
    return Array.from(this._mapping.values()).flatMap((chainMap) =>
      Array.from(chainMap.values()),
    );
  }

  get chains(): Chain[] {
    return Array.from(this._mapping.keys());
  }

  // Merge values from another TokenMapping into this one
  merge(other: TokenMapping<T>) {
    other.forEach(this.add);
  }

  // Removes all records from the TokenMapping
  clear() {
    this.lastUpdate = new Date();
    this._mapping = new Map();
    this.size = 0;
  }

  forEach(callback: (tokenId: TokenId, val: T) => void) {
    this._mapping.forEach((nextLevel, chain) => {
      nextLevel.forEach((val, addr) => {
        const tokenId = new TokenIdLazy(chain, addr);
        callback(tokenId, val);
      });
    });
  }

  get empty(): boolean {
    return this.size === 0;
  }

  // Create a deep copy of this TokenMapping
  clone(): TokenMapping<T> {
    const cloned = new TokenMapping<T>();
    this.forEach((tokenId, value) => {
      cloned.add(tokenId, value);
    });
    return cloned;
  }
}

export class TokenCache extends TokenMapping<Token> {
  add(token: Token) {
    if (token.tokenBridgeOriginalTokenId) {
      const original = this.get(token.tokenBridgeOriginalTokenId);
      if (original) {
        token.icon = original.icon;
        token.name = original.name;
        token.symbol = original.symbol;
      }
    }
    super.add(token, token);
  }

  // Fetches token metadata (decimals, symbol)
  getGasToken(chain: Chain): Token | undefined {
    if (chain === 'Celo') {
      // special case... Celo has multiple gas tokens (?!?!)
      return this.findBySymbol('Celo', 'CELO');
    }

    if (chain === 'XRPLEVM') {
      return this.findBySymbol('XRPLEVM', 'XRP');
    }

    return this.get(chain, 'native');
  }

  findByAddressOrSymbol(
    chain: Chain,
    addressOrSymbol: string,
  ): Token | undefined {
    const byAddress = this.get(chain, addressOrSymbol);
    if (byAddress) return byAddress;

    const bySymbol = this.findBySymbol(chain, addressOrSymbol);
    if (bySymbol) return bySymbol;

    return undefined;
  }

  // Queries tokens by symbol. If query is 1 or 2 characters, we look only for prefix matches
  queryBySymbol(chain: Chain, query: string): Token[] {
    return this.getAllForChain(chain).filter((t) => {
      return (
        t.symbol.toLowerCase().startsWith(query.toLowerCase()) ||
        t.name?.toLowerCase().startsWith(query.toLowerCase())
      );
    });
  }

  // This should be used sparingly/never... use addresses instead.
  // Excludes wrapped tokens
  findBySymbol(chain: Chain, symbol: string): Token | undefined {
    let matching = this.getAllForChain(chain).filter(
      (t) => t.symbol.toLowerCase() === symbol.toLowerCase(),
    );

    if (matching.length > 1) {
      // Exclude wrapped tokens if there's multiple matches
      matching = matching.filter((t) => !t.isTokenBridgeWrappedToken);
    }

    if (matching.length === 1) {
      return matching[0];
    } else if (matching.length > 1) {
      // This means there's more than one native token (not wrapped) with this symbol
      console.error(`Ambiguous token symbol: ${symbol}`);
    }

    return undefined;
  }

  setLocalStorageKey(key: string) {
    this._localStorageKey = key;
  }

  async addFromTokenId(tokenId: TokenId): Promise<Token> {
    if (
      tokenId.chain === 'Sui' &&
      !isValidSuiType(tokenId.address.toString())
    ) {
      throw new Error(
        `Not a valid Sui token address: ${tokenId.address.toString()}`,
      );
    }

    const wh = await getWormholeContextV2();
    const chain = wh.getChain(tokenId.chain);
    const decimals = await chain.getDecimals(tokenId.address);

    const metadata = await fetchTokenMetadata(tokenId);

    let symbol = metadata?.symbol?.toUpperCase() || '';
    let name = metadata?.name || '';
    let image = metadata?.image?.large || null;
    const coingeckoId = metadata?.web_slug;

    if (!symbol) {
      // Attempt to get the symbol from on-chain
      const { getTokenMetadataFromRpc } = await import('utils/tokens');
      const metadataRpc = await getTokenMetadataFromRpc(tokenId);
      if (metadataRpc) {
        console.info('Got metadata from RPC', metadataRpc);
        symbol = metadataRpc.symbol;
        name = metadataRpc.name;
        image = metadataRpc.icon;
      }
    }

    // Check if this is a Token Bridge wrapped token
    let tokenBridgeOriginalTokenId: TokenId | undefined = undefined;
    const tb = await chain.getTokenBridge();
    if (await tb.isWrappedAsset(tokenId.address)) {
      tokenBridgeOriginalTokenId = await tb.getOriginalAsset(tokenId.address);

      if (UniversalAddress.instanceof(tokenBridgeOriginalTokenId.address)) {
        // For move based platforms like Sui and Aptos we have to convert from UniversalAddress to NativeAddress
        tokenBridgeOriginalTokenId.address = await wh.getTokenNativeAddress(
          tokenBridgeOriginalTokenId.chain,
          tokenBridgeOriginalTokenId.chain,
          tokenBridgeOriginalTokenId.address,
        );
      }

      // For wrapped tokens, if we have an icon & symbol for its original token,
      // override the wrapped token's metadata with those to ensure they match.
      if (tokenBridgeOriginalTokenId) {
        const originalToken = this.get(tokenBridgeOriginalTokenId);
        if (originalToken && originalToken.icon) {
          image = originalToken.icon;
          symbol = originalToken.symbol;
        }
      }
    }

    const t = new Token(
      tokenId.chain,
      canonicalAddress(tokenId),
      decimals,
      symbol,
      name,
      image,
      tokenBridgeOriginalTokenId,
      coingeckoId,
    );

    this.add(t);

    return t;
  }

  persist() {
    if (HAS_LOCALSTORAGE && this._localStorageKey) {
      const asJson = {
        version: TOKEN_CACHE_VERSION,
        tokens: {},
      };
      this.forEach((tokenId, token) => {
        asJson.tokens[tokenKey(tokenId)] = token.toJson();
      });

      const jsonString = JSON.stringify(asJson);
      localStorage.setItem(this._localStorageKey, jsonString);
    }
  }

  static load(localStorageKey: string): TokenCache {
    if (HAS_LOCALSTORAGE) {
      const jsonString = localStorage.getItem(localStorageKey);
      if (jsonString) {
        try {
          const asJson = JSON.parse(jsonString);
          const mapping = new TokenCache();

          mapping.setLocalStorageKey(localStorageKey);

          for (const [, tokenData] of Object.entries(asJson.tokens)) {
            const token = Token.fromJson(tokenData as TokenJson);
            mapping.add(token);
          }

          return mapping;
        } catch (e) {
          console.error('Error parsing cached TokenCache', e);
        }
      }
    }

    // Fallback
    const mapping = new TokenCache();
    mapping.setLocalStorageKey(localStorageKey);
    return mapping;
  }
}

// Seed a new TokenCache using hard-coded tokens
export function buildTokenCache(
  tokens: TokenConfig[],
  wrappedTokens: WrappedTokenAddresses,
  cacheKey: string,
): TokenCache {
  const cache = TokenCache.load(cacheKey);

  for (const { tokenId, symbol, name, icon, decimals } of tokens) {
    const token = new Token(
      tokenId.chain,
      tokenId.address.toString(),
      decimals,
      symbol,
      name,
      icon,
    );
    token.isBuiltin = true;
    cache.add(token);
  }

  // Temporary hack... use wrappedTokens to populate the cache with all of the known
  // token bridge foreign assets. When we are able to fetch full token balances for every chain
  // this will become unnecessary.
  for (const chain in wrappedTokens) {
    for (const addr in wrappedTokens[chain]) {
      const wts = wrappedTokens[chain][addr];
      for (const otherChain in wts) {
        const originalToken = cache.get(chain as Chain, addr);
        if (originalToken) {
          const wrappedAddr = wts[otherChain];

          let decimals =
            chainToPlatform(otherChain as Chain) === 'Evm' ? 18 : 8;

          decimals = Math.min(decimals, originalToken.decimals);

          const wrappedToken = new Token(
            otherChain as Chain,
            wrappedAddr,
            decimals,
            originalToken.symbol,
            originalToken.name,
            originalToken.icon,
            originalToken,
          );
          wrappedToken.isBuiltin = true;

          cache.add(wrappedToken);
        }
      }
    }
  }

  cache.persist();
  return cache;
}

// A tuple containing a chain, and native address.
// Basically the same as a TokenId, but JSON-friendly.
export type TokenTuple = [Chain, string];

export function isTokenTuple(thing: any): thing is TokenTuple {
  return Array.isArray(thing) && thing.length == 2 && isChain(thing[0]);
}

export function tokenIdToTuple(tokenId: TokenId): TokenTuple {
  return [tokenId.chain, addressString(tokenId)];
}

export function tokenIdFromTuple(tokenTuple: TokenTuple): TokenId {
  return TokenIdLazy.fromTokenTuple(tokenTuple);
}

export function tokenKey(chain: Chain, address: string): string;
export function tokenKey(tokenId: TokenId): string;
export function tokenKey(
  tokenIdOrChain: TokenId | Chain,
  address?: string,
): string {
  if (typeof tokenIdOrChain === 'string') {
    return JSON.stringify([tokenIdOrChain, address]);
  } else {
    return JSON.stringify(tokenIdToTuple(tokenIdOrChain));
  }
}

export function parseTokenKey(key: string): TokenId {
  const tuple = JSON.parse(key) as TokenTuple;
  if (isTokenTuple(tuple)) {
    return tokenIdFromTuple(tuple);
  } else {
    throw new Error(`Invalid token key "${key}"; couldn't parse`);
  }
}

export function addressString(tokenId: TokenId): string {
  if (tokenId instanceof TokenIdLazy) {
    return tokenId.addressString;
  } else {
    return tokenId.address.toString();
  }
}

export function isSameToken(a: Token, b: Token): boolean {
  return a.chain === b.chain && a.addressString === b.addressString;
}
