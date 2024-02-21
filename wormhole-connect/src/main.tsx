import React from 'react';
import ReactDOM from 'react-dom/client';
import WormholeConnect from './WormholeConnect';
import ErrorBoundary from './components/ErrorBoundary';
import { IntegrationConfig } from 'config/types';
import { ExtendedTheme } from './theme';
export * from './theme';

// This file runs when integrators add the Connect widget
// to their websites using the unpkg.com method.

const container = document.getElementById('wormhole-connect') as HTMLElement;

if (!container) {
  throw new Error(
    'Could not find an element with id "wormhole-connect". Please add one to use the Connect widget.',
  );
}

let config: IntegrationConfig | undefined = undefined;
let theme: ExtendedTheme | undefined = undefined;

try {
  const configAttr = container.getAttribute('config');

  if (configAttr) {
    const parsedConfig = JSON.parse(configAttr);
    config = parsedConfig;
    if (config?.theme) theme = config.theme;
  }
} catch (e) {
  console.error(`Error parsing custom config: ${e}`);
  // Ignore
}

const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <WormholeConnect config={config} theme={theme} />
    </ErrorBoundary>
  </React.StrictMode>,
);
