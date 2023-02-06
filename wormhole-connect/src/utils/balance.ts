import { BigNumber, utils } from 'ethers';
import { TOKENS } from 'sdk/config';

// TODO: get balances
// https://chainstack.com/the-ultimate-guide-to-getting-multiple-token-balances-on-ethereum/
// require('isomorphic-fetch');
// const ethers = require('ethers');
// // const { abi, bathEndpoint, walletAddress } = require('./constant.js');
// // const { convertToNumber, getTokens } = require('./utils');
// const walletAddress = '0x7D414a4223A5145d60Ce4c587d23f2b1a4Db50e4';
// const endpoint = '';
// const abi = '';
// const convertIndexToAlphetString = (number: number) => number
//   .toString()
//   .split('')
//   .map(numberChar => String.fromCharCode(65 + parseInt(numberChar)))
//   .join('');
// const queryTemplate = (index: number, { address }: { address: string }, callData: string) => `
//   ${convertIndexToAlphetString(index)}: call(data: { to: "${address}", data: "${callData}" }) { data }`;
// const retrieveTokenBalanceViaGraphQL = (tokens: { address: string }[]) => {
//   const ethersInterface = new ethers.utils.Interface(abi);
//   const callData = ethersInterface
//     .functions.balanceOf.encode([walletAddress]);
//   const query = tokens.map((token, index) => {
//     return queryTemplate(index, token, callData);
//   }).join('\n');
//   return fetch(`${endpoint}/graphql`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({ query: `{ block { ${query} } }` }),
//   })
//     .then(data => data.json());
// };

// const main = async () => {
//   // const { tokens } = await getTokens();
//   const tokens = [{ address: '', name: '', decimals: 18, symbol: '' }]
//   const tokenBalances = await retrieveTokenBalanceViaGraphQL(tokens)
//     .then(({ data: { block: balances } })  => {
//       const output: {[key: string]: any} = {};
//       Object.entries(balances).map(([, res], index) => {
//         const { name, decimals, symbol } = tokens[index];
//         output[name] = `${convertToNumber((res as any).data, decimals)} ${symbol}`;
//       });
//       return output;
//     });
//   console.log(tokenBalances);
// };
// main();

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
  return number.slice(0, end);
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
