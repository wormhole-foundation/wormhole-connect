import * as legacy from '@wormhole-foundation/wormhole-connect-sdk';
import { Network as NetworkV1 } from 'config/types';
import { getDefaultWormholeContext } from 'config';

import * as v2 from '@wormhole-foundation/sdk';

import { SDKConverter } from '../src/config/converter';

import { describe, expect, test } from 'vitest';

function getConverter(network: NetworkConnect): SDKConverter {
  const wh = getDefaultWormholeContext(network);
  return new SDKConverter(wh);
}

describe('chain', () => {
  interface testCase {
    v1: legacy.ChainId;
    v1Name: legacy.ChainName;
    v2: v2.Chain;
  }

  const converter = getConverter('mainnet');

  const cases: testCase[] = [
    // Mainnet
    { v1: 2, v1Name: 'ethereum', v2: 'Ethereum' },
    { v1: 5, v1Name: 'polygon', v2: 'Polygon' },
    { v1: 1, v1Name: 'solana', v2: 'Solana' },
    { v1: 30, v1Name: 'base', v2: 'Base' },
    // Testnet
    //{ v1: 10002, v1Name: 'sepolia', v2: 'Sepolia' },
  ];

  for (let c of cases) {
    test(`${c.v1} <-> ${c.v2}`, () => {
      expect(converter.toChainV2(c.v1)).toEqual(c.v2);
      expect(converter.toChainV2(c.v1Name)).toEqual(c.v2);

      expect(converter.toChainIdV1(c.v2)).toEqual(c.v1);
      expect(converter.toChainNameV1(c.v2)).toEqual(c.v1Name);
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
