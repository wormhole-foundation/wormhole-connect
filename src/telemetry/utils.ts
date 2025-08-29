import type { InternalConfig } from 'config';
import type { Chain, Token } from 'exports';
import { UserActions } from 'exports';

export const handleSelectChain = (
  chain: Chain,
  isSource: boolean,
  config: InternalConfig<'Mainnet' | 'Testnet' | 'Devnet'>,
) => {
  config.triggerEvent({
    type: 'user.action',
    details: {
      value: chain,
      action: isSource
        ? UserActions.SelectSrcChain
        : UserActions.SelectDestChain,
    },
  });
};

export const handleSelectToken = (
  token: Token,
  isSource: boolean,
  config: InternalConfig<'Mainnet' | 'Testnet' | 'Devnet'>,
) => {
  config.triggerEvent({
    type: 'user.action',
    details: {
      value: token,
      action: isSource
        ? UserActions.SelectSrcToken
        : UserActions.SelectDestToken,
    },
  });
};
