import React from 'react';
import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import WormholeConnect from './WormholeConnect';
import ErrorBoundary from './components/ErrorBoundary';
import DemoAppHeader from './components/DemoAppHeader';
import { WormholeConnectConfig } from 'config/types';
import { sleep } from 'utils';
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
    await sleep(10);
    console.log(config);
    setCustomConfig(config);
    setCustomConfigNonce(customConfigNonce + 1);
    await sleep(10);
    setShowConnect(true);
  };

  console.log(customConfig);

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
