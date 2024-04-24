import './styles.css';
import React, { useEffect } from 'react';
import { useState } from 'react';
import { WormholeConnectConfig } from 'config/types';
import { compressToBase64, decompressFromBase64 } from 'lz-string';

interface Props {
  children: React.ReactElement;
  onCustomConfigChange: (config: WormholeConnectConfig | undefined) => void;
}

const MAX_URL_SIZE = 30_000; // 30kb (HTTP header limit is set to 32kb)

const parseConfig = (config: string): WormholeConnectConfig => {
  if (config) {
    try {
      return eval(
        `(function() { return ${config} })()`,
      ) as WormholeConnectConfig;
    } catch (e) {
      console.log('Failed to parse custom config: ', e, config);
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

function DemoApp(props: Props) {
  const [customConfigOpen, setCustomConfigOpen] = useState(false);
  const [customConfigInput, setCustomConfigInput] = useState(
    loadInitialConfig(),
  );

  const updateCustomConfig = (e: any) => {
    const input = e.target.value;
    setCustomConfigInput(input);
  };

  const emitCustomConfig = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, customConfigInput);
    setUrlQueryParam(customConfigInput);

    try {
      const parsed = parseConfig(customConfigInput);
      props.onCustomConfigChange(parsed);
    } catch (e) {
      console.error(e);
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
        <div id="demo-contents">{props.children}</div>

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
