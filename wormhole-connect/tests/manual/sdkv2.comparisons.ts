import * as legacy from '@wormhole-foundation/wormhole-connect-sdk';
import { Network as NetworkV1 } from 'config/types';

import { describe, expect, test } from 'vitest';

import RouteAbstract from 'routes/abstracts/routeAbstract';
import { BridgeRoute } from 'routes/bridge';
import { RelayRoute } from 'routes/relay';
import { CCTPRelayRoute } from 'routes/cctpRelay';
import { CCTPManualRoute } from 'routes/cctpManual';

import SDKv2Route from 'routes/sdkv2';
import { routes } from '@wormhole-foundation/sdk';

// This test file is not run automatically in CI or by `npm test`
// because it makes heavy use of RPC calls and this can cause rate limits
// to be hit very quickly.
//
// Maybe we should figure out how to slow it down or get higher rate limits.

const routeMappings: [RouteAbstract, routes.RouteConstructor][] = [
  [BridgeRoute, routes.TokenBridgeRoute],
  [RelayRoute, routes.AutomaticTokenBridgeRoute],
  [CCTPRelayRoute, routes.AutomaticCCTPRoute],
  [CCTPManualRoute, routes.CCTPRoute],
];

describe('compare isRouteSupported between v1 and v2 routes', () => {
  type testCase = [
    network: NetworkV1,
    sourceToken: string,
    destToken: string,
    fromChain: legacy.ChainName | legacy.ChainId,
    toChain: legacy.ChainName | legacy.ChainId,
  ];

  const compareCases: testCase[] = [
    // Token bridge
    ['mainnet', 'DAI', 'DAI', 'ethereum', 'polygon'],
    ['mainnet', 'SOL', 'WSOL', 'solana', 'ethereum'],
    ['mainnet', 'ETH', 'WETH', 'ethereum', 'avalanche'],
    ['mainnet', 'ETH', 'SOL', 'ethereum', 'solana'],
    ['mainnet', 'ETH', 'SOL', 'ethereum', 'solana'],
    ['mainnet', 'BNB', 'WBNB', 'bsc', 'polygon'],
    ['mainnet', 'FTM', 'WFTM', 'fantom', 'polygon'],
    ['mainnet', 'CELO', 'CELO', 'celo', 'polygon'],
    // CCTP
    ['mainnet', 'USDCeth', 'USDCsol', 'ethereum', 'solana'],
  ];

  for (let [
    network,
    sourceToken,
    destToken,
    fromChain,
    toChain,
  ] of compareCases) {
    for (let [RouteV1, RouteV2] of routeMappings) {
      test(`${RouteV1.name} (v1) vs. ${RouteV2.meta.name} (v2) - ${network} (${fromChain} ${sourceToken}) -> (${toChain} ${destToken})`, async () => {
        const v1Route = new RouteV1();
        const v2Route = new SDKv2Route(network, RouteV2);

        const isSupportedV1 = await v1Route.isRouteSupported(
          sourceToken,
          destToken,
          '20',
          fromChain,
          toChain,
        );

        const isSupportedV2 = await v2Route.isRouteSupported(
          sourceToken,
          destToken,
          '20', // Amount doesn't matter for this function
          fromChain,
          toChain,
        );

        expect(isSupportedV1).toEqual(isSupportedV2);
      });
    }
  }
});

describe('isRouteSupported v2 expected values', () => {
  interface testCase {
    network: NetworkV1;
    sourceToken: string;
    destToken: string;
    fromChain: legacy.ChainName | legacy.ChainId;
    toChain: legacy.ChainName | legacy.ChainId;
    routes: routes.RouteConstructor[];
    shouldBeSupported: boolean;
  }

  const cases: testCase[] = [
    // Token bridge ^_^
    {
      network: 'mainnet',
      sourceToken: 'DAI',
      destToken: 'DAI',
      fromChain: 'ethereum',
      toChain: 'polygon',
      routes: [routes.TokenBridgeRoute, routes.AutomaticTokenBridgeRoute],
      shouldBeSupported: true,
    },
    {
      network: 'mainnet',
      sourceToken: 'SOL',
      destToken: 'WSOL',
      fromChain: 'solana',
      toChain: 'ethereum',
      routes: [routes.TokenBridgeRoute, routes.AutomaticTokenBridgeRoute],
      shouldBeSupported: true,
    },
    {
      network: 'mainnet',
      sourceToken: 'SOL',
      destToken: 'ETH',
      fromChain: 'solana',
      toChain: 'ethereum',
      routes: [routes.TokenBridgeRoute, routes.AutomaticTokenBridgeRoute],
      shouldBeSupported: false,
    },

    // CCTP ^0^
    {
      network: 'mainnet',
      sourceToken: 'USDCeth',
      destToken: 'USDCsol',
      fromChain: 'ethereum',
      toChain: 'solana',
      routes: [routes.CCTPRoute],
      shouldBeSupported: true,
    },
    {
      network: 'mainnet',
      sourceToken: 'USDCsol',
      destToken: 'USDCeth',
      fromChain: 'solana',
      toChain: 'ethereum',
      routes: [routes.CCTPRoute],
      shouldBeSupported: true,
    },

    // ETH Bridge n_n
    {
      network: 'mainnet',
      sourceToken: 'WETH',
      destToken: 'WETHpolygon',
      fromChain: 'ethereum',
      toChain: 'polygon',
      routes: [routes.AutomaticPorticoRoute],
      shouldBeSupported: true,
    },
  ];

  for (let tc of cases) {
    for (let route of tc.routes) {
      test(`isSupported ${route.meta.name} ${tc.network} (${tc.fromChain} ${tc.sourceToken}) -> (${tc.toChain} ${tc.destToken}) = ${tc.shouldBeSupported}`, async () => {
        const sdkv2Route = new SDKv2Route(tc.network, route);

        const isSupported = await sdkv2Route.isRouteSupported(
          tc.sourceToken,
          tc.destToken,
          '1', // Amount doesn't matter for this function
          tc.fromChain,
          tc.toChain,
        );

        expect(isSupported).toEqual(tc.shouldBeSupported);
      });
    }
  }
});
