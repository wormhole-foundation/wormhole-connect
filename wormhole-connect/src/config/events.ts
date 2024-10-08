import { CONNECT_VERSION, CONNECT_GIT_HASH } from './constants';
import {
  WormholeConnectEventCore,
  WormholeConnectEventHandler,
  WormholeConnectEvent,
  TriggerEventHandler,
} from 'telemetry/types';

export function wrapEventHandler(
  integrationHandler?: WormholeConnectEventHandler,
): TriggerEventHandler {
  return function (event: WormholeConnectEventCore) {
    const eventWithMeta: WormholeConnectEvent = {
      meta: {
        version: CONNECT_VERSION,
        hash: CONNECT_GIT_HASH,
        host: window?.location?.host,
      },
      ...event,
    };

    console.info('Wormhole Connect event:', eventWithMeta);
    if (integrationHandler) {
      try {
        integrationHandler(eventWithMeta);
      } catch (e) {
        console.error('Error handling event:', e);
      }
    }
  };
}
