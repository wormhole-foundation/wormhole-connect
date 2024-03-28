import {
  WormholeConnectEvent,
  WormholeConnectEventHandler,
} from 'events/types';

export function wrapEventHandler(
  integrationHandler?: WormholeConnectEventHandler,
): WormholeConnectEventHandler {
  return function (event: WormholeConnectEvent) {
    console.info('Wormhole Connect event:', event);
    if (integrationHandler) integrationHandler(event);
  };
}
