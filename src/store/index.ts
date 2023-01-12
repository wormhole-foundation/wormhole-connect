import { configureStore } from "@reduxjs/toolkit";
import attestReducer from "./attest";
import transferReducer from "./transfer";

export const store = configureStore({
  reducer: {
    attest: attestReducer,
    transfer: transferReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;