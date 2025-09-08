import config from 'config';
import type { Chain } from '@wormhole-foundation/sdk-base';
import type { Token } from 'config/tokens';
import { UserActions } from './types';

export const handleTelemetryOnChainSelect = (
  chain: Chain,
  isSource: boolean,
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

export const handleTelemetryOnTokenSelect = (
  token: Token,
  isSource: boolean,
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
