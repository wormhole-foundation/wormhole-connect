# WormholeConnect Migration Guide: v2.5.0 to v3.0.0

This guide covers the migration from WormholeConnect v2.5.0 to v3.0.0, focusing on the public interface changes that affect integrators.

## Summary

**Good news!** The core `<WormholeConnect />` component interface remains **fully backward compatible** between v2.5.0 and v3.0.0. Most integrators can upgrade without any code changes.

## Component Interface (No Changes Required)

The main component props remain identical:

```typescript
// ✅ Same in both v2.5.0 and v3.0.0
<WormholeConnect 
  theme={theme}    // Optional - WormholeConnectTheme
  config={config}  // Optional - WormholeConnectConfig
/>
```

### Theme Interface (No Changes)

```typescript
// ✅ Unchanged - works exactly the same
const theme: WormholeConnectTheme = {
  mode: 'light', // or 'dark'
  primary: '#ff6b35',
  secondary: '#1976d2',
  // ... all other theme properties work the same
};
```

## Configuration Enhancements (Optional)

While the core interface is unchanged, v3.0.0 adds **optional** new configuration capabilities:

### 1. Enhanced Token Filtering

```typescript
// ✅ v2.5.0 - Still works in v3.0.0
const config: WormholeConnectConfig = {
  isTokenSupportedHandler: (token) => {
    return token.symbol !== 'BLOCKED_TOKEN';
  }
};

// 🆕 v3.0.0 - New optional sourceToken parameter
const config: WormholeConnectConfig = {
  isTokenSupportedHandler: (token, sourceToken) => {
    // Can now filter destination tokens based on source token
    if (sourceToken?.symbol === 'USDC' && token.symbol === 'BANNED_PAIR') {
      return false;
    }
    return token.symbol !== 'BLOCKED_TOKEN';
  }
};
```

### 2. Route Filtering (New Feature)

```typescript
// 🆕 v3.0.0 - Optional route filtering
const config: WormholeConnectConfig = {
  filterRoutes: (routes) => {
    // Hide certain routes from users
    return routes.filter(route => route !== 'TokenBridge');
  }
};
```

## Import Changes

### Main Import (Recommended - No Changes)

```typescript
// ✅ Works the same in both versions
import WormholeConnect from '@wormhole-foundation/wormhole-connect';
```

### Detailed Imports (Minor Changes)

If you import specific types or utilities:

```typescript
// ✅ v2.5.0
import WormholeConnect, { 
  WormholeConnectConfig,
  WormholeConnectTheme,
  MAINNET,
  TESTNET 
} from '@wormhole-foundation/wormhole-connect';

// ✅ v3.0.0 - WormholeConnectConfig moved to config namespace
import WormholeConnect, { 
  config,              // 🆕 Config types now in namespace
  WormholeConnectTheme,
  MAINNET,
  TESTNET 
} from '@wormhole-foundation/wormhole-connect';

// Access config types through namespace
const myConfig: config.WormholeConnectConfig = {
  // ... your config
};
```

## Removed Exports

The following exports were removed in v3.0.0 but were likely not used by most integrators:

```typescript
// ❌ No longer exported in v3.0.0
import { 
  MayanRoute,
  MayanRouteWH, 
  MayanRouteMCTP,
  MayanRouteSWIFT,
  MayanRouteSHUTTLE,
  nttAutomaticRoute,
  nttManualRoute,
  nttRoutes,
  wormholeConnectHosted,
  HostedParameters
} from '@wormhole-foundation/wormhole-connect';
```

## New Export Variations (Optional)

v3.0.0 introduces specialized exports for different use cases:

```typescript
// Main export (recommended for most users)
import WormholeConnect from '@wormhole-foundation/wormhole-connect';

// 🆕 Specialized exports (advanced usage)

// Mayan routes
import {
  MayanRoute,
  MayanRouteWH,
  MayanRouteMCTP,
  MayanRouteSWIFT,
} from '@wormhole-foundation/wormhole-connect/mayan';

// NTT routes  
import {
  nttAutomaticRoute,
  nttExecutorRoute, 
  nttManualRoute,
  nttRoutes,
} from '@wormhole-foundation/wormhole-connect/ntt';

// Hosted functionality
import {
  wormholeConnectHosted,
  HostedParameters,
} from '@wormhole-foundation/wormhole-connect/hosted';

// Executor routes
import {
  cctpExecutorRoute,
  cctpV2StandardExecutorRoute,
  cctpV2FastExecutorRoute,
} from '@wormhole-foundation/wormhole-connect/executor';
```

## Migration Checklist

- [ ] **Basic Usage**: No changes needed - your existing `<WormholeConnect />` usage works as-is
- [ ] **Theme Configuration**: No changes needed - all theme properties work the same
- [ ] **Basic Config**: No changes needed - all existing config options work the same
- [ ] **Advanced Imports**: Update `WormholeConnectConfig` import to use `config.WormholeConnectConfig`
- [ ] **Route-specific Imports**: Remove any imports of Mayan/NTT routes if used
- [ ] **Optional Enhancements**: Consider using new `filterRoutes` or enhanced `isTokenSupportedHandler`

## Example Migration

### Before (v2.5.0)
```typescript
import WormholeConnect, { 
  WormholeConnectConfig,
  WormholeConnectTheme 
} from '@wormhole-foundation/wormhole-connect';

const theme: WormholeConnectTheme = {
  mode: 'dark',
  primary: '#ff6b35'
};

const config: WormholeConnectConfig = {
  isTokenSupportedHandler: (token) => token.symbol !== 'BLOCKED'
};

function MyApp() {
  return <WormholeConnect theme={theme} config={config} />;
}
```

### After (v3.0.0)
```typescript
import WormholeConnect, { 
  config,
  WormholeConnectTheme 
} from '@wormhole-foundation/wormhole-connect';

const theme: WormholeConnectTheme = {
  mode: 'dark',
  primary: '#ff6b35'
};

const wormholeConfig: config.WormholeConnectConfig = {
  // Enhanced with optional sourceToken parameter
  isTokenSupportedHandler: (token, sourceToken) => {
    return token.symbol !== 'BLOCKED';
  },
  // New optional route filtering
  filterRoutes: (routes) => routes.filter(r => r !== 'TokenBridge')
};

function MyApp() {
  return <WormholeConnect theme={theme} config={wormholeConfig} />;
}
```

## Support

For questions about migration or new features, please refer to the [WormholeConnect documentation](https://github.com/wormhole-foundation/wormhole-connect) or file an issue on GitHub.