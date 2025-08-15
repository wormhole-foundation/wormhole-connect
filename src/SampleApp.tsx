import React from 'react';
import ReactDOM from 'react-dom/client';
import ErrorBoundary from './components/ErrorBoundary';
import SampleApp from './components/SampleApp';

// This is the sample app used for local development

const container = document.getElementById('root')!;
const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <SampleApp />
    </ErrorBoundary>
  </React.StrictMode>,
);
