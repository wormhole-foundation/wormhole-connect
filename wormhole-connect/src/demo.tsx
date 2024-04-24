import React from 'react';
import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import WormholeConnect from './WormholeConnect';
import ErrorBoundary from './components/ErrorBoundary';
import DemoApp from './components/DemoApp';
import { WormholeConnectConfig } from 'config/types';
export * from './theme';

// This is the demo app used for local development

function App() {
  const [customConfig, setCustomConfig] = useState<
    WormholeConnectConfig | undefined
  >(undefined);
  const [customConfigNonce, setCustomConfigNonce] = useState(1);

  const updateCustomConfig = async (
    config: WormholeConnectConfig | undefined,
  ) => {
    setCustomConfig(config);
    setCustomConfigNonce(customConfigNonce + 1);
  };

  return (
    <>
      <DemoApp
        onCustomConfigChange={async (config) => {
          updateCustomConfig(config);
        }}
      >
        <WormholeConnect key={customConfigNonce} config={customConfig ?? {}} />
      </DemoApp>
    </>
  );
}

const root = ReactDOM.createRoot(document.querySelector('main') as HTMLElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
