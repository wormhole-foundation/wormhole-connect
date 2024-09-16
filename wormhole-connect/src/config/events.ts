import { CONNECT_VERSION, CONNECT_GIT_HASH } from './constants';
import {
  WormholeConnectEvent,
  WormholeConnectEventHandler,
  WormholeConnectEventWithMeta,
} from 'telemetry/types';

export function wrapEventHandler(
  integrationHandler?: WormholeConnectEventHandler,
): WormholeConnectEventHandler {
  return function (event: WormholeConnectEvent) {
    const eventWithMeta: WormholeConnectEventWithMeta = {
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
