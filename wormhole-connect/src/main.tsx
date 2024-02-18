import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { config } from 'config';
import { WidgetStateManagerProvider } from 'config/configStateManager';

ReactDOM.createRoot(document.getElementById('wormhole-connect')!).render(
  <React.StrictMode>
    <WidgetStateManagerProvider config={config}>
      <App />
    </WidgetStateManagerProvider>
  </React.StrictMode>,
);
