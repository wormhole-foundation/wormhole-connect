import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { IbcExtension, QueryClient, setupIbcExtension } from '@cosmjs/stargate';
import { ChainId, ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import {
  Tendermint34Client,
  Tendermint37Client,
  TendermintClient,
} from '@cosmjs/tendermint-rpc';
import { wh } from 'utils/sdk';
import { RPCS } from 'config';

const CLIENT_MAP: Record<string, TendermintClient> = {};

export async function getQueryClient(
  chain: ChainId | ChainName,
): Promise<QueryClient & IbcExtension> {
  const tmClient = await getTmClient(chain);
  return QueryClient.withExtensions(tmClient, setupIbcExtension);
}

export async function getTmClient(
  chain: ChainId | ChainName,
): Promise<Tendermint34Client | Tendermint37Client> {
  const name = wh.toChainName(chain);
  if (CLIENT_MAP[name]) {
    return CLIENT_MAP[name];
  }

  const rpc = RPCS[wh.toChainName(chain)];
  if (!rpc) throw new Error(`${chain} RPC not configured`);

  // from cosmjs: https://github.com/cosmos/cosmjs/blob/358260bff71c9d3e7ad6644fcf64dc00325cdfb9/packages/stargate/src/stargateclient.ts#L218
  let tmClient: TendermintClient;
  const tm37Client = await Tendermint37Client.connect(rpc);
  const version = (await tm37Client.status()).nodeInfo.version;
  if (version.startsWith('0.37.')) {
    tmClient = tm37Client;
  } else {
    tm37Client.disconnect();
    tmClient = await Tendermint34Client.connect(rpc);
  }

  CLIENT_MAP[name] = tmClient;

  return tmClient;
}

export async function getCosmWasmClient(
  chain: ChainId | ChainName,
): Promise<CosmWasmClient> {
  const tmClient = await getTmClient(chain);
  return CosmWasmClient.create(tmClient);
}
