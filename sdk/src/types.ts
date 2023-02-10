import { Network as Environment } from '@certusone/wormhole-sdk';
import { EthContext } from 'contexts/ethContext';
import { SolanaContext } from 'contexts/solanaContext';
import { BigNumber } from 'ethers';
import { WormholeContext } from 'wormhole';
import { MainnetChainName, MainnetChainId } from './config/MAINNET';
import { TestnetChainName, TestnetChainId } from './config/TESTNET';

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
  OTHER = 'OTHER',
}

export type Rpcs = {
  [chain in ChainName]?: string;
};

export type Contracts = {
  core?: string;
  token_bridge?: string;
  nft_bridge?: string;
  relayer?: string;
};

export type ChainConfig = {
  key: ChainName;
  id: ChainId;
  context: Context;
  contracts: Contracts;
  displayName: string;
  explorerUrl: string;
  explorerName: string;
  gasToken: string;
  chainId: number;
};

export type WormholeConfig = {
  env: Environment;
  rpcs: Rpcs;
  chains: {
    [chain in ChainName]?: ChainConfig;
  };
};

export type Address = string;

export type TokenId = {
  chain: ChainName;
  address: string;
};

export type AnyContext = (
  | EthContext<WormholeContext>
  | SolanaContext<WormholeContext>
)

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
  sequence: BigNumber;
  payload?: string;
}

export interface ParsedRelayerMessage extends ParsedMessage {
  relayerPayloadId: number;
  to: string;
  relayerFee: BigNumber;
  toNativeTokenAmount: BigNumber;
}

export type AnyMessage = ParsedMessage | ParsedRelayerMessage;
