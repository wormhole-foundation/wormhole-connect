# Refactor #3: Module-Level Wallet State → Instance-Scoped Wallet Provider

**Status:** Planning
**Priority:** Critical
**Ticket:** (link to ticket)
**Depends On:** Refactor #1 (Config Singleton) - wallet provider needs config for localStorage keys
**Blocks:** None

---

## Problem Statement

The `InternalWalletProvider` at `src/utils/wallet/InternalWalletProvider.ts` stores wallet connection state at module level:

```typescript
// Lines 22-41
let pendingConnect:
  | {
      chain: Chain;
      type: TransferWallet;
      promise: Promise<Wallet>;
      resolve: (wallet: Wallet) => void;
      reject: (error: Error) => void;
    }
  | undefined;

const walletConnections: {
  sending?: { wallet: Wallet; disconnectHandler: () => void };
  receiving?: { wallet: Wallet; disconnectHandler: () => void };
} = {};
```

**Critical Issues:**

1. **Concurrent connection blocking:** If user clicks "Connect Wallet" in two instances, the second request fails with "Connect wallet pending" error (line 156-161)

2. **Wallet connection collision:** Both instances share `walletConnections`. Connecting in instance B overwrites instance A's wallet reference.

3. **Shared disconnect handlers:** Disconnecting in one instance triggers handlers that may clear state in the wrong instance.

---

## Impact Analysis

### What Breaks with Multiple Instances

| Scenario | Current Behavior | Expected Behavior |
|----------|------------------|-------------------|
| Connect wallet in both instances | Second connection rejected | Both connect independently |
| Same wallet in both instances | Last connection overwrites first | Each tracks its own connection |
| Disconnect in instance A | May affect instance B's state | Only instance A disconnects |
| Auto-reconnect on page load | May restore wrong wallet | Each restores its own wallet |

### State Flow Diagram

```
User clicks "Connect" in Instance A
    ↓
pendingConnect = { chain, type, promise, resolve, reject }  ← Module state
    ↓
User clicks "Connect" in Instance B (WHILE A is pending)
    ↓
ERROR: "Connect wallet pending" (line 156-161)
    ↓
Instance B user frustrated
```

```
Instance A connects MetaMask
    ↓
walletConnections.sending = { wallet: MetaMask, handler }  ← Module state
    ↓
Instance B connects Phantom (also as "sending")
    ↓
walletConnections.sending = { wallet: Phantom, handler }  ← OVERWRITES
    ↓
Instance A's MetaMask reference LOST
Instance A still shows MetaMask in UI (Redux), but actual wallet object is gone
```

---

## Current Architecture Deep Dive

### Wallet Connection Flow

```
1. UI Click (WalletConnector/index.tsx:99)
   └── connectWallet()

2. WalletProvider.connectWallet() (WalletProvider.tsx:89-113)
   └── walletProvider.connectWallet(chain, type, autoConnect)
   └── setupWalletConnection()

3. InternalWalletProvider.connectWallet() (InternalWalletProvider.ts:147-181)
   ├── IF autoConnect: connectLastUsedWallet() → return
   ├── IF pendingConnect exists: throw Error("Connect wallet pending")
   ├── CREATE pendingConnect with new Promise
   └── RETURN promise (blocks until resolved)

4. User selects wallet in picker UI
   └── onWalletSelected(wallet, chain, type)

5. InternalWalletProvider.onWalletSelected() (InternalWalletProvider.ts:219-244)
   ├── VALIDATE pendingConnect matches chain/type
   ├── connectWalletToChain(wallet, chain)
   ├── setWalletConnection(chain, type, wallet)
   ├── RESOLVE pendingConnect.promise
   └── CLEAR pendingConnect

6. setWalletConnection() (InternalWalletProvider.ts:43-76)
   ├── REMOVE old disconnect handler
   ├── CREATE new handleDisconnect
   ├── STORE in walletConnections[type]
   ├── REGISTER disconnect listener
   └── PERSIST to localStorage
```

### localStorage Keys

**Pattern:** `wormhole-connect:{namespace}:wallet:{platform}`

**Examples:**
- `wormhole-connect:wallet:Evm` (default)
- `wormhole-connect:my-dapp:wallet:Evm` (custom namespace)

**Stored Value:** Wallet name string (e.g., "MetaMask", "Phantom")

**Note:** Keys already support per-instance isolation via `cacheNamespace`, but the module state does not.

### External Wallet SDK Dependencies

| SDK | Singleton Risk | Notes |
|-----|----------------|-------|
| `@wormhole-labs/wallet-aggregator-core` | Low | Each wallet instance is independent |
| `@wormhole-labs/wallet-aggregator-evm` | Medium | WalletConnect maintains session state |
| `@wormhole-labs/wallet-aggregator-solana` | Medium | WalletConnect adapter has shared storage prefix |
| `@wormhole-labs/wallet-aggregator-sui` | Low | Uses `getWallets()` discovery |
| `@wormhole-labs/wallet-aggregator-aptos` | Medium | `walletCoreFactory` may return singleton |
| `@solana-mobile/wallet-standard-mobile` | **High** | `registerMwa()` is global registration |

---

## Solution Architecture

### Target State

```typescript
// Each WormholeConnect instance gets its own wallet provider state
<WormholeConnect>
  <WalletProviderContext.Provider value={instanceWalletProvider}>
    // All wallet operations scoped to this instance
  </WalletProviderContext.Provider>
</WormholeConnect>
```

### Implementation Approach

**Step 1: Create InternalWalletProviderState class**

```typescript
// src/utils/wallet/InternalWalletProvider.ts

class InternalWalletProviderState {
  private pendingConnect: PendingConnectState | undefined;
  private walletConnections: WalletConnectionsState = {};
  private config: InternalConfig;

  constructor(config: InternalConfig) {
    this.config = config;
  }

  async connectWallet(
    chain: Chain,
    type: TransferWallet,
    autoConnect?: boolean,
  ): Promise<Wallet | undefined> {
    // Same logic, but uses this.pendingConnect instead of module variable
  }

  setWalletConnection(chain: Chain, type: TransferWallet, wallet: Wallet): void {
    // Same logic, but uses this.walletConnections
    // Uses this.config.cacheKey() for localStorage
  }

  // ... all other methods as instance methods
}
```

**Step 2: Factory function returns provider instance**

```typescript
export function createInternalWalletProvider(
  config: InternalConfig,
): WormholeConnectWalletProvider {
  const state = new InternalWalletProviderState(config);

  return {
    isInternal: true,
    connectWallet: state.connectWallet.bind(state),
    getWallet: state.getWallet.bind(state),
    swapWallets: state.swapWallets.bind(state),
    onWalletSelected: state.onWalletSelected.bind(state),
    onWalletSelectCancelled: state.onWalletSelectCancelled.bind(state),
  };
}
```

**Step 3: Create provider per WormholeConnect instance**

```typescript
// src/contexts/wallet/WalletProvider.tsx

export function WalletProvider({ children }) {
  const config = useConfig();

  const walletProvider = React.useMemo(() => {
    // Use external provider if provided, otherwise create internal
    return externalProvider ?? createInternalWalletProvider(config);
  }, [externalProvider, config]);

  // ... rest of provider logic
}
```

---

## Migration Strategy

### Phase 1: Create State Class (Non-Breaking)

**Goal:** Encapsulate state in class without changing module exports

**Steps:**
1. Create `InternalWalletProviderState` class
2. Move module variables into class properties
3. Convert module functions to class methods
4. Create singleton instance at module level (temporary)
5. Export wrapper functions that delegate to singleton

**Files to Modify:**
- `src/utils/wallet/InternalWalletProvider.ts`

**Estimated Effort:** 3-4 hours

### Phase 2: Add Factory Function

**Goal:** Export factory alongside singleton

**Steps:**
1. Add `createInternalWalletProvider(config)` factory function
2. Keep existing `internalWalletProvider` export (uses default singleton)
3. Add deprecation warning to singleton

**Files to Modify:**
- `src/utils/wallet/InternalWalletProvider.ts`

**Estimated Effort:** 1-2 hours

### Phase 3: Update WalletProvider Context

**Goal:** Create wallet provider per instance

**Steps:**
1. Modify `WalletProvider` to call factory with config
2. Store provider in context
3. Update consumers to use context provider

**Files to Modify:**
- `src/contexts/wallet/WalletProvider.tsx`

**Estimated Effort:** 2-3 hours

### Phase 4: Handle External SDK Singletons

**Goal:** Mitigate singleton issues in wallet SDKs

**Issues to Address:**

1. **Solana Mobile Wallet Adapter (`registerMwa`)**
   - Currently registered globally in `WalletConnector` (line 46)
   - **Solution:** Instance tracking with ref counting
   ```typescript
   const mwaRegistrations = new Set<string>();

   function registerMwaForInstance(instanceId: string) {
     if (mwaRegistrations.size === 0) {
       registerMwa();  // Only register once
     }
     mwaRegistrations.add(instanceId);
   }

   function unregisterMwaForInstance(instanceId: string) {
     mwaRegistrations.delete(instanceId);
     // Don't unregister - MWA registration is permanent
   }
   ```

2. **WalletConnect Session State**
   - WalletConnect maintains session internally
   - **Solution:** Use different `projectId` per instance OR document as limitation

3. **Aptos walletCore**
   - May be singleton from factory
   - **Solution:** Investigate SDK source; may need upstream fix

**Files to Modify:**
- `src/views/v3/Bridge/WalletConnector/index.tsx`
- `src/utils/wallet/wallets.ts` (if needed)

**Estimated Effort:** 4-6 hours

### Phase 5: Remove Singleton Export

**Goal:** Remove module-level singleton

**Steps:**
1. Remove module-level `internalWalletProvider` export
2. Update any remaining direct imports
3. Update tests

**Files to Modify:**
- `src/utils/wallet/InternalWalletProvider.ts`
- Any files importing singleton directly

**Estimated Effort:** 2-3 hours

---

## Code Examples

### InternalWalletProviderState Class

```typescript
// src/utils/wallet/InternalWalletProvider.ts

interface PendingConnectState {
  chain: Chain;
  type: TransferWallet;
  promise: Promise<Wallet>;
  resolve: (wallet: Wallet) => void;
  reject: (error: Error) => void;
}

interface WalletConnectionState {
  wallet: Wallet;
  disconnectHandler: () => void;
}

interface WalletConnectionsState {
  sending?: WalletConnectionState;
  receiving?: WalletConnectionState;
}

class InternalWalletProviderState {
  private pendingConnect: PendingConnectState | undefined;
  private walletConnections: WalletConnectionsState = {};
  private readonly config: InternalConfig;

  constructor(config: InternalConfig) {
    this.config = config;
  }

  private getLastUsedWalletKey(chain: Chain): string | null {
    const chainConfig = this.config.chains[chain];
    if (!chainConfig) return null;
    const platform = chainToPlatform(chain);
    return this.config.cacheKey(`wallet:${platform}`);
  }

  setWalletConnection(
    chain: Chain,
    type: TransferWallet,
    wallet: Wallet,
  ): void {
    const existingConnection = this.walletConnections[type];
    if (existingConnection) {
      existingConnection.wallet.off('disconnect', existingConnection.disconnectHandler);
    }

    const handleDisconnect = () => {
      const connection = this.walletConnections[type];
      if (connection) {
        connection.wallet.off('disconnect', handleDisconnect);
        this.walletConnections[type] = undefined;

        const localStorageKey = this.getLastUsedWalletKey(chain);
        if (localStorageKey && typeof localStorage !== 'undefined') {
          localStorage.removeItem(localStorageKey);
        }
      }
    };

    this.walletConnections[type] = {
      wallet,
      disconnectHandler: handleDisconnect,
    };

    wallet.on('disconnect', handleDisconnect);

    const localStorageKey = this.getLastUsedWalletKey(chain);
    if (localStorageKey && typeof localStorage !== 'undefined') {
      localStorage.setItem(localStorageKey, wallet.getName());
    }
  }

  getWalletConnection(type: TransferWallet): Wallet | undefined {
    return this.walletConnections[type]?.wallet;
  }

  async connectWallet(
    chain: Chain,
    type: TransferWallet,
    autoConnect?: boolean,
  ): Promise<Wallet | undefined> {
    if (autoConnect) {
      return this.connectLastUsedWallet(chain, type);
    }

    if (this.pendingConnect) {
      throw new Error('Connect wallet pending');
    }

    let resolve: (wallet: Wallet) => void;
    let reject: (error: Error) => void;

    const promise = new Promise<Wallet>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    this.pendingConnect = {
      chain,
      type,
      promise,
      resolve: resolve!,
      reject: reject!,
    };

    return promise;
  }

  private async connectLastUsedWallet(
    chain: Chain,
    type: TransferWallet,
  ): Promise<Wallet | undefined> {
    const localStorageKey = this.getLastUsedWalletKey(chain);
    if (!localStorageKey || typeof localStorage === 'undefined') return undefined;

    const walletName = localStorage.getItem(localStorageKey);
    if (!walletName || walletName === 'WalletConnect') return undefined;

    const chainConfig = this.config.chains[chain];
    if (!chainConfig) return undefined;

    try {
      const wallets = getWalletOptions(chainConfig);
      const wallet = wallets.find((w) => w.getName() === walletName);

      if (!wallet || !(await wallet.isReady())) {
        localStorage.removeItem(localStorageKey);
        return undefined;
      }

      await connectWalletToChain(wallet, chain);
      this.setWalletConnection(chain, type, wallet);
      return wallet;
    } catch (e) {
      console.error('Failed to connect last used wallet:', e);
      localStorage.removeItem(localStorageKey);
      return undefined;
    }
  }

  getWallet(type: TransferWallet): Wallet | undefined {
    return this.walletConnections[type]?.wallet;
  }

  swapWallets(): void {
    const sending = this.walletConnections.sending;
    const receiving = this.walletConnections.receiving;

    if (receiving?.wallet instanceof ReadOnlyWallet) {
      receiving.wallet.off('disconnect', receiving.disconnectHandler);
      this.walletConnections.receiving = undefined;
    }

    this.walletConnections.sending = receiving;
    this.walletConnections.receiving = sending;
  }

  async onWalletSelected(
    wallet: Wallet,
    chain: Chain,
    type: TransferWallet,
  ): Promise<void> {
    if (!this.pendingConnect) {
      throw new Error('No pending wallet connection');
    }

    if (
      this.pendingConnect.chain !== chain ||
      this.pendingConnect.type !== type
    ) {
      throw new Error('Wallet selection does not match pending connection');
    }

    try {
      await connectWalletToChain(wallet, chain);
      this.setWalletConnection(chain, type, wallet);
      this.pendingConnect.resolve(wallet);
    } catch (e) {
      this.pendingConnect.reject(e as Error);
      throw e;
    } finally {
      this.pendingConnect = undefined;
    }
  }

  onWalletSelectCancelled(): void {
    if (this.pendingConnect) {
      this.pendingConnect.reject(new Error('Wallet selection cancelled'));
      this.pendingConnect = undefined;
    }
  }
}
```

### Factory Function

```typescript
export function createInternalWalletProvider(
  config: InternalConfig,
): WormholeConnectWalletProvider {
  const state = new InternalWalletProviderState(config);

  return {
    isInternal: true,
    connectWallet: (chain, type, autoConnect) =>
      state.connectWallet(chain, type, autoConnect),
    getWallet: (type) => state.getWallet(type),
    swapWallets: () => state.swapWallets(),
    onWalletSelected: (wallet, chain, type) =>
      state.onWalletSelected(wallet, chain, type),
    onWalletSelectCancelled: () => state.onWalletSelectCancelled(),
  };
}

// DEPRECATED: Use createInternalWalletProvider(config) instead
// Kept for backwards compatibility during migration
export const internalWalletProvider = createInternalWalletProvider(
  // Will fail if config singleton not initialized
  // This is intentional - forces migration
  (globalThis as any).__wormholeConnectDefaultConfig,
);
```

### WalletProvider Integration

```typescript
// src/contexts/wallet/WalletProvider.tsx

import { createInternalWalletProvider } from '../../utils/wallet/InternalWalletProvider';
import { useConfig } from '../ConfigContext';

export function WalletProvider({
  children,
  externalProvider,
}: WalletProviderProps) {
  const config = useConfig();

  const walletProvider = React.useMemo(() => {
    if (externalProvider) {
      return externalProvider;
    }
    return createInternalWalletProvider(config);
  }, [externalProvider, config]);

  // ... rest of context provider
}
```

---

## Testing Strategy

### Unit Tests

1. **Instance isolation:**
   ```typescript
   test('two providers maintain separate pendingConnect state', async () => {
     const provider1 = createInternalWalletProvider(config1);
     const provider2 = createInternalWalletProvider(config2);

     // Start connection in provider1
     const promise1 = provider1.connectWallet('Ethereum', 'sending');

     // Provider2 should NOT throw "Connect wallet pending"
     const promise2 = provider2.connectWallet('Solana', 'sending');

     // Both should be pending independently
     expect(promise1).toBeInstanceOf(Promise);
     expect(promise2).toBeInstanceOf(Promise);
   });
   ```

2. **Wallet connections are isolated:**
   ```typescript
   test('connecting wallet in one provider does not affect other', () => {
     const provider1 = createInternalWalletProvider(config1);
     const provider2 = createInternalWalletProvider(config2);

     provider1.setWalletConnection('Ethereum', 'sending', mockWallet1);
     provider2.setWalletConnection('Ethereum', 'sending', mockWallet2);

     expect(provider1.getWallet('sending')).toBe(mockWallet1);
     expect(provider2.getWallet('sending')).toBe(mockWallet2);
   });
   ```

3. **localStorage uses config namespace:**
   ```typescript
   test('localStorage keys include config namespace', () => {
     const config = buildConfig({ cacheNamespace: 'my-dapp' });
     const provider = createInternalWalletProvider(config);

     provider.setWalletConnection('Ethereum', 'sending', mockWallet);

     expect(localStorage.getItem('wormhole-connect:my-dapp:wallet:Evm'))
       .toBe('MockWallet');
   });
   ```

### Integration Tests

1. **Two WormholeConnect instances connect different wallets:**
   - Instance A connects MetaMask
   - Instance B connects Phantom
   - Both show correct wallet in their UI
   - Disconnecting A doesn't affect B

2. **Auto-reconnect restores correct wallet per instance:**
   - Configure with different `cacheNamespace`
   - Connect different wallets
   - Reload page
   - Each instance restores its own wallet

### E2E Tests

1. **Concurrent wallet connections:**
   - Click "Connect" in both instances simultaneously
   - Both should open wallet picker
   - Both should connect successfully

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| External SDK singletons | High | Medium | Document limitations; ref counting for MWA |
| WalletConnect conflicts | Medium | Medium | Different projectId per instance or serialize |
| localStorage conflicts | Low | High | `cacheNamespace` already supports isolation |
| Memory leaks | Medium | Medium | Clean up on provider disposal |
| Race conditions | Medium | High | Proper async handling in class methods |

---

## Level of Effort Summary

| Phase | Description | Effort | Dependencies |
|-------|-------------|--------|--------------|
| 1 | Create State Class | 3-4 hours | None |
| 2 | Add Factory Function | 1-2 hours | Phase 1 |
| 3 | Update WalletProvider | 2-3 hours | Phase 2, Refactor #1 |
| 4 | Handle External SDKs | 4-6 hours | Phase 3 |
| 5 | Remove Singleton | 2-3 hours | Phase 4 |

**Total Estimated Effort:** 12-18 hours

---

## Success Criteria

1. [ ] Two `<WormholeConnect>` instances can connect wallets simultaneously
2. [ ] Each instance maintains its own wallet connections
3. [ ] Disconnecting in one instance doesn't affect the other
4. [ ] Auto-reconnect works per-instance with different `cacheNamespace`
5. [ ] External SDK singleton issues documented/mitigated
6. [ ] All existing tests pass
7. [ ] New multi-instance tests pass

---

## Open Questions

1. **WalletConnect parallel sessions:** Can two instances use WalletConnect simultaneously with same `projectId`? Need to test.

2. **Solana Mobile Adapter:** Should we maintain MWA registration across all instances, or scope it somehow?

3. **Wallet object reuse:** If same physical wallet (e.g., MetaMask) is connected to both instances, should they share the wallet object or have separate instances?

4. **Cleanup on unmount:** Should wallet providers disconnect all wallets when WormholeConnect unmounts? Currently wallets stay connected.

---

## External SDK Investigation Needed

Before Phase 4, investigate these packages:

1. **@wormhole-labs/wallet-aggregator-evm**
   - How does `WalletConnectWallet` handle multiple instances?
   - Is there shared state in the modal?

2. **@wormhole-labs/wallet-aggregator-aptos**
   - Does `walletCoreFactory` return singleton or fresh instance?
   - What state does `walletCore` maintain?

3. **@solana-mobile/wallet-standard-mobile**
   - What does `registerMwa()` actually register?
   - Can it be called multiple times safely?
   - What happens if called with different configs?
