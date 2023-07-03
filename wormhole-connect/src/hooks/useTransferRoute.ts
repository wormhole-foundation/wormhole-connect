import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useMemo } from 'react';
import { Route } from '../store/transferInput';
import { BridgeRoute, HashflowRoute, RelayRoute } from '../utils/routes';
import RouteAbstract from '../utils/routes/routeAbstract';

const ROUTE_HANDLERS: { [r in Route]: RouteAbstract } = {
  [Route.BRIDGE]: new BridgeRoute(),
  [Route.RELAY]: new RelayRoute(),
  [Route.HASHFLOW]: new HashflowRoute(),
};

const useTransferRoute = (): RouteAbstract => {
  const { route } = useSelector((state: RootState) => state.transferInput);

  return useMemo(() => {
    return ROUTE_HANDLERS[route];
  }, [route]);
};

export default useTransferRoute;
