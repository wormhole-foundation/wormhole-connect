import config from 'config';

import { TokenDetails, TransferDetails } from './types';
import { Chain, amount as sdkAmount } from '@wormhole-foundation/sdk';

export function getTokenDetails(token: string): TokenDetails {
  const tokenConfig = config.tokens[token]!;
  const { symbol, tokenId } = tokenConfig;

  return {
    symbol,
    tokenId: tokenId ?? 'native',
  };
}

export function getTransferDetails(
  route: string,
  sourceToken: string,
  destToken: string,
  sourceChain: Chain,
  destChain: Chain,
  amount: sdkAmount.Amount,
  getUSDAmount: (args: {
    token: string;
    amount: sdkAmount.Amount;
  }) => number | undefined,
): TransferDetails {
  return {
    route,
    fromToken: getTokenDetails(sourceToken),
    toToken: getTokenDetails(destToken),
    fromChain: sourceChain,
    toChain: destChain,
    amount,
    USDAmount: getUSDAmount({ token: sourceToken, amount }),
  };
}
