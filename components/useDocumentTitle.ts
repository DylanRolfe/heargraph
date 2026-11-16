'use client';

import { useEffect } from 'react';

/**
 * Sets the browser tab title and keeps it. The framework re-applies the
 * page's static title shortly after load, so we watch <head> and put ours back.
 */
export function useDocumentTitle(title: string | null): void {
  useEffect(() => {
    if (!title) return;
    const apply = () => {
      if (document.title !== title) document.title = title;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [title]);
}
