/* eslint-disable @typescript-eslint/naming-convention */
import {
  QueryDenomAuthorityMetadataResponse,
  QueryDenomsFromCreatorResponse,
  QueryParamsResponse,
  QueryClientImpl as TokenFactoryQuery,
} from '../types/osmosis/tokenfactory/v1beta1/query';

import { createProtobufRpcClient, QueryClient } from '@cosmjs/stargate';

export interface TokenFactoryExtension {
  readonly tokenfactory: {
    readonly params: () => Promise<QueryParamsResponse>;
    denomAuthorityMetadata: (
      denom: string,
    ) => Promise<QueryDenomAuthorityMetadataResponse>;
    denomsFromCreator: (
      creator: string,
    ) => Promise<QueryDenomsFromCreatorResponse>;
  };
}

export function setupTokenFactoryExtension(
  base: QueryClient,
): TokenFactoryExtension {
  const rpc = createProtobufRpcClient(base);
  // Use these services to get easy typed access to query methods
  // These cannot be used for proof verification
  const query = new TokenFactoryQuery(rpc);

  return {
    tokenfactory: {
      params: async () => query.Params({}),
      denomAuthorityMetadata: async (denom: string) =>
        query.DenomAuthorityMetadata({
          denom,
        }),
      denomsFromCreator: async (creator: string) =>
        query.DenomsFromCreator({
          creator,
        }),
    },
  };
}
