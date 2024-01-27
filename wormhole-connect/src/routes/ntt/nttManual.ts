import { Route } from 'config/types';
import { NttBase } from './nttBase';

export class NttManual extends NttBase {
  readonly NATIVE_GAS_DROPOFF_SUPPORTED: boolean = false;
  readonly AUTOMATIC_DEPOSIT: boolean = false;
  readonly TYPE: Route = Route.NttManual;
}
