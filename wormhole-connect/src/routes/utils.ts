import { Route } from 'config/types';

export const isNttRoute = (route?: Route) => {
  return route === Route.NttManual || route === Route.NttRelay;
};
