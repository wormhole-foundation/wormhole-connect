import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import ErrorBoundary from './components/ErrorBoundary';
import { ConfigProvider } from 'config/GlobalConfig';
import { el, config } from 'config';
export * from './theme';

if (!el)
  throw new Error('must specify an anchor element with id wormhole-connect');
// Create a root with ReactDOM.createRoot
const root = ReactDOM.createRoot(el as HTMLElement);
root.render(
  <React.StrictMode>
    {/* Wrap your App component with ConfigProvider and pass the configuration */}
    <ConfigProvider config={config}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ConfigProvider>
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
