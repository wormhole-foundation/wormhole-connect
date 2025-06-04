import { CONNECT_VERSION, CONNECT_GIT_HASH } from './constants';
import {
  WormholeConnectEventCore,
  WormholeConnectEventHandler,
  WormholeConnectEvent,
  TriggerEventHandler,
} from 'telemetry/types';
import { recordChainUsage } from 'utils/chainUsage';

export function wrapEventHandler(
  integrationHandler?: WormholeConnectEventHandler,
): TriggerEventHandler {
  const host =
    typeof window === 'undefined' ? undefined : window.location?.host;

  return function (event: WormholeConnectEventCore) {
    if (event.type === 'transfer.initiate') {
      try {
        recordChainUsage(event.details.fromChain);
      } catch (e) {
        console.debug('Failed to record chain usage', e);
      }
    }

    const eventWithMeta: WormholeConnectEvent = {
      meta: {
        version: CONNECT_VERSION,
        hash: CONNECT_GIT_HASH,
        host,
      },
      ...event,
    };

    console.debug('Wormhole Connect event:', eventWithMeta);
    if (integrationHandler) {
      try {
        integrationHandler(eventWithMeta);
      } catch (e) {
        console.error('Error handling event:', e);
      }
    }
  };
}
