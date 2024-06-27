import { configureStore } from '@reduxjs/toolkit';
import redeemReducer from './redeem';
import transferInputReducer from './transferInput';
import relayReducer from './relay';
import routerReducer from './router';
import walletReducer from './wallet';
import porticoBridgeReducer from './porticoBridge';
import tokenPricesReducer from './tokenPrices';

export const store = configureStore({
  reducer: {
    redeem: redeemReducer,
    transferInput: transferInputReducer,
    router: routerReducer,
    wallet: walletReducer,
    relay: relayReducer,
    porticoBridge: porticoBridgeReducer,
    tokenPrices: tokenPricesReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
