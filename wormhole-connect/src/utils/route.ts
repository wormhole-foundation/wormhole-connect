import { RoutesConfig } from 'config/routes';
import RouteOperator from 'routes/operator';
import { isPorticoRoute } from 'routes/porticoBridge/utils';
import { isGatewayChain } from './cosmos';
import { Route } from 'config/types';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';

export const isValidRouteName = (routeName: string): routeName is Route =>
  routeName in RoutesConfig;

export const isAutomatic = (routeName: string, toChain?: ChainName) => {
  if (isValidRouteName(routeName)) {
    const route = RouteOperator.getRoute(routeName);
    return (
      route.AUTOMATIC_DEPOSIT ||
      (toChain && (isGatewayChain(toChain) || toChain === 'sei')) ||
      isPorticoRoute(route.TYPE)
    );
  }
  return false;
};
