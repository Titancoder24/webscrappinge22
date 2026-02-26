/**
 * main.tsx - React entry point for the DataForge side panel.
 *
 * Renders the App component into the #root DOM node.
 * Imports all global styles in the correct order.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Global styles -- order matters
import './styles/globals.css';
import './styles/animations.css';
import './styles/scrollbar.css';

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    '[DataForge] Root element #root not found. ' +
    'Ensure sidepanel.html contains <div id="root"></div>.',
  );
}

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
