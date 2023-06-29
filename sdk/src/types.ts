import {
  Network as Environment,
  ParsedVaa,
  SignedVaa,
} from '@certusone/wormhole-sdk';
import { BigNumber } from 'ethers';
import { MainnetChainId, MainnetChainName } from './config/MAINNET';
import { TestnetChainId, TestnetChainName } from './config/TESTNET';
import { AptosContext } from './contexts/aptos';
import { AptosContracts } from './contexts/aptos/contracts';
import { EthContext } from './contexts/eth';
import { EthContracts } from './contexts/eth/contracts';
import { SolanaContext } from './contexts/solana';
import { SolContracts } from './contexts/solana/contracts';
import { SuiContext } from './contexts/sui';
import { SuiContracts } from './contexts/sui/contracts';
import { WormholeContext } from './wormhole';
import { SeiContracts } from './contexts/sei/contracts';
import { SeiContext } from './contexts/sei';

export const NATIVE = 'native';
// TODO: conditionally set these types
export type ChainName = MainnetChainName | TestnetChainName;
export type ChainId = MainnetChainId | TestnetChainId;
export enum Context {
  ETH = 'Ethereum',
  TERRA = 'Terra',
  INJECTIVE = 'Injective',
  XPLA = 'XPLA',
  SOLANA = 'Solana',
  ALGORAND = 'Algorand',
  NEAR = 'Near',
  APTOS = 'Aptos',
  SUI = 'Sui',
  SEI = 'Sei',
  OTHER = 'OTHER',
}

export type ChainResourceMap = {
  [chain in ChainName]?: string;
};

export type Contracts = {
  core?: string;
  token_bridge?: string;
  nft_bridge?: string;
  relayer?: string;
  suiOriginalTokenBridgePackageId?: string;
  suiRelayerPackageId?: string;
  seiTokenTranslator?: string;
};

export type ChainConfig = {
  key: ChainName;
  id: ChainId;
  context: Context;
  contracts: Contracts;
  finalityThreshold: number;
  nativeTokenDecimals: number;
};

export type WormholeConfig = {
  env: Environment;
  rpcs: ChainResourceMap;
  rest: ChainResourceMap;
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

export type AnyContext =
  | EthContext<WormholeContext>
  | SolanaContext<WormholeContext>
  | SuiContext<WormholeContext>
  | AptosContext<WormholeContext>
  | SeiContext<WormholeContext>;

export type AnyContracts =
  | EthContracts<WormholeContext>
  | SolContracts<WormholeContext>
  | SuiContracts<WormholeContext>
  | AptosContracts<WormholeContext>
  | SeiContracts<WormholeContext>;

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
  sequence: BigNumber;
  emitterAddress: string;
  block: number;
  gasFee?: BigNumber;
  payload?: string;
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

export type SendResult = Awaited<ReturnType<AnyContext['send']>>;
export type RedeemResult = Awaited<ReturnType<AnyContext['redeem']>>;

export interface VaaInfo<T> {
  transaction: T;
  rawVaa: SignedVaa;
  vaa: ParsedVaa;
}
