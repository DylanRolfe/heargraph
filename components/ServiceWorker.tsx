'use client';

import { useEffect, useState } from 'react';

/**
 * Registers the service worker (production builds only) and tells the user,
 * in text, when the app has been saved for offline use.
 */
export function OfflineStatus() {
  const [state, setState] = useState<'unknown' | 'ready' | 'unsupported'>('unknown');

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setState('unsupported');
      return;
    }
    if (process.env.NODE_ENV !== 'production') return;
    let cancelled = false;
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then(() => {
        if (!cancelled) setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('unsupported');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'ready') {
    return <p data-testid="offline-status">Saved on this device. HearGraph now works without an internet connection.</p>;
  }
  if (state === 'unsupported') {
    return <p data-testid="offline-status">Offline use is not available in this browser.</p>;
  }
  return null;
}
