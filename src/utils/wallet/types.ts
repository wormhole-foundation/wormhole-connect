import type { amount } from '@wormhole-foundation/sdk';

export type Balance = {
  lastUpdated: number;
  balance: amount.Amount | null;
};

export type Balances = { [key: string]: Balance };
