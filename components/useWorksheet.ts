'use client';

import { useEffect, useState } from 'react';
import { getSample } from '@/lib/samples';
import { decodeWorksheet } from '@/lib/share';
import type { Worksheet } from '@/lib/types';

export type Loaded =
  | { status: 'loading' }
  | {
      status: 'ok';
      worksheet: Worksheet;
      /** Extra sentence for built-in examples. */
      context?: string;
      /** Query or hash that reproduces this worksheet on another page, e.g. "?sample=cart" or "#v1.…". */
      locator: string;
      source: 'link' | 'sample';
    }
  | { status: 'error'; message: string };

const SHARE_HASH = /^v\d+\./;

function readLocation(): Loaded {
  const hash = window.location.hash.replace(/^#/, '');
  if (SHARE_HASH.test(hash)) {
    const decoded = decodeWorksheet(hash);
    if (decoded.ok) return { status: 'ok', worksheet: decoded.worksheet, locator: `#${hash}`, source: 'link' };
    return { status: 'error', message: decoded.error };
  }
  const id = new URLSearchParams(window.location.search).get('sample') ?? 'cart';
  const sample = getSample(id);
  if (!sample) return { status: 'error', message: 'There is no built-in example with that name.' };
  return {
    status: 'ok',
    worksheet: sample.worksheet,
    context: sample.context,
    locator: `?sample=${encodeURIComponent(sample.id)}`,
    source: 'sample',
  };
}

/** Reads the worksheet named by the current URL (shared link in the hash, or ?sample=id). */
export function useWorksheetFromLocation(): Loaded {
  const [loaded, setLoaded] = useState<Loaded>({ status: 'loading' });

  useEffect(() => {
    setLoaded(readLocation());
    const onChange = () => {
      const hash = window.location.hash.replace(/^#/, '');
      // Ignore ordinary in-page anchors; only react to a new worksheet or a cleared hash.
      if (hash === '' || SHARE_HASH.test(hash)) setLoaded(readLocation());
    };
    window.addEventListener('hashchange', onChange);
    window.addEventListener('popstate', onChange);
    return () => {
      window.removeEventListener('hashchange', onChange);
      window.removeEventListener('popstate', onChange);
    };
  }, []);

  return loaded;
}
