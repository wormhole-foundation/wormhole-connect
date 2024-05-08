import {
  ChainName,
  ChainId,
  MAINNET_CHAINS,
  ParsedMessage as SdkParsedMessage,
  ParsedRelayerMessage as SdkParsedRelayerMessage,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber, utils } from 'ethers';
import config from 'config';
import { toFixedDecimals } from 'utils/balance';
import {
  ParsedMessage,
  ParsedRelayerMessage,
  PayloadType,
  solanaContext,
} from 'utils/sdk';
import { getTokenById } from 'utils';
import { CHAIN_ID_ETH } from '@certusone/wormhole-sdk/lib/esm/utils';
import { Route, TokenConfig } from 'config/types';

// adapts the sdk returned parsed message to the type that
// wh connect uses
export const adaptParsedMessage = async (
  parsed: SdkParsedMessage | SdkParsedRelayerMessage,
): Promise<ParsedMessage | ParsedRelayerMessage> => {
  const tokenId = {
    address: parsed.tokenAddress,
    chain: parsed.tokenChain,
  };
  const decimals = await config.wh.fetchTokenDecimals(
    tokenId,
    parsed.fromChain,
  );
  const token = getTokenById(tokenId);

  const base: ParsedMessage = {
    ...parsed,
    amount: parsed.amount.toString(),
    tokenKey: token?.key || '',
    tokenDecimals: decimals,
    receivedTokenKey: token?.key || '',
    sequence: parsed.sequence?.toString(),
    gasFee: parsed.gasFee ? parsed.gasFee.toString() : undefined,
  };
  // get wallet address of associated token account for Solana
  // the recipient is the wallet address for the automatic payload type
  const toChainId = config.wh.toChainId(parsed.toChain);
  if (
    toChainId === MAINNET_CHAINS.solana &&
    parsed.payloadID === PayloadType.Manual
  ) {
    try {
      const accountOwner = await solanaContext().getTokenAccountOwner(
        parsed.recipient,
      );
      base.recipient = accountOwner;
    } catch (e: any) {
      if (e.name === 'TokenAccountNotFoundError') {
        // we'll promp them to create it before claiming it
        base.recipient = '';
      } else {
        throw e;
      }
    }
  }
  return base;
};

export const formatGasFee = (chain: ChainName | ChainId, gasFee: BigNumber) => {
  const chainName = config.wh.toChainName(chain);
  const chainConfig = config.chains[chainName]!;
  const nativeDecimals = chainConfig.nativeTokenDecimals;
  return toFixedDecimals(utils.formatUnits(gasFee, nativeDecimals), 6);
};

export const isIlliquidDestToken = (
  { symbol, nativeChain }: TokenConfig,
  destChain: ChainName | ChainId,
): boolean => {
  // we want to prevent users from receiving non-native or non-Ethereum origin WETH or wstETH
  // which may lack liquid markets and cause confusion for users
  if (['WETH', 'wstETH'].includes(symbol)) {
    if (
      nativeChain !== config.wh.toChainName(destChain) &&
      config.wh.toChainId(nativeChain) !== CHAIN_ID_ETH
    ) {
      return true;
    }
  }
  // Users should send USDC to Fantom via NTT instead of the token bridge
  if (
    symbol === 'USDC' &&
    nativeChain === 'ethereum' &&
    destChain === 'fantom'
  ) {
    return true;
  }
  if (
    symbol === 'USDC' &&
    nativeChain === 'fuji' &&
    destChain === 'alfajores'
  ) {
    return true;
  }
  if (
    symbol === 'USDC.e' &&
    (nativeChain === 'fantom' || nativeChain === 'alfajores')
  ) {
    return true;
  }
  if (
    ['ETH', 'WETH'].includes(symbol) &&
    nativeChain === 'ethereum' &&
    destChain === 'scroll'
  ) {
    return true;
  }
  return false;
};

export const isNttRoute = (route?: Route) => {
  return route === Route.NttManual || route === Route.NttRelay;
};
