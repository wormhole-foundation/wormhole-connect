# Side Effects Audit Report: Wormhole Connect

**Date:** December 1, 2025
**Purpose:** Identify all module-level side effects that prevent multiple widget instances from coexisting on the same page.

---

## Executive Summary

The codebase exhibits **classic singleton contamination**—a pattern where module-level state is shared across all consumers. The primary infection vector is `src/config/index.ts:172` where `const config = buildConfig()` creates a single instance that 69+ files import directly.

**Root Cause:** Wormhole Connect is architected as a singleton-by-design with:
- Module-scoped config singleton created at load time
- In-place mutation via `setConfig()` to "hot swap" configuration
- 69+ files directly importing and reading the singleton
- Shared Redux store, localStorage keys, and SDK context caching
- No isolation between component instances

**Multi-instance impossible because:** Every component tree in the same JS runtime shares the SAME config object, Redux store, and cached state. The last instance to call `setConfig()` overwrites configuration for ALL instances.

---

## Critical Severity (Must Fix for Multi-Instance)

### 1. Config Singleton

| Attribute | Details |
|-----------|---------|
| **Location** | `src/config/index.ts:172-174` |
| **Code** | `const config = buildConfig(); export default config;` |
| **Type** | Singleton Pattern |
| **Impact** | Two widgets share same config; last `setConfig()` wins globally |
| **Complexity** | **VERY HIGH** - 69+ files import directly; requires architectural redesign |

**How it's mutated:**
- `setConfig()` at line 219-235 mutates keys in-place: `config[key] = newConfig[key]`
- `config._v2Wormhole` is cached/cleared via `getWormholeContextV2()` and `clearWormholeContextV2()`

**The comment that explains it all (line 225-226):**
```typescript
// We overwrite keys in the existing object so the references to the config
// imported elsewhere point to the new values
```

This is intentional architecture for single-instance usage, but becomes the fundamental blocker for multi-instance.

**Files that import config:** 69+ files including all store slices, hooks, views, utils, and routes.

---

### 2. Redux Store Singleton

| Attribute | Details |
|-----------|---------|
| **Location** | `src/store/index.ts:9-18` |
| **Code** | `export const store = configureStore({ reducer: { ... } });` |
| **Type** | Singleton Pattern |
| **Impact** | Transfer state, wallet connections, routing all collide between instances |
| **Complexity** | **HIGH** - Requires store-per-instance pattern |

**Reducers affected:**
- `redeem` - Redemption status shared
- `transferInput` - Transfer amounts/tokens collide
- `router` - Route navigation affects all instances
- `wallet` - Wallet connections shared globally
- `relay` - Relay state shared
- `search` - Search state shared

---

### 3. Module-Level Wallet State

| Attribute | Details |
|-----------|---------|
| **Location** | `src/utils/wallet/InternalWalletProvider.ts:22-41` |
| **Code** | `let pendingConnect; const walletConnections = {};` |
| **Type** | Module-level Mutable State |
| **Impact** | Only one wallet connection can be pending; connections overwrite each other |
| **Complexity** | **MEDIUM-HIGH** - Isolated to one file but deeply integrated |

**Specific issues:**
- Only ONE widget can prompt for wallet connection at a time (line 156-159 rejects concurrent requests)
- Second widget's wallet connection overwrites first's
- Wallet disconnects affect all instances

---

## High Severity (Data Corruption / Race Conditions)

### 4. SDK Context Cache

| Attribute | Details |
|-----------|---------|
| **Location** | `src/config/index.ts:176-185` |
| **Code** | `config._v2Wormhole = await newWormholeContextV2()` |
| **Type** | Cached Singleton |
| **Impact** | Shared Wormhole SDK client; `clearWormholeContextV2()` affects all instances |
| **Complexity** | **MEDIUM** - Move cache to instance scope |

---

### 5. Token Cache

| Attribute | Details |
|-----------|---------|
| **Location** | `src/config/tokens.ts` (via `buildTokenCache()`) |
| **Code** | Built into `config.tokens`, persists to localStorage |
| **Type** | Shared Mutable Cache |
| **Impact** | Token additions from Widget A appear in Widget B |
| **Complexity** | **MEDIUM** - Part of config refactor |

**Additional concerns:**
- Persisted to localStorage with shared key `config.cacheKey('token-cache:${network}')`
- `TokenCache.add()` and `TokenCache.addFromTokenId()` mutate globally
- `TokensContext` mutates via `getOrFetchToken()`

---

### 6. Quote Metadata Cache

| Attribute | Details |
|-----------|---------|
| **Location** | `src/routes/operator.ts:73` |
| **Code** | `this.quoteMetadataCache = new QuoteMetadataCache()` |
| **Type** | Instance Cache (but instance is singleton) |
| **Impact** | Quote results cached globally; wrong quotes served to wrong widgets |
| **Complexity** | **MEDIUM** - Part of config refactor |

---

### 7. Balance Cache

| Attribute | Details |
|-----------|---------|
| **Location** | `src/utils/balanceCache.ts:12-13` |
| **Code** | `const cache = {}; const failedTokens = new Set();` |
| **Type** | Module-level Mutable State |
| **Impact** | Balance queries collide across instances |
| **Complexity** | **LOW** - Simple refactor to instance scope |

---

## Medium Severity (SSR-Breaking / Global Pollution)

### 8. Module-Level DOM Access (main.tsx)

| Attribute | Details |
|-----------|---------|
| **Location** | `src/main.tsx:17,26,28` |
| **Code** | `document.getElementById()`, `window.__CONNECT_*` |
| **Type** | Module-level Browser API |
| **Impact** | SSR crash: `ReferenceError: document is not defined` |
| **Complexity** | **LOW** - Entry point only; guard or exclude from SSR builds |

---

### 9. Module-Level DOM Access (SampleApp.tsx)

| Attribute | Details |
|-----------|---------|
| **Location** | `src/SampleApp.tsx:9` |
| **Code** | `ReactDOM.createRoot(document.getElementById())` |
| **Type** | Module-level Browser API |
| **Impact** | SSR crash |
| **Complexity** | **LOW** - Dev-only file |

---

### 10. Unguarded localStorage (inProgressTxCache)

| Attribute | Details |
|-----------|---------|
| **Location** | `src/utils/inProgressTxCache.ts:109,152,189,222` |
| **Code** | `window.localStorage` in functions |
| **Type** | Unguarded Browser API |
| **Impact** | SSR crash if called during server render |
| **Complexity** | **LOW** - Add `typeof` guards |

---

### 11. Unguarded localStorage (InternalWalletProvider)

| Attribute | Details |
|-----------|---------|
| **Location** | `src/utils/wallet/InternalWalletProvider.ts:62,74,122,133,142` |
| **Code** | Bare `localStorage` calls |
| **Type** | Unguarded Browser API |
| **Impact** | SSR crash |
| **Complexity** | **LOW** - Add `typeof` guards |

---

### 12. Window Global (_connectConfig)

| Attribute | Details |
|-----------|---------|
| **Location** | `src/config/index.ts:231-234` |
| **Code** | `window._connectConfig = config` |
| **Type** | Global State Mutation |
| **Impact** | Last widget overwrites; debugging confusion |
| **Complexity** | **TRIVIAL** - Make instance-specific or remove |

---

### 13. Window Global (dispatchReduxAction)

| Attribute | Details |
|-----------|---------|
| **Location** | `src/WormholeConnect.tsx:37-41` |
| **Code** | `window.dispatchReduxAction = (action) => store.dispatch(action)` |
| **Type** | Global State Mutation (in useEffect) |
| **Impact** | Test utility exposed; references singleton store |
| **Complexity** | **TRIVIAL** - Safe in useEffect, but tied to singleton store |

---

## Low Severity (Acceptable / Benign)

### 14. CSS Imports

| Attribute | Details |
|-----------|---------|
| **Location** | `src/AppRouter.tsx:5`, `src/WormholeConnect.tsx:5` |
| **Code** | `import './App.css'` |
| **Type** | CSS Side Effect |
| **Impact** | Global styles; font imports |
| **Complexity** | **N/A** - Expected behavior |

---

### 15. Format Number Cache

| Attribute | Details |
|-----------|---------|
| **Location** | `src/utils/formatNumber.ts:8` |
| **Code** | `const separatorsCache = new Map()` |
| **Type** | Module-level Cache |
| **Impact** | Locale data cached; safe to share |
| **Complexity** | **N/A** - Pure derived data |

---

### 16. SDK Platform Imports

| Attribute | Details |
|-----------|---------|
| **Location** | `src/config/index.ts:23-27` |
| **Code** | `import evm from '@wormhole-foundation/sdk/evm'` |
| **Type** | SDK Registration |
| **Impact** | SDK registration side effects |
| **Complexity** | **N/A** - Required by SDK |

---

## Complexity Ranking

### Tier 1: Architectural Redesign Required

#### Config Singleton (`src/config/index.ts`)

**Why Hard:** 69+ direct importers; entire app assumes `import config from 'config'` works

**Solution:** Create `ConfigProvider` context; each widget instance owns its config

**Effort:** ~2-3 weeks; touches every file

**Pattern:**
```typescript
// Instead of: import config from 'config'
// Use: const config = useConfig()
```

#### Redux Store Singleton (`src/store/index.ts`)

**Why Hard:** All components use `useSelector`/`useDispatch` assuming global store

**Solution:** Store-per-instance via `<Provider store={createStore(props.config)}>`

**Effort:** ~1 week; mostly mechanical changes

**Pattern:** Move `configureStore()` inside component, pass via context

---

### Tier 2: Moderate Refactoring

#### Wallet State (`src/utils/wallet/InternalWalletProvider.ts`)

**Why Medium:** Single file, but wallet connection flow is complex

**Solution:** Move `pendingConnect` and `walletConnections` into React context or instance class

**Effort:** ~2-3 days

#### SDK Context Cache (`config._v2Wormhole`)

**Why Medium:** Tied to config singleton

**Solution:** Part of config refactor; cache per-instance

**Effort:** Included in config refactor

#### Token Cache & Quote Cache

**Why Medium:** Part of config object

**Solution:** Refactored as part of config redesign

**Effort:** Included in config refactor

---

### Tier 3: Quick Fixes

#### Balance Cache (`src/utils/balanceCache.ts`)

**Fix:** Pass cache object as parameter or store in context

**Effort:** ~2 hours

#### SSR Guards (various localStorage/window accesses)

**Fix:** Add `typeof window !== 'undefined'` guards

**Pattern:** Follow `src/config/tokens.ts:25` example:
```typescript
const HAS_LOCALSTORAGE = typeof localStorage !== 'undefined';
```

**Effort:** ~1 hour per file

#### Window Globals

**Fix:** Remove or namespace per-instance

**Effort:** ~30 minutes

---

## Recommended Refactor Sequence

### Phase 1: Quick Wins (1-2 days)

- [ ] Add SSR guards to localStorage accesses
- [ ] Remove/namespace window globals
- [ ] Fix balance cache to accept instance param

### Phase 2: Instance Isolation (1-2 weeks)

- [ ] Create WidgetInstance class/context
- [ ] Move config into instance scope
- [ ] Move Redux store creation into component
- [ ] Update all config imports to use context

### Phase 3: State Migration (1 week)

- [ ] Move wallet state into context
- [ ] Move caches into instance scope
- [ ] Update SDK context caching

---

## Multi-Instance Failure Sequence Diagram

```
Time  Instance A                    Singleton                Instance B
─────────────────────────────────────────────────────────────────────────
t0    mount                         config = buildConfig()
t1    AppRouter calls setConfig()   config ← configA
t2    reads config.tokens           returns A's tokens
t3                                                            mount
t4                                                            AppRouter calls setConfig()
t5                                  config ← configB
t6    useTokenList hook             returns B's tokens       reads config.tokens
t7    NOW USING WRONG CONFIG
```

---

## Dependency Graph

```
config singleton
├── TokenCache (config.tokens)
│   ├── localStorage (via config.cacheKey())
│   └── Used by: TokensContext, all token hooks, sdkv2 utils
├── RouteOperator (config.routes)
│   └── Used by: useFetchQuotes, useSortedRoutesWithQuotes
├── RPCs (config.rpcs)
│   └── Used by: wallet utils, sdkv2, chain interactions
├── UI config (config.ui)
│   └── Used by: Bridge components, configuration display
├── Callbacks (config.triggerEvent, config.validateTransfer, etc.)
│   └── Used by: AppRouter, transfer flows, validation
└── _v2Wormhole cache
    └── Created by: getWormholeContextV2(), used by sdkv2 route

Redux store singleton
├── transferInput slice
├── wallet slice
├── redeem slice
├── relay slice
└── router slice
    └── All dispatched to from components/hooks

localStorage
├── Keyed by config.cacheKey()
├── Token cache persistence
└── In-progress transaction cache
```

---

## SSR-Safe Patterns Found (Best Practices to Follow)

### Good Example: `src/config/tokens.ts:25`

```typescript
const HAS_LOCALSTORAGE = typeof localStorage !== 'undefined';

// Later in code:
if (HAS_LOCALSTORAGE) {
  localStorage.setItem(this._localStorageKey, jsonString);
}
```

### Good Example: `src/config/events.ts:14-15`

```typescript
const host =
  typeof window === 'undefined' ? undefined : window.location?.host;
```

### Good Example: `src/utils/wallet/index.ts:140-143`

```typescript
function isNightlyInjectedProvider() {
  return (
    typeof window !== 'undefined' &&
    window.ethereum &&
    window.ethereum.isNightly === true
  );
}
```
