# Refactor #2: Redux Store Singleton → Store-Per-Instance

**Status:** Planning
**Priority:** Critical
**Ticket:** (link to ticket)
**Depends On:** Refactor #1 (Config Singleton) - store initialization needs config
**Blocks:** None (can be done in parallel with #3 after #1 is complete)

---

## Problem Statement

The Redux store at `src/store/index.ts:9-18` is exported as a module-level singleton. When multiple `<WormholeConnect>` instances render on the same page, they all share the same store via the single `<Provider store={store}>` wrapper. This means:

- Transfer input state from Widget A appears in Widget B
- Wallet connections are shared globally
- Route selections affect all instances
- Redeem operations interfere with each other

**Current Architecture:**
```typescript
// src/store/index.ts
export const store = configureStore({
  reducer: {
    redeem: redeemReducer,
    transferInput: transferInputReducer,
    router: routerReducer,
    wallet: walletReducer,
    relay: relayReducer,
    search: searchReducer,
  },
});

// src/WormholeConnect.tsx
<Provider store={store}>  // ← Same store for ALL instances
  <ThemeProvider theme={muiTheme}>
    {/* App content */}
  </ThemeProvider>
</Provider>
```

---

## Impact Analysis

### What Breaks with Multiple Instances

| Slice | Current Behavior | Expected Behavior |
|-------|------------------|-------------------|
| `transferInput` | Both widgets show same from/to chains, tokens, amounts | Each widget has independent transfer state |
| `wallet` | Connecting wallet in A shows in B | Each widget tracks its own wallet connections |
| `redeem` | Redeem status shared across widgets | Each widget has independent redeem flow |
| `relay` | Gas dropoff settings shared | Each widget configures gas independently |
| `router` | Navigation affects all widgets | Each widget navigates independently |
| `search` | Search state shared | Each widget has independent search |

### Store Structure Analysis

**Good News:** The store is well-architected for this refactor:

| Factor | Assessment |
|--------|------------|
| Cross-slice dependencies | Only ONE: `transferInput` → `wallet` (helper functions) |
| Async middleware | None (pure Redux Toolkit) |
| Consumer pattern | 100% hooks (`useSelector`, `useDispatch`) |
| Legacy `connect()` HOC | None found |
| Direct store imports | Only ONE: test harness in `WormholeConnect.tsx` |

**Store Statistics:**
- Total `useSelector` calls: 61
- Total `useDispatch` calls: 37
- Files using Redux: 30

---

## Solution Architecture

### Target State

```
<WormholeConnect config={configA}>
    ↓
<StoreProvider>  // Creates new store for this instance
    ↓
    <Provider store={instanceStore}>
        ↓
        useSelector/useDispatch work on instance store
```

### Implementation Approach

**Step 1: Convert store to factory function**

```typescript
// src/store/index.ts

// Before
export const store = configureStore({ ... });
export type RootState = ReturnType<typeof store.getState>;

// After
export function createStore(config?: InternalConfig) {
  return configureStore({
    reducer: {
      redeem: redeemReducer,
      transferInput: createTransferInputSlice(config).reducer,
      router: routerReducer,
      wallet: walletReducer,
      relay: relayReducer,
      search: searchReducer,
    },
  });
}

export type AppStore = ReturnType<typeof createStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
```

**Step 2: Create store in component**

```typescript
// src/WormholeConnect.tsx
import { createStore } from './store';
import { useConfig } from './contexts/ConfigContext';

function WormholeConnectInner() {
  const config = useConfig();

  const store = React.useMemo(
    () => createStore(config),
    [config]
  );

  return (
    <Provider store={store}>
      {/* ... */}
    </Provider>
  );
}
```

**Step 3: Fix transferInput config dependency**

```typescript
// src/store/transferInput.ts

// Before
function getInitialState(): TransferInputState {
  const fromChain = config.ui?.defaultInputs?.fromChain;
  // ...
}

// After
export function createTransferInputSlice(config?: InternalConfig) {
  const initialState = getInitialState(config);

  return createSlice({
    name: 'transferInput',
    initialState,
    reducers: { /* unchanged */ },
  });
}

function getInitialState(config?: InternalConfig): TransferInputState {
  const fromChain = config?.ui?.defaultInputs?.fromChain;
  // ...
}
```

**Step 4: Fix cross-slice helper functions**

```typescript
// src/store/transferInput.ts

// Before
import { clearWallet, setWalletError } from './wallet';

export function selectChain(
  dispatch: AppDispatch,
  chain: Chain,
  type: 'source' | 'dest',
) {
  dispatch(clearWallet(type));
  // ...
}

// After - Move to a utility or keep but use action creators
// No change needed - already accepts dispatch as parameter
// The pattern is already correct for instance-scoped stores
```

---

## Migration Strategy

### Phase 1: Create Store Factory (Non-Breaking)

**Goal:** Add factory function without removing singleton

**Steps:**
1. Create `createStore(config?)` function
2. Keep existing `export const store = createStore()` for backwards compat
3. Update `transferInput` to accept config via factory

**Files to Modify:**
- `src/store/index.ts` - Add factory function
- `src/store/transferInput.ts` - Add `createTransferInputSlice(config)`

**Estimated Effort:** 2-3 hours

### Phase 2: Create Store Per Instance

**Goal:** Each `<WormholeConnect>` creates its own store

**Steps:**
1. Modify `WormholeConnect.tsx` to call `createStore(config)` in useMemo
2. Move `<Provider>` inside the memoized store creation
3. Remove test harness `window.dispatchReduxAction` (or make instance-aware)

**Files to Modify:**
- `src/WormholeConnect.tsx`

**Estimated Effort:** 1-2 hours

### Phase 3: Remove Singleton Export

**Goal:** Remove global store singleton

**Steps:**
1. Remove `export const store = createStore()`
2. Update any remaining direct store imports
3. Update tests to use store factory

**Files to Modify:**
- `src/store/index.ts`
- Any test files using `store` directly

**Estimated Effort:** 2-3 hours

---

## Slice-by-Slice Analysis

### `transferInput` Slice

**State:**
```typescript
{
  showValidationState: boolean;
  validations: TransferValidations;
  fromChain: Chain | undefined;
  toChain: Chain | undefined;
  token: TokenTuple | undefined;
  destToken: TokenTuple | undefined;
  amount?: amount.Amount;
  receiveAmount: DataWrapper<string>;
  route?: string;
  preferredRouteName?: string | undefined;
  foreignAsset: string;
  associatedTokenAddress: string;
  gasEst: { send: string; claim: string };
  isTransactionInProgress: boolean;
  receiverNativeBalance: string | undefined;
}
```

**Config Dependency:** YES - `getInitialState()` reads `config.ui.defaultInputs`

**Actions:** 14 total (all synchronous reducers)

**Cross-slice:** Imports `clearWallet`, `setWalletError` from wallet (used in helper functions, not reducers)

**Refactor Complexity:** MEDIUM - Need to parameterize `getInitialState()`

---

### `wallet` Slice

**State:**
```typescript
{
  sending: WalletData;
  receiving: WalletData;
}
```

**Config Dependency:** NO

**Actions:** 6 total

**Cross-slice:** None (is imported by transferInput)

**Refactor Complexity:** LOW - No changes needed

---

### `redeem` Slice

**State:**
```typescript
{
  txData?: TransferInfo;
  sendTx: string;
  redeemTx: string;
  transferComplete: boolean;
  route?: string;
  isResumeTx: boolean;
  timestamp: number;
}
```

**Config Dependency:** NO

**Actions:** 6 total

**Cross-slice:** None

**Refactor Complexity:** LOW - No changes needed

---

### `relay` Slice

**State:**
```typescript
{
  maxSwapAmt: number | undefined;
  toNativeToken: number;
  receiveNativeAmt: number | undefined;
  relayerFee: RelayerFee | undefined;
  receiverNativeBalance: string | undefined;
}
```

**Config Dependency:** NO

**Actions:** 2 total

**Cross-slice:** None

**Refactor Complexity:** LOW - No changes needed

---

### `router` Slice

**State:**
```typescript
{
  route: Route; // 'bridge' | 'redeem' | 'history' | 'search' | 'terms'
  showFromChainsModal: boolean;
  showToChainsModal: boolean;
  showTokensModal: boolean;
  showWalletModal: TransferWallet | false;
}
```

**Config Dependency:** NO

**Actions:** 1 total (`setRoute`)

**Cross-slice:** None

**Note:** Modal state fields appear unused (no actions defined for them)

**Refactor Complexity:** LOW - No changes needed

---

### `search` Slice

**State:**
```typescript
{
  txHash?: string;
  chain?: Chain;
}
```

**Config Dependency:** NO

**Actions:** 2 total

**Cross-slice:** None

**Refactor Complexity:** LOW - No changes needed

---

## Selector Patterns to Update

All selectors use simple property access patterns that work unchanged with per-instance stores:

```typescript
// These all work with useSelector from the instance-scoped Provider
state.transferInput.fromChain
state.wallet.sending
state.redeem.txData
state.relay.toNativeToken
state.router.route
state.search.txHash
```

**No changes needed to selectors or components using useSelector.**

---

## Test Harness Handling

**Current Code (WormholeConnect.tsx:37-41):**
```typescript
React.useEffect(() => {
  if (!globalThis.dispatchReduxAction) {
    (window as any).dispatchReduxAction = (action: any) => {
      store.dispatch(action);
    };
  }
}, []);
```

**Options:**

1. **Remove entirely:** If E2E tests can access store via React Testing Library patterns
2. **Make instance-aware:**
   ```typescript
   React.useEffect(() => {
     const instanceId = config.cacheNamespace || 'default';
     (window as any).__wormholeConnect = (window as any).__wormholeConnect || {};
     (window as any).__wormholeConnect[instanceId] = {
       dispatch: store.dispatch,
       getState: store.getState,
     };
     return () => {
       delete (window as any).__wormholeConnect[instanceId];
     };
   }, [store, config.cacheNamespace]);
   ```

3. **Use data attribute:**
   ```typescript
   // In component render
   <div data-wormhole-instance={instanceId} ref={containerRef}>

   // Tests can query by attribute and dispatch via custom event
   ```

**Recommendation:** Option 2 for backwards compatibility with existing E2E tests.

---

## API Changes

### Before (Current)

```typescript
// Internal imports
import { store, RootState, AppDispatch } from './store';

// Type usage
const state: RootState = store.getState();
```

### After (New)

```typescript
// Internal imports
import { createStore, RootState, AppDispatch } from './store';

// Store creation
const store = createStore(config);

// Type usage (unchanged)
const state: RootState = store.getState();
```

**No changes for integrators** - the `<WormholeConnect>` props API remains identical.

---

## Testing Strategy

### Unit Tests

1. **Store factory creates independent stores:**
   ```typescript
   test('createStore returns independent stores', () => {
     const store1 = createStore();
     const store2 = createStore();

     store1.dispatch(setFromChain('Ethereum'));

     expect(store1.getState().transferInput.fromChain).toBe('Ethereum');
     expect(store2.getState().transferInput.fromChain).toBeUndefined();
   });
   ```

2. **Store respects config defaults:**
   ```typescript
   test('store initializes with config defaults', () => {
     const config = buildConfig({
       ui: { defaultInputs: { fromChain: 'Solana' } }
     });
     const store = createStore(config);

     expect(store.getState().transferInput.fromChain).toBe('Solana');
   });
   ```

3. **Cross-slice helpers work with instance stores:**
   ```typescript
   test('selectChain clears wallet in same store', () => {
     const store = createStore();
     store.dispatch(connectWallet({ address: '0x123', ... }));

     selectChain(store.dispatch, 'Solana', 'source');

     expect(store.getState().wallet.sending.address).toBe('');
   });
   ```

### Integration Tests

1. **Two WormholeConnect instances with independent state:**
   - Select chain in instance A, verify instance B unaffected
   - Connect wallet in instance A, verify instance B shows no wallet
   - Start transfer in instance A, verify instance B state unchanged

### E2E Tests

1. **Update test harness to use instance-aware dispatch:**
   - Verify tests can target specific instance
   - Verify state changes don't leak between instances

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking E2E tests | High | Medium | Update test harness before removing singleton |
| Performance regression | Low | Low | useMemo prevents unnecessary store recreation |
| Type errors | Medium | Low | RootState/AppDispatch types remain compatible |
| Cross-slice bugs | Low | Medium | Only one cross-slice dependency, already uses dispatch param |
| Memory leaks | Low | Medium | Store cleanup on unmount if needed |

---

## Level of Effort Summary

| Phase | Description | Effort | Dependencies |
|-------|-------------|--------|--------------|
| 1 | Create Store Factory | 2-3 hours | Refactor #1 Phase 1+ |
| 2 | Store Per Instance | 1-2 hours | Phase 1 |
| 3 | Remove Singleton | 2-3 hours | Phase 2 |

**Total Estimated Effort:** 5-8 hours

---

## Success Criteria

1. [ ] Two `<WormholeConnect>` instances have independent Redux state
2. [ ] Transfer in instance A doesn't affect instance B
3. [ ] Wallet connections are instance-scoped
4. [ ] Config defaults applied per-instance
5. [ ] All existing tests pass
6. [ ] E2E test harness works with multi-instance
7. [ ] No memory leaks on component unmount

---

## Code Examples

### Store Factory

```typescript
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import redeemReducer from './redeem';
import { createTransferInputSlice } from './transferInput';
import routerReducer from './router';
import walletReducer from './wallet';
import relayReducer from './relay';
import searchReducer from './search';
import type { InternalConfig } from '../config';

export function createStore(config?: InternalConfig) {
  return configureStore({
    reducer: {
      redeem: redeemReducer,
      transferInput: createTransferInputSlice(config).reducer,
      router: routerReducer,
      wallet: walletReducer,
      relay: relayReducer,
      search: searchReducer,
    },
  });
}

export type AppStore = ReturnType<typeof createStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

// DEPRECATED: Use createStore() instead
// Kept for backwards compatibility during migration
export const store = createStore();
```

### TransferInput Slice Factory

```typescript
// src/store/transferInput.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { InternalConfig } from '../config';

function getInitialState(config?: InternalConfig): TransferInputState {
  return {
    showValidationState: false,
    validations: { ... },
    fromChain: config?.ui?.defaultInputs?.fromChain,
    toChain: config?.ui?.defaultInputs?.toChain,
    // ... rest of initial state
  };
}

export function createTransferInputSlice(config?: InternalConfig) {
  return createSlice({
    name: 'transferInput',
    initialState: getInitialState(config),
    reducers: {
      // ... all existing reducers unchanged
    },
  });
}

// Export actions from a default slice for backwards compat
const defaultSlice = createTransferInputSlice();
export const {
  setValidations,
  setToken,
  // ... all actions
} = defaultSlice.actions;

export default defaultSlice.reducer;
```

### WormholeConnect Integration

```typescript
// src/WormholeConnect.tsx
import React from 'react';
import { Provider } from 'react-redux';
import { createStore } from './store';
import { useConfig } from './contexts/ConfigContext';

function WormholeConnectInner() {
  const config = useConfig();

  const store = React.useMemo(
    () => createStore(config),
    [config]
  );

  // Instance-aware test harness
  React.useEffect(() => {
    const instanceId = config.cacheNamespace || 'default';
    (window as any).__wormholeConnect = (window as any).__wormholeConnect || {};
    (window as any).__wormholeConnect[instanceId] = {
      dispatch: store.dispatch,
      getState: store.getState,
    };
    return () => {
      delete (window as any).__wormholeConnect?.[instanceId];
    };
  }, [store, config.cacheNamespace]);

  return (
    <Provider store={store}>
      <ThemeProvider theme={muiTheme}>
        {/* ... */}
      </ThemeProvider>
    </Provider>
  );
}
```

---

## Open Questions

1. **Store persistence:** Should we persist any Redux state to localStorage? If so, keys need to be instance-scoped.

2. **DevTools:** Multiple stores will show in Redux DevTools. Should we namespace them?
   ```typescript
   configureStore({
     devTools: {
       name: `WormholeConnect-${config.cacheNamespace || 'default'}`,
     },
   });
   ```

3. **Hot reloading:** Does store factory pattern work with HMR during development?

4. **SSR considerations:** Store creation in useMemo should be SSR-safe, but verify.
