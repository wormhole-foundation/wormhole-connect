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
import { NTT_TEST_CONFIG_TESTNET, NTT_TEST_CONFIG_MAINNET } from './consts';

// Using ts-ignore on these because TypeScript is confused and thinks they're unused
// (They are meant to be used by the code passed into eval() below)
/* @ts-ignore */
import { DEFAULT_ROUTES, nttRoutes } from 'routes/operator';
const MAX_URL_SIZE = 30_000; // 30kb (HTTP header limit is set to 32kb)

const parseConfig = (config: string): WormholeConnectConfig => {
  if (config) {
    try {
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
      window.ManualCCTPRoute = routes.ManualCCTPRoute;
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
  const configCached = localStorage.getItem(LOCAL_STORAGE_KEY);

  if (configQuery) {
    return decompressFromBase64(configQuery);
  } else if (configCached) {
    return configCached;
  } else {
    return '';
  }
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

const LOCAL_STORAGE_KEY = 'wormhole-connect:demo:custom-config';

function DemoApp() {
  const [customConfig, setCustomConfig] = useState<WormholeConnectConfig>();
  const [customConfigOpen, setCustomConfigOpen] = useState(false);
  const [customConfigInput, setCustomConfigInput] = useState(
    loadInitialConfig(),
  );
  const [customConfigNonce, setCustomConfigNonce] = useState(1);
  const [isLoadingCustomConfig, setIsLoadingCustomConfig] = useState(true);

  const updateCustomConfig = (e: any) => {
    const input = e.target.value;
    setCustomConfigInput(input);
  };

  const emitCustomConfig = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, customConfigInput);
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

  useEffect(emitCustomConfig, []);

  return (
    <>
      <header>
        <div>
          <h1>Wormhole Connect - demo app</h1>
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

      <article>
        <div id="demo-contents">
          {!isLoadingCustomConfig && (
            <WormholeConnect key={customConfigNonce} config={customConfig} />
          )}
        </div>

        {customConfigOpen ? (
          <div id="custom-config">
            <textarea
              onChange={updateCustomConfig}
              placeholder={'{\n  "env": "mainnet"\n}'}
              onBlur={() => {
                emitCustomConfig();
              }}
              value={customConfigInput}
            />
          </div>
        ) : undefined}
      </article>
    </>
  );
}

export default DemoApp;
