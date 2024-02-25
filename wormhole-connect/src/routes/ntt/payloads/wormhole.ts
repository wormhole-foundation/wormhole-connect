import { TransceiverMessage } from './common';

export class WormholeTransceiverMessage<A> extends TransceiverMessage<A> {
  static prefix = Buffer.from([0x99, 0x45, 0xff, 0x10]);
}
