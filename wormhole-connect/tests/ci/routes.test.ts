import { ChainId, ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import RouteAbstract from 'routes/abstracts/routeAbstract';
import { ETHBridge } from 'routes/porticoBridge/ethBridge';

import { describe, expect, test } from 'vitest';

import { setConfig } from 'config';
import { Route } from 'config/types';
import { is } from '@mysten/sui.js';

describe('supported routes', () => {
  interface testCase {
    sourceToken: string;
    destToken: string;
    sourceChain: ChainName | ChainId;
    destChain: ChainName | ChainId;
    route: Route;
  }

  setConfig({ env: 'mainnet' });

  const testCases: testCase[] = [
    // Portico bridge
    {
      sourceToken: 'ETH',
      destToken: 'WETHbsc',
      sourceChain: 'ethereum',
      destChain: 'bsc',
      route: ETHBridge,
    },
    {
      sourceToken: 'ETH',
      destToken: 'WETHpolygon',
      sourceChain: 'ethereum',
      destChain: 'polygon',
      route: ETHBridge,
    },
  ];

  for (let tc of testCases) {
    test(`${tc.route} ${tc.sourceChain}:${tc.sourceToken} -> ${tc.destChain}${tc.destToken}`, async () => {
      const r = new tc.route();

      const isSupported = await r.isRouteSupported(
        tc.sourceToken,
        tc.destToken,
        '1.0',
        tc.sourceChain,
        tc.destChain,
      );

      expect(isSupported).toBeTruthy();
    });
  }
});
