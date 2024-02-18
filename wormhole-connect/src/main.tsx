import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { config } from 'config';
import { ConfigProvider } from 'config/GlobalConfig';

ReactDOM.createRoot(document.getElementById('wormhole-connect')!).render(
  <React.StrictMode>
    <ConfigProvider config={config}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
