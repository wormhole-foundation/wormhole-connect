import { TokenDetails, TransferDetails } from './types';
import { Chain, amount as sdkAmount } from '@wormhole-foundation/sdk';
import { Token } from 'config/tokens';

export * from './types';

export function getTokenDetails(token: Token): TokenDetails {
  return {
    symbol: token.symbol,
    tokenId: {
      chain: token.chain,
      address: token.address.toString(),
    },
  };
}

export function getTransferDetails(
  route: string,
  sourceToken: Token,
  destToken: Token,
  sourceChain: Chain,
  destChain: Chain,
  amount: sdkAmount.Amount,
  getUSDAmount: (args: {
    token: Token;
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
