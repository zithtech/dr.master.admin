import '@/styles/index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';

import { AppProviders } from '@/app/providers/AppProviders';
import { router } from '@/app/router';

const rootElement = document.getElementById('root');

// index.html owns this node. If it is missing, the build is broken - fail with
// a message that says so rather than a bare "null is not an object".
if (!rootElement) {
  throw new Error('Root element #root not found in index.html.');
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
