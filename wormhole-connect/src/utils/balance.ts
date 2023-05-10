import { BigNumber, utils, providers } from 'ethers';
import { ChainName, Context } from '@wormhole-foundation/wormhole-connect-sdk';
import { CHAINS, TOKENS } from '../config';
import { WH_CONFIG } from '../config';
import { getBalance, getNativeBalance } from 'sdk';
import { formatBalance } from 'store/transfer';
import { TokenConfig } from 'config/types';

export async function getBalances(
  chain: ChainName,
  walletAddr: string,
  tokens: TokenConfig[],
): Promise<any[]> {
  const chainConfig = CHAINS[chain]!;
  if (chainConfig.context === Context.ETH) {
    return await getEvmBalances(chain, walletAddr, tokens);
  } else {
    // fetch all N tokens and trigger a single update action
    let balances: any = [];
    for (const token of tokens) {
      const balance = token.tokenId
        ? await getBalance(walletAddr, token.tokenId, chain)
        : await getNativeBalance(walletAddr, chain);

      balances.push(formatBalance(chain, token, balance));
    }
    return balances;
  }
}

export async function getEvmBalances(
  chain: ChainName,
  walletAddr: string,
  tokens: any,
): Promise<any[]> {
  const rpcUrl = WH_CONFIG.rpcs[chain];
  if (!rpcUrl) return [];
  const batchProvider = new providers.JsonRpcBatchProvider(rpcUrl);
  const balances = await Promise.all(
    tokens.map(async (t: TokenConfig) => {
      const balance = t.tokenId
        ? await getBalance(walletAddr, t.tokenId, chain, batchProvider)
        : await getNativeBalance(walletAddr, chain, batchProvider);

      return formatBalance(chain, t, balance);
    }),
  );
  return balances;
}

/**
 * Makes a BigNumber have # of decimals
 */
export function toDecimals(
  amnt: BigNumber,
  tokenDecimals: number,
  numDecimals?: number,
): string {
  const decimal = utils.formatUnits(amnt, tokenDecimals);
  return toFixedDecimals(decimal, numDecimals || 18);
}

export function toFixedDecimals(number: string, numDecimals: number) {
  if (number === '0.0') {
    return '0';
  }

  const index = number.indexOf('.');
  if (index === -1) {
    return number;
  }

  const end = index + (numDecimals || 18) + 1;
  return `${Number.parseFloat(number.slice(0, end))}`;
}

export async function getUsdVal(token: string) {
  const tokenConfig = TOKENS[token];
  if (!tokenConfig) throw new Error(`invalid token: ${token}`);
  const { coinGeckoId } = tokenConfig;
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd`,
  );
  const data = await res.json();
  if (data[coinGeckoId]) {
    const { usd } = data[coinGeckoId];
    return usd;
  }
}

export async function getConversion(token1: string, token2: string) {
  const token1Val = await getUsdVal(token1);
  const token2Val = await getUsdVal(token2);
  return token1Val / token2Val;
}
