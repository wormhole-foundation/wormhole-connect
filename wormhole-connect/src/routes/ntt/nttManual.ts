import { Route } from 'config/types';
import { NttBase } from './nttBase';
import { ChainId, ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import {
  REASON_MANUAL_ADDRESS_NOT_SUPPORTED,
  RouteAvailability,
} from 'routes/abstracts';

export class NttManual extends NttBase {
  readonly NATIVE_GAS_DROPOFF_SUPPORTED: boolean = false;
  readonly AUTOMATIC_DEPOSIT: boolean = false;
  readonly TYPE: Route = Route.NttManual;

  async isRouteAvailable(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    manualAddress?: boolean,
  ): Promise<RouteAvailability> {
    // this route is not available if the target addres is manual
    if (manualAddress)
      return {
        isAvailable: false,
        reason: REASON_MANUAL_ADDRESS_NOT_SUPPORTED,
      };
    return { isAvailable: true };
  }
}
