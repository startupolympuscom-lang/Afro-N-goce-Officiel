import { useEffect } from 'react';

// The public site stays zoomable; the back-office screens lock the zoom as before, so phones do not
// zoom in on every form field they focus.
export function useAppViewport() {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!meta) return;
    const previous = meta.content;
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    return () => { meta.content = previous; };
  }, []);
}
