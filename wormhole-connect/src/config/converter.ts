import * as v1 from '@wormhole-foundation/wormhole-connect-sdk';
import { Network as NetworkConnect } from 'config/types';

import * as v2 from '@wormhole-foundation/sdk';

import * as utils from 'utils/sdk';

// SDKConverter provides utility functions for converting core types between SDKv1 and SDKv2
export class SDKConverter {
  wh: v1.WormholeContext;

  constructor(wh: v1.WormholeContext) {
    this.wh = wh;
  }

  toChainIdV1(chain: v2.Chain) {
    return v2.toChainId(chain) as v1.ChainId;
  }

  toChainNameV1(chain: v2.Chain) {
    return this.wh.toChainName(this.toChainIdV1(chain));
  }

  toChainV2(chain: v1.ChainName | v1.ChainId): v2.Chain {
    return v2.toChain(utils.toChainId(chain));
  }

  toNetworkV2(network: NetworkConnect): v2.Network {
    switch (network) {
      case 'mainnet':
        return 'Mainnet';
      case 'testnet':
        return 'Testnet';
      case 'devnet':
        return 'Devnet';
    }
  }

  toNetworkV1(network: v2.Network): NetworkConnect {
    return network.toLowerCase() as NetworkConnect;
  }
}
