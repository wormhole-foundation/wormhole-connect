import type { Chain } from '@wormhole-foundation/sdk';
import config from 'config';
import type { Token } from 'config/tokens';

type Props = {
  destChain?: Chain;
  destToken?: Token;
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

  // Disable gas toggle for BaseBridgeRoute when destination is Base
  const isBaseBridgeToBase =
    route === 'BaseBridgeRoute' && destChain === 'Base';

  const disabled = isTransactionInProgress || isBaseBridgeToBase;
  const showGasSlider =
    !!route &&
    config.routes.get(route).NATIVE_GAS_DROPOFF_SUPPORTED &&
    !destToken?.isNativeGasToken;

  return {
    disabled,
    showGasSlider,
  };
};
