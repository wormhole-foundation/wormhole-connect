import React from 'react';
import ReactDOM from 'react-dom/client';
import WormholeConnect from './WormholeConnect';
import ErrorBoundary from './components/ErrorBoundary';
export * from './theme';

// This is the entry point that runs when integrators add the Connect widget
// to their websites by pasting <script> and <link> tags pointing to the
// unpkg.com hosted build.
//
// It has some logic for backwards compatibility for older integrations, but
// the official interface is now providing a DOM element with:
//
// - id: "wormhole-connect"
// - attribute "data-config" with config JSON
// - attribute "data-theme" with theme JSON

const container = document.getElementById('wormhole-connect') as HTMLElement;

if (!container) {
  throw new Error(
    'Could not find an element with id "wormhole-connect". Please add one to use the Connect widget.',
  );
}

/* @ts-ignore */
const config = window.__CONNECT_CONFIG as WormholeConnectConfig;
/* @ts-ignore */
const theme = window.__CONNECT_THEME as WormholeConnectPartialTheme;

const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <WormholeConnect config={config} theme={theme} />
    </ErrorBoundary>
  </React.StrictMode>,
);
