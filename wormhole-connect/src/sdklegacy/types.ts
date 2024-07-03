import { BigNumber } from 'ethers5';
import { MainnetChainId, MainnetChainName } from './config/MAINNET';
import { TestnetChainId, TestnetChainName } from './config/TESTNET';
import { DevnetChainId, DevnetChainName } from './config/DEVNET';

export type Network = 'mainnet' | 'testnet' | 'devnet';

export const NATIVE = 'native';
// TODO: conditionally set these types
export type ChainName = MainnetChainName | TestnetChainName | DevnetChainName;
export type ChainId = MainnetChainId | TestnetChainId | DevnetChainId;
export enum Context {
  ETH = 'Ethereum',
  TERRA = 'Terra',
  XPLA = 'XPLA',
  SOLANA = 'Solana',
  ALGORAND = 'Algorand',
  NEAR = 'Near',
  APTOS = 'Aptos',
  SUI = 'Sui',
  SEI = 'Sei',
  COSMOS = 'Cosmos',
  OTHER = 'OTHER',
}

export type ChainResourceMap = {
  [chain in ChainName]?: string;
};

/*
 * TODO SDKV2
export type Contracts = {
  core?: string;
  token_bridge?: string;
  nft_bridge?: string;
  relayer?: string;
  cctpContracts?: {
    cctpTokenMessenger: string;
    cctpMessageTransmitter: string;
    wormholeCCTP?: string;
    wormholeCircleRelayer?: string;
  };
  suiOriginalTokenBridgePackageId?: string;
  suiRelayerPackageId?: string;
  seiTokenTranslator?: string;
  ibcShimContract?: string;
  tbtcGateway?: string;
  portico?: string;
  uniswapQuoterV2?: string;
};
*/

export type ChainConfig = {
  key: ChainName;
  id: ChainId;
  context: Context;
  //contracts: Contracts;
  finalityThreshold: number;
  nativeTokenDecimals: number;
  cctpDomain?: number;
  disabledAsSource?: boolean;
  disabledAsDestination?: boolean;
};

export type WormholeConfig = {
  env: Network;
  rpcs: ChainResourceMap;
  rest: ChainResourceMap;
  graphql: ChainResourceMap;
  wormholeHosts: string[];
  chains: {
    [chain in ChainName]?: ChainConfig;
  };
};

export type Address = string;

export type TokenId = {
  chain: ChainName;
  address: string;
};

export type AnyContext = any;

export type AnyContracts = any;

export interface ParsedMessage {
  sendTx: string;
  sender: string;
  amount: BigNumber;
  payloadID: number;
  recipient: string;
  toChain: ChainName;
  fromChain: ChainName;
  tokenAddress: string;
  tokenChain: ChainName;
  tokenId: TokenId;
  sequence?: BigNumber;
  emitterAddress?: string;
  block: number;
  gasFee?: BigNumber;
  payload?: string;
  fromAddress?: string;
}

export interface ParsedRelayerPayload {
  relayerPayloadId: number;
  to: string;
  relayerFee: BigNumber;
  toNativeTokenAmount: BigNumber;
}

export type ParsedRelayerMessage = ParsedMessage & ParsedRelayerPayload;

export type AnyMessage = ParsedMessage | ParsedRelayerMessage;

export type TokenDetails = {
  symbol: string;
  decimals: number;
};
