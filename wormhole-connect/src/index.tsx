import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { WidgetStateManagerProvider } from 'config/configStateManager';
import ErrorBoundary from 'components/ErrorBoundary';
import { WormholeConnectConfig } from 'config/types';

const IndexPage = () => {
  const [config, setConfig] = useState<WormholeConnectConfig>({});

  useEffect(() => {
    const el = document.getElementById('wormhole-connect');

    if (!el) {
      throw new Error(
        'must specify an anchor element with id wormhole-connect',
      );
    }

    const updateConfig = () => {
      const newConfig = JSON.parse(el.getAttribute('config') || '{}');
      setConfig(newConfig);
    };

    updateConfig();

    // Create a MutationObserver to watch for changes in the attributes of el
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'config'
        ) {
          updateConfig();
        }
      }
    });

    observer.observe(el, { attributes: true });

    return () => {
      observer.disconnect();
    };
  }, [setConfig]);

  return (
    <React.StrictMode>
      <ErrorBoundary>
        <WidgetStateManagerProvider config={config}>
          <App />
        </WidgetStateManagerProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
};

createRoot(document.getElementById('wormhole-connect')! as HTMLElement).render(
  <IndexPage />,
);
