import { Chain, TokenId } from '@wormhole-foundation/sdk';
import config from 'config';
import { addressString } from 'config/tokens';

export const isNttToken = (tokenId: TokenId): boolean => {
  return (
    ['ManualNtt', 'AutomaticNtt', 'M0AutomaticRoute']
      .map((rn) => {
        const route = config.routes.get(rn);
        if (route) {
          const nttConfig = (route.rc as any).config;
          if (nttConfig) {
            for (const key in nttConfig.tokens) {
              const options: { chain: Chain; token: string }[] = nttConfig[key];

              if (options) {
                for (const opt of options) {
                  if (
                    opt.chain === tokenId.chain &&
                    opt.token === addressString(tokenId)
                  ) {
                    return true;
                  }
                }
              }
            }
          }
        }
        return false;
      })
      .find((r) => r) !== undefined
  );
};
