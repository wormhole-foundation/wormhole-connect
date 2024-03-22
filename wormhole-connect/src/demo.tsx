import React from 'react';
import ReactDOM from 'react-dom/client';
import WormholeConnect from './WormholeConnect';
import ErrorBoundary from './components/ErrorBoundary';
export * from './theme';

// This is the demo app used for local development

function DemoApp() {
  return <WormholeConnect config={{ env: 'testnet' }} />;
}

const root = ReactDOM.createRoot(document.querySelector('main') as HTMLElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <DemoApp />
    </ErrorBoundary>
  </React.StrictMode>,
);
