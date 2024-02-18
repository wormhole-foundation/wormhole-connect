import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
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

    // Initial config setup
    updateConfig();

    // Add event listener to update config when it changes
    el.addEventListener('configChange', updateConfig);

    // Cleanup function to remove event listener
    return () => {
      el.removeEventListener('configChange', updateConfig);
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

//@ts-ignore
ReactDOM.createRoot(el as HTMLElement).render(<IndexPage />);
