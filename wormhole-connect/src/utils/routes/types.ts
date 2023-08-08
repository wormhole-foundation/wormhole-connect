import { BridgeRoute } from './bridge';
import { HashflowRoute } from './hashflow';
import { RelayRoute } from './relay';

export type AnyRoute = BridgeRoute | RelayRoute | HashflowRoute;

export type Row = {
  title: string;
  value: string;
};

export interface NestedRow extends Row {
  rows?: Row[];
}

export type TransferDisplayData = NestedRow[];
