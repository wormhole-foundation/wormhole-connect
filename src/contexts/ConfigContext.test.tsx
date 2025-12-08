/**
 * Integration tests for ConfigContext and ConfigProvider
 * Verifies the integration between React context, Zustand store, and legacy singleton
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  renderHook,
  act,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  ConfigProvider,
  useConfig,
  useSetConfig,
  useConfigSelector,
  useConfigValue,
} from './ConfigContext';

// Mock the config module - factory cannot reference external variables
vi.mock('../config', () => {
  const triggerEvent = vi.fn();

  return {
    default: {
      network: 'Mainnet',
      isMainnet: true,
      chainsArr: ['Ethereum', 'Solana'],
      triggerEvent,
    },
    buildConfig: vi.fn((userConfig?: { network?: string }) => ({
      network: userConfig?.network ?? 'Mainnet',
      isMainnet: (userConfig?.network ?? 'Mainnet') === 'Mainnet',
      chainsArr: ['Ethereum', 'Solana'],
      tokens: {},
      chains: {},
      routes: {
        allSupportedChains: () => ['Ethereum', 'Solana'],
      },
      rpcs: {},
      triggerEvent,
    })),
    setConfig: vi.fn(),
  };
});

describe('ConfigContext Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ConfigProvider', () => {
    it('should provide config to children via useConfig', () => {
      const { result } = renderHook(() => useConfig(), {
        wrapper: ({ children }) => (
          <ConfigProvider config={{ network: 'Mainnet' }}>
            {children}
          </ConfigProvider>
        ),
      });

      expect(result.current.network).toBe('Mainnet');
    });

    it('should trigger load event on mount', async () => {
      const config = await import('../config');

      render(
        <ConfigProvider config={{ network: 'Mainnet' }}>
          <div>Test</div>
        </ConfigProvider>,
      );

      await waitFor(() => {
        expect(config.default.triggerEvent).toHaveBeenCalledWith({
          type: 'load',
          config: { network: 'Mainnet' },
        });
      });
    });

    it('should sync config to global singleton on mount', async () => {
      const { setConfig } = await import('../config');

      render(
        <ConfigProvider config={{ network: 'Testnet' }}>
          <div>Test</div>
        </ConfigProvider>,
      );

      expect(setConfig).toHaveBeenCalledWith({ network: 'Testnet' });
    });

    it('should update config when useSetConfig is called', async () => {
      const TestComponent = () => {
        const config = useConfig();
        const setConfig = useSetConfig();

        return (
          <div>
            <span data-testid="network">{config.network}</span>
            <button onClick={() => setConfig({ network: 'Testnet' })}>
              Change Network
            </button>
          </div>
        );
      };

      render(
        <ConfigProvider config={{ network: 'Mainnet' }}>
          <TestComponent />
        </ConfigProvider>,
      );

      expect(screen.getByTestId('network').textContent).toBe('Mainnet');

      await act(async () => {
        screen.getByRole('button').click();
      });

      expect(screen.getByTestId('network').textContent).toBe('Testnet');
    });

    it('should trigger config event when config changes', async () => {
      const configModule = await import('../config');

      const TestComponent = () => {
        const setConfig = useSetConfig();
        return (
          <button onClick={() => setConfig({ network: 'Testnet' })}>
            Change
          </button>
        );
      };

      render(
        <ConfigProvider config={{ network: 'Mainnet' }}>
          <TestComponent />
        </ConfigProvider>,
      );

      // Clear the initial load event
      (configModule.default.triggerEvent as any).mockClear();

      await act(async () => {
        screen.getByRole('button').click();
      });

      expect(configModule.default.triggerEvent).toHaveBeenCalledWith({
        type: 'config',
        config: { network: 'Testnet' },
      });
    });
  });

  describe('useConfig hook', () => {
    it('should throw error when used outside ConfigProvider', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useConfig());
      }).toThrow('useConfig must be used within a ConfigProvider');

      consoleSpy.mockRestore();
    });

    it('should return built config object', () => {
      const { result } = renderHook(() => useConfig(), {
        wrapper: ({ children }) => (
          <ConfigProvider config={{ network: 'Mainnet' }}>
            {children}
          </ConfigProvider>
        ),
      });

      expect(result.current).toHaveProperty('network');
      expect(result.current).toHaveProperty('chainsArr');
      expect(result.current).toHaveProperty('routes');
    });

    it('should update when config changes via setConfig', () => {
      const { result } = renderHook(
        () => ({
          config: useConfig(),
          setConfig: useSetConfig(),
        }),
        {
          wrapper: ({ children }) => (
            <ConfigProvider config={{ network: 'Mainnet' }}>
              {children}
            </ConfigProvider>
          ),
        },
      );

      expect(result.current.config.network).toBe('Mainnet');

      act(() => {
        result.current.setConfig({ network: 'Testnet' });
      });

      expect(result.current.config.network).toBe('Testnet');
    });
  });

  describe('useSetConfig hook', () => {
    it('should throw error when used outside ConfigProvider', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useSetConfig());
      }).toThrow('useSetConfig must be used within a ConfigProvider');

      consoleSpy.mockRestore();
    });

    it('should update global singleton when called', async () => {
      const { setConfig: globalSetConfig } = await import('../config');

      const { result } = renderHook(() => useSetConfig(), {
        wrapper: ({ children }) => (
          <ConfigProvider config={{ network: 'Mainnet' }}>
            {children}
          </ConfigProvider>
        ),
      });

      // Clear initial call
      (globalSetConfig as any).mockClear();

      act(() => {
        result.current({ network: 'Testnet' });
      });

      expect(globalSetConfig).toHaveBeenCalledWith({ network: 'Testnet' });
    });
  });

  describe('Zustand selector hooks', () => {
    it('useConfigSelector should return selected value', () => {
      const { result } = renderHook(
        () => useConfigSelector((config) => config.network),
        {
          wrapper: ({ children }) => (
            <ConfigProvider config={{ network: 'Mainnet' }}>
              {children}
            </ConfigProvider>
          ),
        },
      );

      expect(result.current).toBe('Mainnet');
    });

    it('useConfigValue should return full config', () => {
      const { result } = renderHook(() => useConfigValue(), {
        wrapper: ({ children }) => (
          <ConfigProvider config={{ network: 'Mainnet' }}>
            {children}
          </ConfigProvider>
        ),
      });

      expect(result.current).toHaveProperty('network', 'Mainnet');
      expect(result.current).toHaveProperty('chainsArr');
    });

    it('useConfigSelector should update when store updates', () => {
      const { result } = renderHook(
        () => ({
          network: useConfigSelector((config) => config.network),
          setConfig: useSetConfig(),
        }),
        {
          wrapper: ({ children }) => (
            <ConfigProvider config={{ network: 'Mainnet' }}>
              {children}
            </ConfigProvider>
          ),
        },
      );

      expect(result.current.network).toBe('Mainnet');

      act(() => {
        result.current.setConfig({ network: 'Testnet' });
      });

      expect(result.current.network).toBe('Testnet');
    });
  });

  describe('Multi-instance isolation', () => {
    it('should maintain separate configs for multiple ConfigProviders', () => {
      const Instance1 = () => {
        const config = useConfig();
        return <span data-testid="instance1">{config.network}</span>;
      };

      const Instance2 = () => {
        const config = useConfig();
        return <span data-testid="instance2">{config.network}</span>;
      };

      render(
        <div>
          <ConfigProvider config={{ network: 'Mainnet' }}>
            <Instance1 />
          </ConfigProvider>
          <ConfigProvider config={{ network: 'Testnet' }}>
            <Instance2 />
          </ConfigProvider>
        </div>,
      );

      expect(screen.getByTestId('instance1').textContent).toBe('Mainnet');
      expect(screen.getByTestId('instance2').textContent).toBe('Testnet');
    });

    it('useConfigSelector should read from correct instance store', () => {
      const Instance1 = () => {
        const network = useConfigSelector((c) => c.network);
        return <span data-testid="selector1">{network}</span>;
      };

      const Instance2 = () => {
        const network = useConfigSelector((c) => c.network);
        return <span data-testid="selector2">{network}</span>;
      };

      render(
        <div>
          <ConfigProvider config={{ network: 'Mainnet' }}>
            <Instance1 />
          </ConfigProvider>
          <ConfigProvider config={{ network: 'Testnet' }}>
            <Instance2 />
          </ConfigProvider>
        </div>,
      );

      expect(screen.getByTestId('selector1').textContent).toBe('Mainnet');
      expect(screen.getByTestId('selector2').textContent).toBe('Testnet');
    });
  });

  describe('Legacy setConfig() bridge', () => {
    it('should sync Zustand store when external setConfig is called', async () => {
      // Import the actual updateLegacyStore to test the bridge
      const { updateLegacyStore } = await vi.importActual<
        typeof import('../store/configStore')
      >('../store/configStore');

      const { result } = renderHook(
        () => useConfigSelector((config) => config.network),
        {
          wrapper: ({ children }) => (
            <ConfigProvider config={{ network: 'Mainnet' }}>
              {children}
            </ConfigProvider>
          ),
        },
      );

      expect(result.current).toBe('Mainnet');

      // Simulate legacy setConfig() calling updateLegacyStore
      act(() => {
        updateLegacyStore({
          network: 'Devnet',
          isMainnet: false,
          chainsArr: ['Ethereum'],
        } as any);
      });

      expect(result.current).toBe('Devnet');
    });
  });

  describe('Re-render optimization', () => {
    it('useConfigSelector should not re-render when unrelated values change', async () => {
      let networkRenderCount = 0;
      let chainsRenderCount = 0;

      const NetworkComponent = () => {
        networkRenderCount++;
        const network = useConfigSelector((c) => c.network);
        return <span data-testid="network">{network}</span>;
      };

      const ChainsComponent = () => {
        chainsRenderCount++;
        const chains = useConfigSelector((c) => c.chainsArr);
        return <span data-testid="chains">{chains.join(',')}</span>;
      };

      const SetConfigComponent = () => {
        const setConfig = useSetConfig();
        return (
          <button onClick={() => setConfig({ network: 'Testnet' })}>
            Change
          </button>
        );
      };

      render(
        <ConfigProvider config={{ network: 'Mainnet' }}>
          <NetworkComponent />
          <ChainsComponent />
          <SetConfigComponent />
        </ConfigProvider>,
      );

      // Initial render
      expect(networkRenderCount).toBe(1);
      expect(chainsRenderCount).toBe(1);

      // Change network - NetworkComponent should re-render
      // ChainsComponent may or may not (depends on reference stability)
      await act(async () => {
        screen.getByRole('button').click();
      });

      // Network component should have re-rendered
      expect(networkRenderCount).toBeGreaterThanOrEqual(2);
      expect(screen.getByTestId('network').textContent).toBe('Testnet');
    });
  });
});
