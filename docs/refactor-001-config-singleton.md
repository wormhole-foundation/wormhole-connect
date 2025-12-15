# Refactor #1: Config Singleton → Instance-Scoped Configuration

**Status:** In Progress (Phase 2 Complete)
**Priority:** Critical
**PR:** [#3973](https://github.com/wormhole-foundation/wormhole-connect/pull/3973) (Phase 1 infrastructure)
**Depends On:** None (this is the root dependency)
**Blocks:** #2 Redux Store, #3 Wallet State (both depend on config)

---

## Progress Summary

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Create Config Context | ✅ Complete | `ConfigContext`, `useConfig()`, `useSetConfig()` |
| Phase 2: Migrate Easy Files | ✅ Complete | 50+ hooks/views/components migrated |
| Phase 3: Migrate Medium Files | 🔲 Not Started | Utilities needing config param |
| Phase 4: Migrate Hard Files | 🔲 Not Started | Core orchestration |
| Phase 5: Remove Singleton | 🔲 Not Started | Breaking change |

### What's Done

- **ConfigContext** (`src/contexts/ConfigContext.tsx`):
  - `ConfigProvider` wraps app, builds instance config
  - `useConfig()` hook for reading config
  - `useSetConfig()` hook for updating config
  - Both hooks update global singleton for backwards compat during migration

- **Migrated to useConfig()** (50+ files):
  - All hooks in `src/hooks/`
  - All views in `src/views/`
  - Components: `ConfigurablePageHeader`, `FooterNavBar`, `PoweredBy`
  - Contexts: `WalletProvider`

- **Test Infrastructure**:
  - `TestConfigContext` pattern in `src/utils/testHelpers.tsx`
  - All 390 tests passing

### What's Next

1. **Phase 3**: Migrate utility functions to accept config as parameter
2. **Phase 4**: Migrate hard files (TokensContext, store, routes)
3. **Phase 5**: Remove singleton (breaking change)

---

## Problem Statement

The global config singleton at `src/config/index.ts:172` is the root cause of multi-instance incompatibility. When `const config = buildConfig()` executes at module load time, it creates a single configuration object that **69+ files** import directly. The `setConfig()` function mutates this object in-place, meaning all widget instances share the same configuration.

**Current Architecture:**
```
Module Load
    ↓
const config = buildConfig()  ← Created ONCE per JS runtime
    ↓
Exported to 69+ files
    ↓
setConfig() mutates IN-PLACE
    ↓
All importers see the SAME object reference
```

**The comment that explains it all (line 225-226):**
```typescript
// We overwrite keys in the existing object so the references to the config
// imported elsewhere point to the new values
```

This is intentional architecture for single-instance usage, but becomes the fundamental blocker for multi-instance.

---

## Impact Analysis

### What Breaks with Multiple Instances

| Scenario | Current Behavior | Expected Behavior |
|----------|------------------|-------------------|
| Two widgets with different networks | Last `setConfig()` wins; both use same network | Each widget uses its own network |
| Two widgets with different tokens | Token whitelist shared; both see same tokens | Each widget has independent token list |
| Two widgets with different RPCs | RPC endpoints overwritten | Each widget uses its configured RPCs |
| Custom handlers (`validateTransfer`, etc.) | Last registered handler wins | Each widget has own handlers |
| SDK context (`_v2Wormhole`) | Shared/cleared unpredictably | Each widget has own SDK client |

### Files That Import Config (69 total)

**By Category:**

| Category | Count | Refactor Difficulty |
|----------|-------|---------------------|
| Hooks | 20 | Mixed (Easy-Hard) |
| Utils | 20+ | Mixed (Easy-Hard) |
| Views | 15+ | Medium |
| Components | 5+ | Easy |
| Contexts | 2 | Hard |
| Store | 1 | Hard |
| Routes | 3 | Hard |
| Top-level | 3 | Easy |

**Hardest Files to Refactor (require special attention):**

1. **`src/hooks/useConfirmTransaction.ts`** - Orchestrates entire transfer: UI config, validators, routes, tokens, events
2. **`src/hooks/useFetchQuotes.ts`** - Complex quote pipeline: routes, caching, filtering, custom handlers
3. **`src/hooks/useGetTokenBalances.ts`** - SDK context, indexers, token cache, network config
4. **`src/contexts/TokensContext.tsx`** - Manages token cache and SDK lifecycle
5. **`src/store/transferInput.ts`** - Central state with defaults from config
6. **`src/utils/tokenListUtils.ts`** - Multiple handlers and whitelist logic
7. **`src/routes/sdkv2/route.ts`** - Base route implementation touching all config
8. **`src/routes/operator.ts`** - Route singleton managing all route types

---

## Solution Architecture

### Target State

```
<WormholeConnect config={configA}>
    ↓
<ConfigProvider value={instanceConfigA}>
    ↓
useConfig() returns instanceConfigA
    ↓
All child components get instance-specific config
```

### Implementation Approach

**Option A: React Context (Recommended)**

```typescript
// New: src/contexts/ConfigContext.tsx
const ConfigContext = React.createContext<InternalConfig | null>(null);

export function ConfigProvider({
  config: userConfig,
  children
}: {
  config?: WormholeConnectConfig;
  children: React.ReactNode
}) {
  const internalConfig = React.useMemo(
    () => buildConfig(userConfig),
    [userConfig]
  );

  return (
    <ConfigContext.Provider value={internalConfig}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig(): InternalConfig {
  const config = React.useContext(ConfigContext);
  if (!config) {
    throw new Error('useConfig must be used within ConfigProvider');
  }
  return config;
}
```

**Option B: Instance Class**

```typescript
// Create instance that owns all state
class WormholeConnectInstance {
  readonly config: InternalConfig;
  readonly store: Store;
  readonly walletProvider: WalletProvider;

  constructor(userConfig?: WormholeConnectConfig) {
    this.config = buildConfig(userConfig);
    this.store = createStore(this.config);
    this.walletProvider = createWalletProvider(this.config);
  }
}
```

**Recommendation:** Option A (React Context) because:
- Integrates naturally with existing React component tree
- Allows gradual migration (can use both patterns during transition)
- Familiar pattern for React developers
- Works well with existing hooks architecture

---

## Migration Strategy

### Phase 1: Create Config Context (Non-Breaking)

**Goal:** Add new context-based access pattern without removing singleton

**Steps:**
1. Create `ConfigContext.tsx` with `ConfigProvider` and `useConfig()`
2. Wrap `<WormholeConnect>` children with `<ConfigProvider>`
3. Export `useConfig` alongside existing `config` default export
4. Add deprecation warning to direct `config` imports (via ESLint rule or comment)

**Files to Create/Modify:**
- CREATE: `src/contexts/ConfigContext.tsx`
- MODIFY: `src/WormholeConnect.tsx` - Add ConfigProvider wrapper
- MODIFY: `src/config/index.ts` - Add deprecation comment

**Estimated Effort:** 2-4 hours

### Phase 2: Migrate Easy Files

**Goal:** Convert files with simple config access to use `useConfig()`

**Criteria for "Easy":**
- Single config property access (e.g., `config.ui.showPoweredBy`)
- No config passed to external functions
- Pure display/read-only usage

**Files (25+):**
- UI config consumers in `src/components/`
- Simple hooks like `useAutoEnableGasDropoff`, `useExternalSearch`
- API config consumers (`mayanApi`, `lifiExplorerUrl`, etc.)

**Pattern:**
```typescript
// Before
import config from 'config';
function MyComponent() {
  return config.ui.showSomething ? <Thing /> : null;
}

// After
import { useConfig } from 'contexts/ConfigContext';
function MyComponent() {
  const config = useConfig();
  return config.ui.showSomething ? <Thing /> : null;
}
```

**Estimated Effort:** 4-6 hours

### Phase 3: Migrate Medium Files

**Goal:** Convert files that use multiple config properties or pass config to utilities

**Files (20+):**
- Most hooks in `src/hooks/`
- View components in `src/views/`
- Token/chain selection utilities

**Challenges:**
- Some utilities called from multiple places need config passed as parameter
- May need to update function signatures

**Pattern for Utilities:**
```typescript
// Before (utility)
import config from 'config';
export function getTokensForChain(chain: Chain) {
  return config.tokens.getAllForChain(chain);
}

// After (utility accepts config)
export function getTokensForChain(config: InternalConfig, chain: Chain) {
  return config.tokens.getAllForChain(chain);
}

// After (hook wrapper)
export function useTokensForChain(chain: Chain) {
  const config = useConfig();
  return config.tokens.getAllForChain(chain);
}
```

**Estimated Effort:** 8-12 hours

### Phase 4: Migrate Hard Files

**Goal:** Convert core orchestration files

**Files:**
1. `src/contexts/TokensContext.tsx`
2. `src/store/transferInput.ts`
3. `src/routes/operator.ts`
4. `src/routes/sdkv2/route.ts`
5. `src/hooks/useConfirmTransaction.ts`
6. `src/hooks/useFetchQuotes.ts`
7. `src/hooks/useGetTokenBalances.ts`
8. `src/utils/tokenListUtils.ts`

**Special Considerations:**

**TokensContext.tsx:**
- Manages token cache and SDK lifecycle
- Calls `clearWormholeContextV2()` which affects global state
- **Solution:** Move SDK context caching into config instance

**transferInput.ts (Redux):**
- `getInitialState()` reads from global config
- **Solution:** Pass config to store factory (see Refactor #2)

**RouteOperator:**
- Created once in `buildConfig()`, holds `QuoteMetadataCache`
- **Solution:** Already part of config, will be instance-scoped automatically

**SDK Context (`_v2Wormhole`):**
- Currently cached on config object
- `getWormholeContextV2()` returns singleton
- **Solution:** Make SDK context part of instance state, not module state

**Estimated Effort:** 16-24 hours

### Phase 5: Remove Singleton

**Goal:** Remove global `config` singleton and `setConfig()`

**Steps:**
1. Remove `const config = buildConfig()` at module level
2. Remove `export default config`
3. Remove `setConfig()` function
4. Update any remaining direct imports to use context
5. Update tests

**Breaking Change:** This is a breaking change for any integrators using:
- `import config from '@wormhole-foundation/wormhole-connect'`
- `setConfig()` API

**Estimated Effort:** 4-6 hours

---

## API Changes

### Before (Current)

```typescript
// Integrator code
import WormholeConnect from '@wormhole-foundation/wormhole-connect';

<WormholeConnect config={myConfig} />
```

```typescript
// Internal code
import config from 'config';
const network = config.network;
```

### After (New)

```typescript
// Integrator code (unchanged)
import WormholeConnect from '@wormhole-foundation/wormhole-connect';

<WormholeConnect config={myConfig} />
```

```typescript
// Internal code (hooks/components)
import { useConfig } from 'contexts/ConfigContext';
function MyComponent() {
  const config = useConfig();
  const network = config.network;
}
```

```typescript
// Internal code (utilities)
export function myUtility(config: InternalConfig, ...args) {
  // Use passed config instead of importing
}
```

---

## Testing Strategy

### Unit Tests

1. **ConfigProvider isolation test:**
   ```typescript
   test('two ConfigProviders maintain separate configs', () => {
     const { result: result1 } = renderHook(() => useConfig(), {
       wrapper: ({ children }) => (
         <ConfigProvider config={{ network: 'Mainnet' }}>{children}</ConfigProvider>
       ),
     });

     const { result: result2 } = renderHook(() => useConfig(), {
       wrapper: ({ children }) => (
         <ConfigProvider config={{ network: 'Testnet' }}>{children}</ConfigProvider>
       ),
     });

     expect(result1.current.network).toBe('Mainnet');
     expect(result2.current.network).toBe('Testnet');
   });
   ```

2. **Config changes don't affect other instances:**
   - Verify memoization works correctly
   - Verify config changes trigger re-renders only in affected tree

### Integration Tests

1. **Two WormholeConnect instances with different configs:**
   - Different networks
   - Different token whitelists
   - Different RPC endpoints

2. **Verify state isolation:**
   - Actions in one instance don't affect other
   - Token caches are separate
   - Quote caches are separate

### E2E Tests

1. **Multiple widgets on same page:**
   - Both functional simultaneously
   - Different chains selected in each
   - Different wallets connected (if wallet isolation complete)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking changes for integrators | Low | Medium | Phase 5 is the only breaking change; document clearly |
| Performance regression from context | Low | Low | Memoization prevents unnecessary re-renders |
| Missed direct imports | Medium | High | Grep for `from 'config'` or `from '../config'` before Phase 5 |
| SDK context conflicts | Medium | High | Address in Phase 4 with instance-scoped SDK cache |
| Test coverage gaps | Medium | Medium | Add integration tests before Phase 5 |

---

## Level of Effort Summary

| Phase | Description | Effort | Dependencies |
|-------|-------------|--------|--------------|
| 1 | Create Config Context | 2-4 hours | None |
| 2 | Migrate Easy Files | 4-6 hours | Phase 1 |
| 3 | Migrate Medium Files | 8-12 hours | Phase 2 |
| 4 | Migrate Hard Files | 16-24 hours | Phase 3 |
| 5 | Remove Singleton | 4-6 hours | Phase 4 |

**Total Estimated Effort:** 34-52 hours (1-2 weeks)

---

## Success Criteria

1. [ ] Two `<WormholeConnect>` components can render on same page with different configs
2. [ ] Each instance maintains independent:
   - Network/chain configuration
   - Token whitelist
   - RPC endpoints
   - Custom handlers
   - SDK context
3. [ ] No performance regression (bundle size, render time)
4. [ ] All existing tests pass
5. [ ] New integration tests for multi-instance scenario pass
6. [ ] Documentation updated for integrators

---

## Open Questions

1. **SDK Context Caching:** Should we cache SDK context per-config-hash or per-instance?
   - Per-hash: Reuse SDK if same network (performance)
   - Per-instance: Complete isolation (correctness)

2. **Route Operator:** Currently holds `QuoteMetadataCache`. Should quotes be shareable across instances with same config?

3. **localStorage Keys:** Current `cacheNamespace` pattern requires integrator configuration. Should we auto-generate unique namespaces?

4. **Backwards Compatibility:** How long should we support the deprecated `setConfig()` API?
