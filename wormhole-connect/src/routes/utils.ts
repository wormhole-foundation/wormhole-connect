import {
  ChainName,
  ChainId,
  MAINNET_CHAINS,
  ParsedMessage as SdkParsedMessage,
  ParsedRelayerMessage as SdkParsedRelayerMessage,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber, utils } from 'ethers';
import { CHAINS } from 'config';
import { toFixedDecimals } from 'utils/balance';
import {
  ParsedMessage,
  ParsedRelayerMessage,
  PayloadType,
  solanaContext,
  wh,
} from 'utils/sdk';
import { getTokenById } from 'utils';
import { CHAIN_ID_ETH } from '@certusone/wormhole-sdk/lib/esm/utils';
import { TokenConfig } from 'config/types';

// adapts the sdk returned parsed message to the type that
// wh connect uses
export const adaptParsedMessage = async (
  parsed: SdkParsedMessage | SdkParsedRelayerMessage,
): Promise<ParsedMessage | ParsedRelayerMessage> => {
  const tokenId = {
    address: parsed.tokenAddress,
    chain: parsed.tokenChain,
  };
  const decimals = await wh.fetchTokenDecimals(tokenId, parsed.fromChain);
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
  const toChainId = wh.toChainId(parsed.toChain);
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
  const chainName = wh.toChainName(chain);
  const chainConfig = CHAINS[chainName]!;
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
      nativeChain !== wh.toChainName(destChain) &&
      wh.toChainId(nativeChain) !== CHAIN_ID_ETH
    ) {
      return true;
    }
  }
  return false;
};
