import config from 'config';
import RouteOperator from 'routes/operator';
import { getWrappedToken } from 'utils';

import type { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import type { Route } from 'config/types';

type Props = {
  destChain: ChainName | undefined;
  destToken: string;
  route: Route | undefined;
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
    route &&
    RouteOperator.getRoute(route).NATIVE_GAS_DROPOFF_SUPPORTED &&
    !willReceiveGasToken;

  return {
    disabled,
    showGasSlider,
  };
};
