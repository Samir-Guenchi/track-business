'use client';

import { useEffect } from 'react';

/** Tells the embedding landing page how tall the form is, so its iframe never scrolls. */
export function useFrameHeight(): void {
  useEffect(() => {
    if (window.parent === window) return;
    const post = () =>
      window.parent.postMessage(
        { type: 'trackecom:form-height', height: document.documentElement.scrollHeight },
        '*',
      );
    const observer = new ResizeObserver(post);
    observer.observe(document.body);
    post();
    return () => observer.disconnect();
  }, []);
}
