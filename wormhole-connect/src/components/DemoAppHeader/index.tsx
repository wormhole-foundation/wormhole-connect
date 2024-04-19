import './styles.css';
import React, { useEffect } from 'react';
import { useState } from 'react';
import { WormholeConnectConfig } from 'config/types';

interface Props {
  onCustomConfigChange: (config: WormholeConnectConfig | undefined) => void;
}

const MAX_URL_SIZE = 30_000; // 30kb (HTTP header limit is set to 32kb)

const loadInitialConfig = (): string => {
  const params = new URLSearchParams(window.location.search);
  const configQuery = params.get('config');
  const configCached = localStorage.getItem(LOCAL_STORAGE_KEY);

  const config = configQuery || configCached;

  if (config) {
    return JSON.stringify(JSON.parse(config), null, 2);
  } else {
    return '';
  }
};

const setUrlQueryParam = (configInput: string) => {
  const url = new URL(window.location.toString());

  let stringConfig = '';

  try {
    stringConfig = JSON.stringify(JSON.parse(configInput));
  } catch (e) {
    // Error parsing JSON, set URL to nothing
  }
  if (stringConfig === '' || stringConfig.length > MAX_URL_SIZE) {
    url.searchParams.delete('config');
  } else {
    url.searchParams.set('config', stringConfig);
  }
  history.replaceState({}, '', url.toString());
};

const LOCAL_STORAGE_KEY = 'wormhole-connect:demo:custom-config';

export default function DemoAppHeader(props: Props) {
  const [customConfigOpen, setCustomConfigOpen] = useState(false);
  const [customConfigInput, setCustomConfigInput] = useState(
    loadInitialConfig(),
  );

  const updateCustomConfig = (e: any) => {
    const input = e.target.value;
    setCustomConfigInput(input);
  };

  const prettifyInput = () => {
    try {
      const pretty = JSON.stringify(JSON.parse(customConfigInput), null, 2);
      setCustomConfigInput(pretty);
    } catch (e) {
      console.error(e);
    }
  };

  const emitCustomConfig = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, customConfigInput);
    setUrlQueryParam(customConfigInput);

    try {
      const parsed = JSON.parse(customConfigInput);
      props.onCustomConfigChange(parsed);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(emitCustomConfig, []);

  return (
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
      {customConfigOpen ? (
        <div id="custom-config">
          Paste in a custom config here (supports JS code)
          <textarea
            onChange={updateCustomConfig}
            onBlur={() => {
              emitCustomConfig();
              prettifyInput();
            }}
            value={customConfigInput}
          />
        </div>
      ) : undefined}
    </header>
  );
}
