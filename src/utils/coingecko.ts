import type { Chain, TokenId } from '@wormhole-foundation/sdk';
import { isNative, Wormhole } from '@wormhole-foundation/sdk';
import config from 'config';
import { TokenMapping } from 'config/tokens';
import { normalizeAddress } from './address';

const COINGECKO_URL = 'https://api.coingecko.com';
const COINGECKO_URL_PRO = 'https://pro-api.coingecko.com';
const COINGECKO_TOKEN_LIST_URL = 'https://tokens.coingecko.com';

// Cache durations
const TOKEN_LIST_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export interface CoingeckoParams {
  abort: AbortController;
}

interface TokenListCache {
  addresses: string[];
  timestamp: number;
}

const coingeckoRequest = async (
  path: string,
  params?: CoingeckoParams,
): Promise<any> => {
  const headers = new Headers({
    ...(config.coingecko?.apiKey
      ? { 'x-cg-pro-api-key': config.coingecko.apiKey }
      : {}),
  });

  const hostname = config.coingecko?.customUrl
    ? config.coingecko.customUrl
    : config.coingecko?.apiKey
    ? COINGECKO_URL_PRO
    : COINGECKO_URL;

  return fetch(`${hostname}${path}`, {
    signal: params?.abort?.signal,
    headers,
  })
    .then((resp) => resp.json())
    .catch((err) => {
      console.error('Error fetching from Coingecko', err);
      return null;
    });
};

export const fetchTokenMetadata = async (
  tokenId: TokenId,
  params?: CoingeckoParams,
): Promise<any> => {
  if (config.network !== 'Mainnet') return null;

  return coingeckoRequest(
    `/api/v3/coins/${tokenId.chain.toLowerCase()}/contract/${tokenId.address.toString()}`,
    params,
  );
};

export const fetchTokenPrices = async (
  tokens: TokenId[],
  params?: CoingeckoParams,
): Promise<TokenMapping<number>> => {
  const tm: TokenMapping<number> = new TokenMapping();

  if (config.network !== 'Mainnet') return tm;

  const chainsAndAddresses = {};
  // For native tokens like SOL, ETH, BNB, we use a different endpoint since these don't have a token address :)
  const nativeTokens: TokenId[] = [];

  for (const token of tokens) {
    if (isNative(token.address)) {
      nativeTokens.push(token);
    } else {
      if (chainsAndAddresses[token.chain] === undefined) {
        chainsAndAddresses[token.chain] = [];
      }
      chainsAndAddresses[token.chain]!.push(token.address.toString());
    }
  }

  const promises = Object.keys(chainsAndAddresses).map((chain) => {
    const addresses = chainsAndAddresses[chain];

    return new Promise((resolve, reject) => {
      const addrs = addresses.join(',');
      const chainConfig = config.chains[chain as Chain];
      const platformId = chainConfig?.coingeckoPlatformId;
      const cgChain = platformId?.toString() || chain.toLowerCase();

      coingeckoRequest(
        `/api/v3/simple/token_price/${cgChain}?contract_addresses=${addrs}&vs_currencies=usd`,
        params,
      )
        .then((data) => {
          if (data['error'] !== undefined || data['error_code'] !== undefined) {
            reject(data['error']);
          } else {
            resolve(
              Object.keys(data)
                .map((addr) => {
                  try {
                    const tokenId = Wormhole.tokenId(chain as Chain, addr);

                    if (data[addr]) {
                      return {
                        tokenId,
                        price: data[addr].usd,
                      };
                    } else {
                      return null;
                    }
                  } catch (e) {
                    // Error parsing address
                    console.error('Coingecko error', e);
                    return null;
                  }
                })
                .filter((d) => d !== null),
            );
          }
        })
        .catch(reject);
    });
  });

  if (nativeTokens.length > 0) {
    promises.push(
      new Promise((resolve, reject) => {
        const ids: string[] = [];
        for (const token of nativeTokens) {
          const chainConfig = config.chains[token.chain];
          const cgid = chainConfig?.coingeckoNativeTokenId;
          if (cgid) {
            ids.push(cgid);
          } else {
            console.error(
              `Don't know a coingecko ID for native token for chain ${token.chain}`,
            );
          }
        }

        coingeckoRequest(
          `/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`,
          params,
        )
          .then((data) =>
            resolve(
              nativeTokens
                .map((tokenId) => {
                  const chainConfig = config.chains[tokenId.chain];
                  const cgid = chainConfig?.coingeckoNativeTokenId;
                  if (cgid) {
                    const { usd } = data[cgid];
                    return {
                      tokenId,
                      price: usd,
                    };
                  } else {
                    return null;
                  }
                })
                .filter((v) => !!v),
            ),
          )
          .catch(reject);
      }),
    );
  }

  const results = (await Promise.allSettled(promises))
    .map((r) => {
      if (r.status === 'fulfilled') {
        return r.value;
      } else {
        return null;
      }
    })
    .filter((r) => !!r)
    .flat() as {
    tokenId: TokenId;
    price: number;
  }[];

  for (const { tokenId, price } of results) {
    tm.add(tokenId, price);
  }

  return tm;
};

/**
 * Gets the CoinGecko platform ID for a given chain.
 * Returns the coingeckoPlatformId directly from chain config.
 */
const getPlatformIdForChain = (chain: Chain): string | null => {
  const chainConfig = config.chains[chain];
  return chainConfig?.coingeckoPlatformId ?? null;
};

/**
 * Fetches the CoinGecko token list for a specific chain.
 * Returns a Set of token addresses (lowercase) that are in CoinGecko's top 1000 for that chain.
 * Uses localStorage for caching with 24-hour TTL.
 */
export const fetchCoingeckoTokenListForChain = async (
  chain: Chain,
): Promise<Set<string>> => {
  const platformId = getPlatformIdForChain(chain);

  if (!platformId) {
    console.debug(
      `No CoinGecko token list platform ID for chain ${chain}, skipping filter`,
    );
    return new Set();
  }

  const cacheKey = config.cacheKey(`coingecko-tokens-${chain}`);

  // Try to load from localStorage cache
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { addresses, timestamp }: TokenListCache = JSON.parse(cached);
      const now = Date.now();

      if (now - timestamp < TOKEN_LIST_CACHE_DURATION) {
        console.debug(`Using cached CoinGecko token list for ${chain}`);
        return new Set(addresses);
      }
    }
  } catch (e) {
    console.error('Error reading CoinGecko token list cache:', e);
  }

  // Fetch fresh data
  try {
    console.info(`Fetching CoinGecko token list for ${chain}...`);

    let data;
    // Use Pro API endpoint if API key is configured, otherwise use public token list URL
    if (config.coingecko?.apiKey) {
      data = await coingeckoRequest(
        `/api/v3/token_lists/${platformId}/all.json`,
      );
    } else {
      const response = await fetch(
        `${COINGECKO_TOKEN_LIST_URL}/${platformId}/all.json`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch token list: ${response.status} ${response.statusText}`,
        );
      }

      data = await response.json();
    }

    if (!data || !data.tokens || !Array.isArray(data.tokens)) {
      throw new Error('Invalid token list response format');
    }

    // Normalize addresses based on chain type
    // EVM: lowercase (case-insensitive), Solana/Sui/Aptos: preserve case
    const addresses = data.tokens.map((token: any) =>
      normalizeAddress(token.address, chain),
    );

    // Cache in localStorage
    try {
      const cacheData: TokenListCache = {
        addresses,
        timestamp: Date.now(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (e) {
      console.error('Error caching CoinGecko token list:', e);
    }

    console.info(
      `Fetched ${addresses.length} tokens from CoinGecko for ${chain}`,
    );
    return new Set(addresses);
  } catch (error) {
    console.error(`Error fetching CoinGecko token list for ${chain}:`, error);
    return new Set();
  }
};
