import type { Chain, TokenId } from '@wormhole-foundation/sdk';
import { isNative, Wormhole } from '@wormhole-foundation/sdk';
import config from 'config';
import { TokenMapping } from 'config/tokens';

const COINGECKO_URL = 'https://api.coingecko.com';
const COINGECKO_URL_PRO = 'https://pro-api.coingecko.com';
const COINGECKO_TOKEN_LIST_URL = 'https://tokens.coingecko.com';

// Cache durations
const TOKEN_LIST_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const ASSET_PLATFORMS_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Map our Chain types to their numeric chain IDs or platform identifiers on CoinGecko
// These will be used to match against CoinGecko's asset_platforms API
const CHAIN_TO_COINGECKO_ID: Partial<Record<Chain, number | string>> = {
  Ethereum: 1,
  Bsc: 56,
  Polygon: 137,
  Avalanche: 43114,
  Fantom: 250,
  Celo: 42220,
  Moonbeam: 1284,
  Base: 8453,
  Arbitrum: 42161,
  Optimism: 10,
  Klaytn: 8217,
  Scroll: 534352,
  Xlayer: 196,
  Mantle: 5000,
  Worldchain: 480,
  Unichain: 1301,
  Berachain: 80084,
  Ink: 'ink',
  Linea: 59144,
  Sonic: 146,
  Mezo: 'mezo',
  Seievm: 1329,
  Plume: 'plume-network',
  HyperEVM: 'hyperevm',
  HyperCore: 'hypercore',
  XRPLEVM: 'xrpl-evm-sidechain',
  CreditCoin: 'creditcoin',
  Fogo: 'fogo',
  Solana: 'solana',
  Sui: 'sui',
  Aptos: 'aptos',
};

const NATIVE_TOKEN_IDS: Partial<Record<Chain, string>> = {
  Solana: 'solana',
  Ethereum: 'ethereum',
  Arbitrum: 'ethereum',
  Optimism: 'ethereum',
  Base: 'ethereum',
  Scroll: 'ethereum',
  Bsc: 'binancecoin',
  Polygon: 'matic-network',
  Avalanche: 'avalanche-2',
  Fantom: 'fantom',
  Moonbeam: 'moonbeam',
  Klaytn: 'kaia',
  Xlayer: 'okb',
  Mantle: 'mantle',
  Aptos: 'aptos',
  Sui: 'sui',
  Berachain: 'berachain-bera',
  Unichain: 'ethereum',
  Sonic: 'sonic-3',
  Linea: 'ethereum',
  Worldchain: 'ethereum',
  Seievm: 'sei',
  Mezo: 'wrapped-bitcoin',
  Plume: 'plume',
  Ink: 'ethereum',
  HyperEVM: 'hyperliquid',
  HyperCore: 'usd-coin',
  CreditCoin: 'wrapped-ctc',
  Monad: 'monad',
  Fogo: 'fogo',
  Moca: 'moca',
  MegaETH: 'ethereum',
};

// This refers to Coingecko API's platform names: https://api.coingecko.com/api/v3/asset_platforms
const CHAIN_IDS: Partial<Record<Chain, string>> = {
  Bsc: 'binance-smart-chain',
  Arbitrum: 'arbitrum-one',
  Optimism: 'optimistic-ethereum',
  Polygon: 'polygon-pos',
  Klaytn: 'klay-token',
  Xlayer: 'x-layer',
  Worldchain: 'world-chain',
  Seievm: 'sei-v2',
  Mezo: 'mezo',
  HyperEVM: 'hyperevm',
  Plume: 'plume-network',
  Ink: 'ink',
  HyperCore: 'hypercore',
  Monad: 'monad',
  Fogo: 'fogo',
  Moca: 'moca',
};

export interface CoingeckoParams {
  abort: AbortController;
}

interface TokenListCache {
  addresses: string[];
  timestamp: number;
}

interface AssetPlatform {
  id: string;
  chain_identifier: number | null;
  name: string;
  shortname: string;
}

interface AssetPlatformsCache {
  platforms: AssetPlatform[];
  platformMap: Record<string, string>; // Chain identifier/name -> platform id
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
      const cgChain = CHAIN_IDS[chain] || chain.toLowerCase();

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
          const cgid = NATIVE_TOKEN_IDS[token.chain];
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
                  const cgid = NATIVE_TOKEN_IDS[tokenId.chain];
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
 * Fetches and caches the asset platforms from CoinGecko API.
 * Returns a mapping from our chain identifiers to CoinGecko platform IDs.
 * Uses localStorage for caching with 24-hour TTL.
 */
const fetchAssetPlatforms = async (): Promise<Record<string, string>> => {
  const cacheKey = config.cacheKey('coingecko-platforms');

  // Try to load from localStorage cache
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { platformMap, timestamp }: AssetPlatformsCache =
        JSON.parse(cached);
      const now = Date.now();

      if (now - timestamp < ASSET_PLATFORMS_CACHE_DURATION) {
        console.debug('Using cached CoinGecko asset platforms');
        return platformMap;
      }
    }
  } catch (e) {
    console.error('Error reading CoinGecko asset platforms cache:', e);
  }

  // Fetch fresh data from CoinGecko
  try {
    console.info('Fetching CoinGecko asset platforms...');
    const platforms = await coingeckoRequest('/api/v3/asset_platforms');

    if (!platforms || !Array.isArray(platforms)) {
      throw new Error('Invalid asset platforms response');
    }

    // Build mapping from chain_identifier -> platform id
    const platformMap: Record<string, string> = {};

    for (const platform of platforms as AssetPlatform[]) {
      // Map by chain_identifier (for EVM chains)
      if (platform.chain_identifier !== null) {
        platformMap[platform.chain_identifier.toString()] = platform.id;
      }
      // Also map by platform id (for non-EVM chains)
      platformMap[platform.id] = platform.id;
    }

    // Cache in localStorage
    try {
      const cacheData: AssetPlatformsCache = {
        platforms: platforms as AssetPlatform[],
        platformMap,
        timestamp: Date.now(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.info(`Cached ${platforms.length} asset platforms from CoinGecko`);
    } catch (e) {
      console.error('Error caching CoinGecko asset platforms:', e);
    }

    return platformMap;
  } catch (error) {
    console.error('Error fetching CoinGecko asset platforms:', error);
    return {};
  }
};

/**
 * Gets the CoinGecko platform ID for a given chain.
 * Uses the asset platforms API to dynamically match chains.
 */
const getPlatformIdForChain = async (chain: Chain): Promise<string | null> => {
  const identifier = CHAIN_TO_COINGECKO_ID[chain];
  if (!identifier) {
    return null;
  }

  const platformMap = await fetchAssetPlatforms();
  return platformMap[identifier.toString()] || null;
};

/**
 * Fetches the CoinGecko token list for a specific chain.
 * Returns a Set of token addresses (lowercase) that are in CoinGecko's top 1000 for that chain.
 * Uses localStorage for caching with 24-hour TTL.
 */
export const fetchCoingeckoTokenListForChain = async (
  chain: Chain,
): Promise<Set<string>> => {
  const platformId = await getPlatformIdForChain(chain);

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

    // Extract addresses and normalize to lowercase
    const addresses = data.tokens.map((token: any) =>
      token.address.toLowerCase(),
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
