import { BN } from '@project-serum/anchor';
import { ParsedGovernanceVaa, parseGovernanceVaa } from './governance';
import {
  parseTokenBridgeRegisterChainGovernancePayload,
  parseTokenBridgeUpgradeContractGovernancePayload,
  TokenBridgeRegisterChain,
  TokenBridgeUpgradeContract,
} from './tokenBridge';
import { ParsedVaa, parseVaa, SignedVaa } from './wormhole';
export enum NftBridgePayload {
  Transfer = 1,
}
export enum NftBridgeGovernanceAction {
  RegisterChain = 1,
  UpgradeContract = 2,
}
export interface NftTransfer {
  payloadType: NftBridgePayload.Transfer;
  tokenAddress: Buffer;
  tokenChain: number;
  symbol: string;
  name: string;
  tokenId: bigint;
  uri: string;
  to: Buffer;
  toChain: number;
}
export interface ParsedNftTransferVaa extends ParsedVaa, NftTransfer {}
export interface NftRegisterChain extends TokenBridgeRegisterChain {}
export interface ParsedNftBridgeRegisterChainVaa
  extends ParsedGovernanceVaa,
    NftRegisterChain {}
export interface NftBridgeUpgradeContract extends TokenBridgeUpgradeContract {}
export interface ParsedNftBridgeUpgradeContractVaa
  extends ParsedGovernanceVaa,
    NftBridgeUpgradeContract {}
