import { configureStore } from '@reduxjs/toolkit';
import redeemReducer from './redeem';
import transferInputReducer from './transferInput';
import relayReducer from './relay';
import routerReducer from './router';
import walletReducer from './wallet';
import searchReducer from './search';
import {
  externalWalletMiddleware,
  initializeExternalWalletSync,
} from './middleware/externalWallet';

export const store = configureStore({
  reducer: {
    redeem: redeemReducer,
    transferInput: transferInputReducer,
    router: routerReducer,
    wallet: walletReducer,
    relay: relayReducer,
    search: searchReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(externalWalletMiddleware),
});

// Initialize external wallet synchronization
initializeExternalWalletSync(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
