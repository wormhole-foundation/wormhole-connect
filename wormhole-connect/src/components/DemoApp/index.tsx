import './styles.css';
import React, { useEffect } from 'react';
import { useState } from 'react';

import WormholeConnect from '../../WormholeConnect';
import { WormholeConnectConfig } from 'config/types';
import { compressToBase64, decompressFromBase64 } from 'lz-string';

/*
 *
 * For the purposes of the DemoApp config sandbox, we expose the same exports
 * that are available from the production @wormhole-foundation/wormhole-connect
 * library.
 *
 * These can be referenced in the same way in the DemoApp sandbox so that the
 * config works when it's copy and pasted into an actual integrator project.
 *
 * The exports are:
 * - DEFAULT_ROUTES
 * - nttRoutes
 * - AutomaticTokenBridgeRoute
 * - TokenBridgeRoute
 * - AutomaticCCTPRoute
 * - ManualCCTPRoute
 *
 * We also make the following test utilities available:
 * - nttTestRoutesMainnet
 * - nttTestRoutesTestnet
 * These just call nttRoutes() with a working config so that we can
 * easily test NTT in the DemoApp.
 *
 */
import { routes } from '@wormhole-foundation/sdk';
import {
  MayanRoute,
  MayanRouteWH,
  MayanRouteMCTP,
  MayanRouteSWIFT,
  MayanRouteSHUTTLE,
} from '@mayanfinance/wormhole-sdk-route';
import { NTT_TEST_CONFIG_TESTNET, NTT_TEST_CONFIG_MAINNET } from './consts';
import { DEFAULT_ROUTES, nttRoutes } from 'routes/operator';
import { WormholeConnectTheme } from 'theme';

const MAX_URL_SIZE = 30_000; // 30kb (HTTP header limit is set to 32kb)

const parseConfig = (config: string): WormholeConnectConfig => {
  if (config) {
    try {
      // Using ts-ignore on these because TypeScript is confused
      // (They are meant to be used by the code passed into eval() below)
      /* @ts-ignore */
      window.DEFAULT_ROUTES = DEFAULT_ROUTES;
      /* @ts-ignore */
      window.nttRoutes = nttRoutes;
      /* @ts-ignore */
      window.AutomaticTokenBridgeRoute = routes.AutomaticTokenBridgeRoute;
      /* @ts-ignore */
      window.AutomaticCCTPRoute = routes.AutomaticCCTPRoute;
      /* @ts-ignore */
      window.TokenBridgeRoute = routes.TokenBridgeRoute;
      /* @ts-ignore */
      window.CCTPRoute = routes.CCTPRoute;
      /* @ts-ignore */
      window.AutomaticPorticoRoute = routes.AutomaticPorticoRoute;
      /* @ts-ignore */
      window.MayanRoute = MayanRoute;
      /* @ts-ignore */
      window.MayanRouteWH = MayanRouteWH;
      /* @ts-ignore */
      window.MayanRouteMCTP = MayanRouteMCTP;
      /* @ts-ignore */
      window.MayanRouteSWIFT = MayanRouteSWIFT;
      /* @ts-ignore */
      window.MayanRouteSHUTTLE = MayanRouteSHUTTLE;
      /* @ts-ignore */
      window.testNttRoutesTestnet = () => nttRoutes(NTT_TEST_CONFIG_TESTNET);
      /* @ts-ignore */
      window.testNttRoutesMainnet = () => nttRoutes(NTT_TEST_CONFIG_MAINNET);

      return eval(
        `(function() { return ${config} })()`,
      ) as WormholeConnectConfig;
    } catch (e) {
      console.error('Failed to parse custom config: ', e, config);
    }
  }

  return {};
};

const loadInitialConfig = (): string => {
  const params = new URLSearchParams(window.location.search);
  const configQuery = params.get('config');
  const configCached = localStorage.getItem(LOCAL_STORAGE_KEY_CONFIG);

  if (configQuery) {
    return decompressFromBase64(configQuery);
  } else if (configCached) {
    return configCached;
  } else {
    return '';
  }
};

const parseTheme = (theme: string): WormholeConnectTheme | undefined => {
  if (theme) {
    try {
      return eval(`(function() { return ${theme} })()`) as WormholeConnectTheme;
    } catch (e) {
      console.error('Failed to parse custom config: ', e, theme);
    }
  }

  return undefined;
};

const loadInitialTheme = (): string => {
  return localStorage.getItem(LOCAL_STORAGE_KEY_THEME) || '';
};

const loadBackgroundColor = (): string => {
  return localStorage.getItem(LOCAL_STORAGE_KEY_BG) || 'black';
};

const setUrlQueryParam = (configInput: string) => {
  const url = new URL(window.location.toString());

  const compressedQuery = compressToBase64(configInput);

  if (configInput === '' || configInput.length > MAX_URL_SIZE) {
    url.searchParams.delete('config');
  } else {
    url.searchParams.set('config', compressedQuery);
  }
  history.replaceState({}, '', url.toString());
};

const LOCAL_STORAGE_KEY_BG = 'wormhole-connect:demo:custom-bg';
const LOCAL_STORAGE_KEY_CONFIG = 'wormhole-connect:demo:custom-config';
const LOCAL_STORAGE_KEY_THEME = 'wormhole-connect:demo:custom-theme';

function DemoApp() {
  const [customConfig, setCustomConfig] = useState<WormholeConnectConfig>();
  const [customConfigOpen, setCustomConfigOpen] = useState(false);
  const [customConfigInput, setCustomConfigInput] = useState(
    loadInitialConfig(),
  );
  const [customConfigNonce, setCustomConfigNonce] = useState(1);
  const [isLoadingCustomConfig, setIsLoadingCustomConfig] = useState(true);

  const [customTheme, setCustomTheme] = useState<
    WormholeConnectTheme | undefined
  >(undefined);
  const [customThemeInput, setCustomThemeInput] = useState(loadInitialTheme());

  const [backgroundColor, setBackgroundColor] = useState(loadBackgroundColor());

  const updateCustomConfig = (e: any) => {
    const input = e.target.value;
    setCustomConfigInput(input);
  };

  const emitCustomConfig = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY_CONFIG, customConfigInput);
    setUrlQueryParam(customConfigInput);

    try {
      const parsed = parseConfig(customConfigInput);
      setCustomConfig(parsed);
      setCustomConfigNonce(customConfigNonce + 1);
    } catch (e) {
      console.error(e);
    }

    if (isLoadingCustomConfig) {
      setIsLoadingCustomConfig(false);
    }
  };

  const updateCustomTheme = (e: any) => {
    const input = e.target.value;
    setCustomThemeInput(input);
  };

  const emitCustomTheme = () => {
    try {
      setCustomTheme(parseTheme(customThemeInput));
      localStorage.setItem(LOCAL_STORAGE_KEY_THEME, customThemeInput);
    } catch (e) {
      console.error(e);
    }
  };

  const updateBackgroundColor = (input: string) => {
    setBackgroundColor(input);
    console.log(input);
    localStorage.setItem(LOCAL_STORAGE_KEY_BG, input);
  };

  useEffect(emitCustomConfig, []);
  useEffect(emitCustomTheme, []);

  return (
    <main style={{ background: backgroundColor }}>
      <article>
        <div id="demo-contents">
          {!isLoadingCustomConfig && (
            <WormholeConnect
              key={customConfigNonce}
              config={customConfig}
              theme={customTheme}
            />
          )}
        </div>

        {customConfigOpen ? (
          <aside>
            <header>
              <div>
                <h1>Wormhole Connect - demo app</h1>
              </div>
            </header>

            <div id="custom-config">
              <div>
                <b>Custom Config</b>
                <textarea
                  style={{ minHeight: '400px' }}
                  onChange={updateCustomConfig}
                  placeholder={'{\n  "network": "Mainnet"\n}'}
                  onBlur={() => {
                    emitCustomConfig();
                  }}
                  value={customConfigInput}
                />
                Available exports:
                <ul className="available-properties">
                  <li>
                    <pre>DEFAULT_ROUTES</pre>
                    <i>{'RouteConstructor[]'}</i>
                  </li>
                  <li>
                    <pre>AutomaticTokenBridgeRoute</pre>
                    <i>{'RouteConstructor'}</i>
                  </li>
                  <li>
                    <pre>TokenBridgeRoute</pre>
                    <i>{'RouteConstructor'}</i>
                  </li>
                  <li>
                    <pre>AutomaticCCTPRoute</pre>
                    <i>{'RouteConstructor'}</i>
                  </li>
                  <li>
                    <pre>CCTPRoute</pre>
                    <i>{'RouteConstructor'}</i>
                  </li>
                  <li>
                    <pre>AutomaticPorticoRoute</pre>
                    <i>{'RouteConstructor'}</i>
                  </li>
                  <li>
                    <pre>MayanRoute</pre>
                    <i>{'RouteConstructor'}</i>
                  </li>
                  <li>
                    <pre>MayanRouteWH</pre>
                    <i>{'RouteConstructor'}</i>
                  </li>
                  <li>
                    <pre>MayanRouteMCTP</pre>
                    <i>{'RouteConstructor'}</i>
                  </li>
                  <li>
                    <pre>MayanRouteSWIFT</pre>
                    <i>{'RouteConstructor'}</i>
                  </li>
                  <li>
                    <pre>MayanRouteSHUTTLE</pre>
                    <i>{'RouteConstructor'}</i>
                  </li>
                  <li>
                    <pre>nttRoutes</pre>{' '}
                    <i>{'(NttRoute.Config) -> RouteConstructor[]'}</i>
                  </li>
                  <li>
                    <pre>testNttRoutesMainnet</pre>
                    <i>{'(NttRoute.Config) -> RouteConstructor[])'}</i>
                  </li>
                  <li>
                    <pre>testNttRoutesTestnet</pre>
                    <i>{'(NttRoute.Config) -> RouteConstructor[])'}</i>
                  </li>
                </ul>
              </div>
              <div>
                <hr />
                <b
                  style={{
                    background:
                      'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'inline-block',
                  }}
                >
                  Custom Theme
                </b>
                <div>
                  Background:
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => {
                      updateBackgroundColor(e.target.value);
                    }}
                  />{' '}
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => {
                      updateBackgroundColor(e.target.value);
                    }}
                  />{' '}
                  <a
                    href="#"
                    onClick={() => {
                      updateBackgroundColor('#000000');
                    }}
                  >
                    Black
                  </a>{' '}
                  <a
                    href="#"
                    onClick={() => {
                      updateBackgroundColor('#FFFFFF');
                    }}
                  >
                    White
                  </a>{' '}
                  <a
                    href="#"
                    onClick={() => {
                      updateBackgroundColor('#CCCCCC');
                    }}
                  >
                    Light Grey
                  </a>
                  <textarea
                    onChange={updateCustomTheme}
                    placeholder={'{\n  "mode": "dark"\n}'}
                    onBlur={() => {
                      emitCustomTheme();
                    }}
                    value={customThemeInput}
                  />
                  Available theme properties:
                  <ul className="available-properties">
                    <li>
                      <pre>mode</pre>
                      <i>'dark' | 'light'</i>
                    </li>
                    <li>
                      <pre>background</pre>
                      <i>string;</i>
                    </li>
                    <li>
                      <pre>input</pre>
                      <i>string;</i>
                    </li>
                    <li>
                      <pre>primary</pre>
                      <i>string;</i>
                    </li>
                    <li>
                      <pre>secondary</pre>
                      <i>string;</i>
                    </li>
                    <li>
                      <pre>text</pre>
                      <i>string;</i>
                    </li>
                    <li>
                      <pre>textSecondary</pre>
                      <i>string;</i>
                    </li>
                    <li>
                      <pre>error</pre>
                      <i>string;</i>
                    </li>
                    <li>
                      <pre>success</pre>
                      <i>string;</i>
                    </li>
                    <li>
                      <pre>font</pre>
                      <i>string;</i>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        ) : null}
      </article>

      <header>
        <div id="floating-config-button">
          <a
            href="#"
            id="custom-config-toggle"
            onClick={(e) => {
              e.preventDefault();
              setCustomConfigOpen(!customConfigOpen);
            }}
          >
            {customConfigOpen ? '▾' : '▸'} Custom config{' '}
            {customConfigInput ? (
              <span className="custom-config-bubble">●</span>
            ) : null}
          </a>
        </div>
      </header>
    </main>
  );
}

export default DemoApp;
