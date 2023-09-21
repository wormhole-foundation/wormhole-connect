import { ChainName, TokenId } from '@wormhole-foundation/wormhole-connect-sdk';
import { TokenConfig } from 'config/types';
import { constants } from 'ethers';
import { getTokenById } from 'utils';

export const filterTokens = (
  chain: ChainName,
  tokens: { address: string }[],
): TokenConfig[] => {
  const tokensConfig = tokens.map((t) => {
    const tokenId = {
      chain,
      address: t.address,
    };
    return getTokenById(tokenId);
  });
  return tokensConfig.filter((t) => !!t) as unknown as TokenConfig[];
};

// assumed token is on the same chain as the tokens list
export const findTokenInList = (
  tokenId: TokenId | undefined,
  tokens: { address: string }[],
): boolean => {
  if (!tokens || tokens.length === 0) return false;
  if (tokenId) {
    return tokens.some((t) => t.address === tokenId.address);
  }
  return tokens.some((t) => (t.address = constants.AddressZero));
};
