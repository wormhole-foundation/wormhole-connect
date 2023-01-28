import { configureStore } from '@reduxjs/toolkit';
import redeemReducer from './redeem';
import transferReducer from './transfer';
import routerReducer from './router';
import walletReducer from './wallet';

export const store = configureStore({
  reducer: {
    redeem: redeemReducer,
    transfer: transferReducer,
    router: routerReducer,
    wallet: walletReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
