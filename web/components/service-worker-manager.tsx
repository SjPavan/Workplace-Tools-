'use client';

import { useEffect } from 'react';

export default function ServiceWorkerManager() {
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return;
    }

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((error) => {
          console.error('Service worker registration failed:', error);
        });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register);
    }

    return () => {
      window.removeEventListener('load', register);
    };
  }, []);

  return null;
}
