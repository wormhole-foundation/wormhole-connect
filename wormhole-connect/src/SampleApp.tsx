import React from 'react';
import ReactDOM from 'react-dom/client';
import ErrorBoundary from './components/ErrorBoundary';
import SampleApp from './components/SampleApp';

// This is the sample app used for local development

const root = ReactDOM.createRoot(document.querySelector('body') as HTMLElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <SampleApp />
    </ErrorBoundary>
  </React.StrictMode>,
);
