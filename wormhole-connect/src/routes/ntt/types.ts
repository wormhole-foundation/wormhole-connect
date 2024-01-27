export interface EndpointMessage {
  sourceManagerAddress: Buffer;
  managerPayload: Buffer;
}

export interface ManagerMessage {
  sequence: bigint;
  sender: Buffer;
  payload: Buffer;
}

export interface NativeTokenTransferMessage {
  decimals: number;
  amount: bigint;
  sourceToken: Buffer;
  to: Buffer;
  toChain: number;
}

export type InboundQueuedTransfer = {
  recipient: string;
  amount: string;
  txTimestamp: number;
  rateLimitExpiryTimestamp: number;
};
