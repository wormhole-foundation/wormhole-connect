import './styles.css';
import React, { useEffect } from 'react';
import { useState } from 'react';
import { WormholeConnectConfig } from 'config/types';

interface Props {
  onCustomConfigChange: (config: WormholeConnectConfig | undefined) => void;
}

const LOCAL_STORAGE_KEY = 'wormhole-connect:demo:custom-config';

export default function DemoAppHeader(props: Props) {
  let [customConfigOpen, setCustomConfigOpen] = useState(false);
  let [customConfigInput, setCustomConfigInput] = useState(
    localStorage.getItem(LOCAL_STORAGE_KEY) ?? '',
  );

  const updateCustomConfig = (e: any) => {
    const input = e.target.value;
    setCustomConfigInput(input);
  };

  const emitCustomConfig = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, customConfigInput);
    try {
      const parsed = eval(`(function() {
        return ${customConfigInput};
      })()`);

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
          onClick={() => {
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
            onBlur={emitCustomConfig}
            value={customConfigInput}
          />
        </div>
      ) : undefined}
    </header>
  );
}
