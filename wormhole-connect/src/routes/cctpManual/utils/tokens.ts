import { ChainName, ChainId } from '@wormhole-foundation/wormhole-connect-sdk';
import config from 'config';

export const CCTPTokenSymbol = 'USDC';

export function getForeignUSDCAddress(chain: ChainName | ChainId) {
  const usdcToken = config.tokensArr.find(
    (t) =>
      t.symbol === CCTPTokenSymbol &&
      t.nativeChain === config.wh.toChainName(chain) &&
      t.tokenId?.chain === config.wh.toChainName(chain),
  );
  if (!usdcToken) {
    throw new Error('No foreign native USDC address');
  }
  return usdcToken.tokenId?.address;
}
