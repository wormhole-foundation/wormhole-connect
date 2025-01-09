import config from 'config';
import { getWrappedToken } from 'utils';

import { Chain } from '@wormhole-foundation/sdk';

type Props = {
  destChain: Chain | undefined;
  destToken: string | undefined;
  route?: string;
  isTransactionInProgress: boolean;
};

export const useGasSlider = (
  props: Props,
): {
  disabled: boolean;
  showGasSlider: boolean | undefined;
} => {
  const { destChain, destToken, route, isTransactionInProgress } = props;

  const disabled = isTransactionInProgress;
  const toChainConfig = destChain ? config.chains[destChain] : undefined;
  const gasTokenConfig = toChainConfig
    ? config.tokens.getGasToken(toChainConfig.sdkName)
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
