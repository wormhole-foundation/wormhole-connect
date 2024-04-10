import * as sdk from '@wormhole-foundation/sdk';
import * as old from '@wormhole-foundation/wormhole-connect-sdk';
import * as utils from 'utils/sdk';

export const converters = {
  toChain(chain: old.ChainName | old.ChainId): sdk.Chain {
    return sdk.toChain(utils.toChainId(chain));
  },
  fromChain(chain: sdk.Chain): old.ChainId {
    return sdk.toChainId(chain) as old.ChainId;
  },
};
