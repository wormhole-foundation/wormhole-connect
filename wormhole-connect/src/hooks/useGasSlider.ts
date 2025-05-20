import config from 'config';
import { Token } from 'config/tokens';

type Props = {
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
  const { destToken, route, isTransactionInProgress } = props;

  const disabled = isTransactionInProgress;
  const showGasSlider =
    !!route &&
    config.routes.get(route).NATIVE_GAS_DROPOFF_SUPPORTED &&
    !destToken?.isNativeGasToken;

  return {
    disabled,
    showGasSlider,
  };
};
