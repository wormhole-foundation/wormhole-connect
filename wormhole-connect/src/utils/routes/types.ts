import { BridgeRoute } from './bridge';
import { HashflowRoute } from './hashflow';
import { RelayRoute } from './relay';

export type AnyRoute = BridgeRoute | RelayRoute | HashflowRoute;
