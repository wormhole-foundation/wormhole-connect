import React from 'react';
import ReactDOM from 'react-dom/client';
import WormholeConnect from './WormholeConnect';
import ErrorBoundary from './components/ErrorBoundary';
import { WormholeConnectConfig } from 'config/types';
import { WormholeConnectPartialTheme } from './theme';
import { WormholeConnectEvent } from 'telemetry/types';
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

let config: WormholeConnectConfig = {
  // manualTargetAddress: true, // TODO: Remove before merge
  eventHandler: (event: WormholeConnectEvent) => {
    container.dispatchEvent(
      new CustomEvent('wormholeConnectEvent', { detail: event }),
    );
  },
};
let theme: WormholeConnectPartialTheme | undefined = undefined;

try {
  let configAttr = container.getAttribute('data-config');

  if (!configAttr) {
    // Legacy support. We'll stop looking for the "config" attribute in a future version
    configAttr = container.getAttribute('config');
    if (configAttr) {
      console.warn(
        `Wormhole Connect: please provide your custom config as a "data-config" attribute. ` +
          `Providing it as a "config" attribute won't be supported in future versions. ` +
          `\n` +
          `See the README for examples: ` +
          `https://www.npmjs.com/package/@wormhole-foundation/wormhole-connect`,
      );
    }
  }

  if (configAttr) {
    const parsedConfig = JSON.parse(configAttr);
    config = parsedConfig;

    // Handle legacy method of including theme in config JSON
    if (config?.customTheme) {
      console.warn(
        `Wormhole Connect: please provide your custom theme as a "data-theme" attribute. ` +
          `Providing it in your "config" attribute won't be supported in future versions. ` +
          `\n` +
          `See the README for examples: ` +
          `https://www.npmjs.com/package/@wormhole-foundation/wormhole-connect`,
      );
      theme = config.customTheme;
      if (config?.mode) theme.mode = config.mode;
    }
  }

  const themeAttr = container.getAttribute('data-theme');
  if (themeAttr) {
    const parsedTheme = JSON.parse(themeAttr);
    theme = parsedTheme;
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
