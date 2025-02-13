import { Chain, isNative, TokenId, Wormhole } from '@wormhole-foundation/sdk';
import config from 'config';
import { TokenMapping } from 'config/tokens';

const COINGECKO_URL = 'https://api.coingecko.com';
const COINGECKO_URL_PRO = 'https://pro-api.coingecko.com';

const NATIVE_TOKEN_IDS: Partial<Record<Chain, string>> = {
  Solana: 'solana',
  Ethereum: 'ethereum',
  Arbitrum: 'ethereum',
  Optimism: 'ethereum',
  Base: 'ethereum',
  Scroll: 'ethereum',
  Blast: 'ethereum',
  Bsc: 'binancecoin',
  Polygon: 'matic-network',
  Avalanche: 'avalanche-2',
  Fantom: 'fantom',
  Moonbeam: 'moonbeam',
  Klaytn: 'klay-token',
  Xlayer: 'okb',
  Mantle: 'mantle',
  Aptos: 'aptos',
  Sui: 'sui',
};

// This refers to Coingecko API's platform names: https://api.coingecko.com/api/v3/asset_platforms
const CHAIN_IDS: Partial<Record<Chain, string>> = {
  Bsc: 'binance-smart-chain',
  Arbitrum: 'arbitrum-one',
  Optimism: 'optimism-ethereum',
  Polygon: 'polygon-pos',
  Klaytn: 'kaia-token',
  Xlayer: 'x-layer',
};

export interface CoingeckoParams {
  abort: AbortController;
}

const coingeckoRequest = async (
  path: string,
  params?: CoingeckoParams,
): Promise<Response> => {
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...(config.coinGeckoApiKey
      ? { 'x-cg-pro-api-key': config.coinGeckoApiKey }
      : {}),
  });

  const hostname = config.coinGeckoApiKey ? COINGECKO_URL_PRO : COINGECKO_URL;

  return fetch(`${hostname}${path}`, {
    signal: params?.abort?.signal,
    headers,
  }).then((resp) => resp.json());
};

export const fetchTokenMetadata = async (
  tokenId: TokenId,
  params?: CoingeckoParams,
): Promise<any> => {
  return coingeckoRequest(
    `/api/v3/coins/${tokenId.chain.toLowerCase()}/contract/${tokenId.address.toString()}`,
    params,
  );
};

export const fetchTokenPrices = async (
  tokens: TokenId[],
  params?: CoingeckoParams,
): Promise<TokenMapping<number>> => {
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
          if (data['error'] !== undefined) {
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
                    console.error(e);
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

  const tm: TokenMapping<number> = new TokenMapping();

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
