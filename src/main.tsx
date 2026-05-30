import React from 'react';
import { createRoot } from 'react-dom/client';
import { HandFlow } from './HandFlow';

const container = document.getElementById('root');
if (!container) {
  throw new Error('handflow-3d: #root element missing from index.html');
}

createRoot(container).render(
  <React.StrictMode>
    <HandFlow />
  </React.StrictMode>
);
