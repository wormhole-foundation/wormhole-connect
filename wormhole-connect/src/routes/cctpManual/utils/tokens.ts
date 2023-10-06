import { ChainName, ChainId } from '@wormhole-foundation/wormhole-connect-sdk';
import { TOKENS_ARR } from 'config';
import { wh } from 'utils/sdk';

export const CCTPTokenSymbol = 'USDC';

export function getForeignUSDCAddress(chain: ChainName | ChainId) {
  const usdcToken = TOKENS_ARR.find(
    (t) =>
      t.symbol === CCTPTokenSymbol &&
      t.nativeChain === wh.toChainName(chain) &&
      t.tokenId?.chain === wh.toChainName(chain),
  );
  if (!usdcToken) {
    throw new Error('No foreign native USDC address');
  }
  return usdcToken.tokenId?.address;
}
