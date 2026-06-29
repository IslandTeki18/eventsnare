import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { getClerkPublishableKey } from '@eventsnare/ui/web';
import { convex } from '@eventsnare/ui/web/convex';
import { App } from '@/App';
import { ToastProvider } from '@/components/ui/Toast';
import '@/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={getClerkPublishableKey()}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {/* @scaffold:providers */}
        <ToastProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ToastProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </React.StrictMode>,
);
