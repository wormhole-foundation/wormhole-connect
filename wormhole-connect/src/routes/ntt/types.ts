export type InboundQueuedTransfer = {
  recipient: string;
  amount: string;
  rateLimitExpiryTimestamp: number;
};
