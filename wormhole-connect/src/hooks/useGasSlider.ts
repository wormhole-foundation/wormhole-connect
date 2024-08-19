import config from 'config';
import { getWrappedToken } from 'utils';

import { Chain } from '@wormhole-foundation/sdk';

type Props = {
  destChain: Chain | undefined;
  destToken: string;
  route?: string;
  valid: boolean;
  isTransactionInProgress: boolean;
};

export const useGasSlider = (
  props: Props,
): {
  disabled: boolean;
  showGasSlider: boolean | undefined;
} => {
  const { destChain, destToken, route, isTransactionInProgress, valid } = props;

  const disabled = !valid || isTransactionInProgress;
  const toChainConfig = destChain ? config.chains[destChain] : undefined;
  const gasTokenConfig = toChainConfig
    ? config.tokens[toChainConfig.gasToken]
    : undefined;
  const wrappedGasTokenConfig = gasTokenConfig
    ? getWrappedToken(gasTokenConfig)
    : undefined;
  const willReceiveGasToken =
    wrappedGasTokenConfig && destToken === wrappedGasTokenConfig.key;
  const showGasSlider =
    !!route &&
    config.routes.get(route).NATIVE_GAS_DROPOFF_SUPPORTED &&
    !willReceiveGasToken;

  return {
    disabled,
    showGasSlider,
  };
};
