import { Route } from 'config/types';
import { NTTBase } from './nttBase';

export class NTTManual extends NTTBase {
  readonly NATIVE_GAS_DROPOFF_SUPPORTED: boolean = false;
  readonly AUTOMATIC_DEPOSIT: boolean = false;
  readonly TYPE: Route = Route.NTTManual;
}
