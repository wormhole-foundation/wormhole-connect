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
  let [showConnect, setShowConnect] = useState<boolean>(true);
  let [customConfig, setCustomConfig] = useState<
    WormholeConnectConfig | undefined
  >(undefined);
  let [customConfigNonce, setCustomConfigNonce] = useState(1);

  const updateCustomConfig = async (
    config: WormholeConnectConfig | undefined,
  ) => {
    setShowConnect(false);
    setCustomConfig(config);
    setCustomConfigNonce(customConfigNonce + 1);
    setShowConnect(true);
  };

  return (
    <>
      <DemoAppHeader
        onCustomConfigChange={async (config) => {
          updateCustomConfig(config);
        }}
      />
      {showConnect ? (
        <WormholeConnect key={customConfigNonce} config={customConfig ?? {}} />
      ) : null}
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
