import { EndpointMessage } from './common';

export class WormholeEndpointMessage<A> extends EndpointMessage<A> {
  static prefix = Buffer.from([0x99, 0x45, 0xff, 0x10]);
}
