import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Chain, amount } from '@wormhole-foundation/sdk';

export type Balance = {
  amount: amount.Amount;
};

export type Balances = {
  tokens: Record<string, Balance>;
  lastUpdated: Date;
};

export type Wallet = string;

type ChainBalances = Partial<Record<Chain, Record<Wallet, Balances>>>;

export interface BalancesState {
  balances: ChainBalances;
}

function getInitialState(): BalancesState {
  return {
    balances: {},
  };
}

export const transferInputSlice = createSlice({
  name: 'balances',
  initialState: getInitialState(),
  reducers: {
    setBalances: (
      state: BalancesState,
      {
        payload: { chain, wallet, balances },
      }: PayloadAction<{
        chain: Chain;
        wallet: Wallet;
        balances: Balances;
      }>,
    ) => {
      if (state.balances[chain] === undefined) {
        state.balances[chain] = {};
      }
      state.balances[chain]![wallet] = balances;
    },
  },
});
