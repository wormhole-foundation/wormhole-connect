import * as legacy from '@wormhole-foundation/wormhole-connect-sdk';
import {
  Network as NetworkV1,
  TokenConfig as TokenConfigConnect,
} from 'config/types';

import { getDefaultWormholeContext } from 'config';

import * as v2 from '@wormhole-foundation/sdk';

import { SDKConverter } from '../src/config/converter';

import { describe, expect, test } from 'vitest';

import MAINNET from 'config/mainnet';
import TESTNET from 'config/testnet';

import RouteAbstract from 'routes/abstracts/routeAbstract';
import { BridgeRoute } from 'routes/bridge';
import { CCTPRelayRoute } from 'routes/cctpRelay';
import { CCTPManualRoute } from 'routes/cctpManual';

import SDKv2Route from 'routes/sdkv2';
import { routes } from '@wormhole-foundation/sdk';

function getConverter(network: NetworkV1): SDKConverter {
  const wh = getDefaultWormholeContext(network);
  const networkData = { MAINNET, TESTNET }[network.toUpperCase()]!;
  return new SDKConverter(wh, networkData.chains, networkData.tokens);
}

const routeMappings: [routes.RouteConstructor, RouteAbstract][] = [
  [BridgeRoute, routes.TokenBridgeRoute],
  [CCTPRelayRoute, routes.AutomaticCCTPRoute],
  [CCTPManualRoute, routes.CCTPRoute],
];

describe('chain', () => {
  interface testCase {
    v1: legacy.ChainId;
    v1Name: legacy.ChainName;
    v2: v2.Chain;
  }

  const converter = getConverter('mainnet');

  const casesMainnet: testCase[] = [
    // Mainnet
    { v1: 2, v1Name: 'ethereum', v2: 'Ethereum' },
    { v1: 5, v1Name: 'polygon', v2: 'Polygon' },
    { v1: 1, v1Name: 'solana', v2: 'Solana' },
    { v1: 30, v1Name: 'base', v2: 'Base' },
    // Testnet
    //{ v1: 10002, v1Name: 'sepolia', v2: 'Sepolia' },
  ];

  for (let c of casesMainnet) {
    test(`${c.v1} <-> ${c.v2} (mainnet)`, () => {
      // Ensure we can convert both chain names and IDs into v2 chains
      expect(converter.toChainV2(c.v1)).toEqual(c.v2);
      expect(converter.toChainV2(c.v1Name)).toEqual(c.v2);

      // Ensure we can convert v2 chains into both v1 chain names and IDs
      expect(converter.toChainIdV1(c.v2)).toEqual(c.v1);
      expect(converter.toChainNameV1(c.v2)).toEqual(c.v1Name);
    });
  }

  const converterTestnet = getConverter('testnet');

  const casesTestnet: testCase[] = [
    { v1: 10002, v1Name: 'sepolia', v2: 'Sepolia' },
    { v1: 10, v1Name: 'fantom', v2: 'Fantom' },
    { v1: 4, v1Name: 'bsc', v2: 'Bsc' },
    { v1: 1, v1Name: 'solana', v2: 'Solana' },
  ];

  for (let c of casesTestnet) {
    test(`${c.v1} <-> ${c.v2} (testnet)`, () => {
      // Ensure we can convert both chain names and IDs into v2 chains
      expect(converterTestnet.toChainV2(c.v1)).toEqual(c.v2);
      expect(converterTestnet.toChainV2(c.v1Name)).toEqual(c.v2);

      // Ensure we can convert v2 chains into both v1 chain names and IDs
      expect(converterTestnet.toChainIdV1(c.v2)).toEqual(c.v1);
      expect(converterTestnet.toChainNameV1(c.v2)).toEqual(c.v1Name);
    });
  }
});

describe('network', () => {
  interface testCase {
    v1: NetworkV1;
    v2: v2.Network;
  }

  const cases: testCase[] = [
    {
      v1: 'mainnet',
      v2: 'Mainnet',
    },
    {
      v1: 'testnet',
      v2: 'Testnet',
    },
    {
      v1: 'devnet',
      v2: 'Devnet',
    },
  ];

  const converter = getConverter('mainnet');

  for (let c of cases) {
    test(`${c.v1} <-> ${c.v2}`, () => {
      expect(converter.toNetworkV2(c.v1)).toEqual(c.v2);
      expect(converter.toNetworkV1(c.v2)).toEqual(c.v1);
    });
  }
});

describe('token', () => {
  interface testCase {
    v1: TokenConfigConnect;
    v2: v2.TokenId;
  }

  // Mainnet

  const cases: testCase[] = [
    {
      v1: MAINNET.tokens.ETH,
      v2: {
        chain: 'Ethereum',
        address: 'native',
      },
    },
    {
      v1: MAINNET.tokens.USDCeth,
      v2: v2.Wormhole.tokenId(
        'Ethereum',
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      ),
    },
    {
      v1: MAINNET.tokens.SOL,
      v2: v2.Wormhole.tokenId('Solana', 'native'),
    },
    {
      v1: MAINNET.tokens.INJ,
      v2: v2.Wormhole.tokenId('Injective', 'inj'),
    },
  ];

  const converter = getConverter('mainnet');

  for (let c of cases) {
    test(`${c.v1} <-> ${c.v2} (mainnet)`, () => {
      expect(converter.toTokenIdV2(c.v1)).toEqual(c.v2);
      expect(converter.findTokenConfigV1(c.v2)).toEqual(c.v1);
    });
  }

  // Testnet

  const casesTestnet: testCase[] = [
    {
      v1: TESTNET.tokens.ETH,
      v2: {
        chain: 'Ethereum',
        address: 'native',
      },
    },
    {
      v1: TESTNET.tokens.USDCeth,
      v2: v2.Wormhole.tokenId(
        'Ethereum',
        '0x07865c6E87B9F70255377e024ace6630C1Eaa37F',
      ),
    },
    {
      v1: TESTNET.tokens.SOL,
      v2: v2.Wormhole.tokenId('Solana', 'native'),
    },
    {
      v1: TESTNET.tokens.INJ,
      v2: v2.Wormhole.tokenId('Injective', 'inj'),
    },
  ];

  const converterTestnet = getConverter('testnet');

  for (let c of casesTestnet) {
    test(`${c.v1} <-> ${c.v2} (testnet)`, () => {
      expect(converterTestnet.toTokenIdV2(c.v1)).toEqual(c.v2);
      expect(converterTestnet.findTokenConfigV1(c.v2)).toEqual(c.v1);
    });
  }
});

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
