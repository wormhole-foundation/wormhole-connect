import { ChainId, ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { describe, expect, test } from 'vitest';
import { setConfig } from 'config';
import { Route, WormholeConnectConfig } from 'config/types';
import { getRouteImpls } from 'routes/mappings';

describe('supported routes', () => {
  type testCase = [
    sourceToken: string,
    destToken: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    route: Route[],
  ];

  setConfig({ env: 'mainnet' });

  const testCases: testCase[] = [
    // Token bridge
    ['ETH', 'WETH', 'ethereum', 'bsc', [Route.Bridge, Route.Relay]],
    ['DAI', 'DAI', 'ethereum', 'polygon', [Route.Bridge, Route.Relay]],
    ['WSOL', 'WSOL', 'solana', 'ethereum', [Route.Bridge, Route.Relay]],
    ['WSOL', 'WSOL', 'ethereum', 'solana', [Route.Bridge, Route.Relay]],
    ['ETH', 'WETH', 'ethereum', 'avalanche', [Route.Bridge, Route.Relay]],
    ['BNB', 'WBNB', 'bsc', 'polygon', [Route.Bridge, Route.Relay]],
    ['FTM', 'WFTM', 'fantom', 'polygon', [Route.Bridge, Route.Relay]],
    ['CELO', 'CELO', 'celo', 'polygon', [Route.Bridge, Route.Relay]],
    // ETH bridge
    ['ETH', 'WETHbsc', 'ethereum', 'bsc', [Route.ETHBridge]],
    ['ETH', 'WETHpolygon', 'ethereum', 'polygon', [Route.ETHBridge]],
    ['WETHarbitrum', 'WETHpolygon', 'arbitrum', 'polygon', [Route.ETHBridge]],
    ['WETHpolygon', 'WETHarbitrum', 'polygon', 'arbitrum', [Route.ETHBridge]],
    // wstETHBridge
    ['wstETH', 'wstETHpolygon', 'ethereum', 'polygon', [Route.wstETHBridge]],
    ['wstETH', 'wstETHarbitrum', 'ethereum', 'arbitrum', [Route.wstETHBridge]],
    // NTT
    [
      'USDCeth',
      'USDCfantom',
      'ethereum',
      'fantom',
      [Route.NttManual, Route.NttRelay],
    ],
    // CCTP
    [
      'USDCeth',
      'USDCarbitrum',
      'ethereum',
      'arbitrum',
      [Route.CCTPManual, Route.CCTPRelay],
    ],
    [
      'USDCarbitrum',
      'USDCpolygon',
      'arbitrum',
      'polygon',
      [Route.CCTPManual, Route.CCTPRelay],
    ],
    ['USDCeth', 'USDCsol', 'ethereum', 'solana', [Route.CCTPManual]],
    ['USDCavax', 'USDCsol', 'avalanche', 'solana', [Route.CCTPManual]],
    // TBTC
    ['tBTC', 'tBTCpolygon', 'ethereum', 'polygon', [Route.TBTC]],
    ['tBTCoptimism', 'tBTC', 'optimism', 'ethereum', [Route.TBTC]],
    ['tBTCpolygon', 'tBTCoptimism', 'polygon', 'optimism', [Route.TBTC]],
    ['tBTCarbitrum', 'tBTCoptimism', 'arbitrum', 'optimism', [Route.TBTC]],
    // Cosmos Gateway
    ['CELO', 'CELO', 'osmosis', 'celo', [Route.CosmosGateway]],
    ['CELO', 'CELO', 'osmosis', 'moonbeam', [Route.CosmosGateway]],
    ['GLMR', 'WGLMR', 'moonbeam', 'kujira', [Route.CosmosGateway]],
  ];

  for (let [
    sourceToken,
    destToken,
    sourceChain,
    destChain,
    routes,
  ] of testCases) {
    for (let route of routes) {
      test(`${route} ${sourceChain}:${sourceToken} -> ${destChain}:${destToken}`, async () => {
        const r = getRouteImpls(route).v1;

        const isSupported = await r.isRouteSupported(
          sourceToken,
          destToken,
          '1.0',
          sourceChain,
          destChain,
        );

        expect(isSupported).toBeTruthy();
      });
    }
  }
});
