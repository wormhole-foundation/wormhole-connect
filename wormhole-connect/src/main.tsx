import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { WidgetStateManagerProvider } from 'config/configStateManager';
import { WormholeConnectConfig } from 'config/types';

// not sure how i feel about duplicating config ebe though we need
// it to be state ful in order to be able to update widget from externally
const MainPage = () => {
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

    // Add event listener to update config when it changes
    el.addEventListener('configChange', updateConfig);

    return () => {
      el.removeEventListener('configChange', updateConfig);
    };
  }, [setConfig]);

  return (
    <React.StrictMode>
      <WidgetStateManagerProvider config={config}>
        <App />
      </WidgetStateManagerProvider>
    </React.StrictMode>
  );
};

//@ts-ignore
ReactDOM.createRoot(document.getElementById('wormhole-connect')).render(
  <MainPage />,
);
