import React from 'react';
import ReactDOM from 'react-dom/client';
import ErrorBoundary from './components/ErrorBoundary';
import DemoApp from './components/DemoApp';
export * from './theme';

// This is the demo app used for local development

const root = ReactDOM.createRoot(document.querySelector('main') as HTMLElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <DemoApp />
    </ErrorBoundary>
  </React.StrictMode>,
);
