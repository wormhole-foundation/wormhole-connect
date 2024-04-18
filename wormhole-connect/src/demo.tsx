import React from 'react';
import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import WormholeConnect from './WormholeConnect';
import ErrorBoundary from './components/ErrorBoundary';
import DemoAppHeader from './components/DemoAppHeader';
import { WormholeConnectConfig } from 'config/types';
export * from './theme';

// This is the demo app used for local development

function DemoApp() {
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
      <DemoAppHeader
        onCustomConfigChange={async (config) => {
          updateCustomConfig(config);
        }}
      />
      <WormholeConnect key={customConfigNonce} config={customConfig ?? {}} />
    </>
  );
}

const root = ReactDOM.createRoot(document.querySelector('main') as HTMLElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <DemoApp />
    </ErrorBoundary>
  </React.StrictMode>,
);
