import React, { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { AppProviders } from './app/providers/AppProviders';

export function App() {
  return (
    <AppProviders>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-[#e2e8e8]">
            <div className="w-8 h-8 border-4 border-[#028056] border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <RouterProvider router={router} />
      </Suspense>
    </AppProviders>
  );
}

export default App;
