import { useEffect } from 'react';

// Public origin of the website, set with VITE_SITE_URL at build time (see vite.config.ts).
export const SITE_URL = __SITE_URL__;
export const SITE_NAME = 'AFRO Négoce';

// Keep in sync with the static defaults in index.html (what crawlers see before JavaScript runs).
export const HOME_TITLE = 'AFRO Négoce | Distributeur de gaz Butagaz & Air Liquide au Maroc';
export const HOME_DESCRIPTION =
  'Distributeur de gaz à Meknès : bouteilles Butagaz, gaz industriels Air Liquide, réseaux de gaz et panneaux solaires (étude, fourniture, installation) partout au Maroc.';

interface PageMeta {
  title: string;
  description?: string;
  /** Path of the page's canonical URL (e.g. "/"). Leave empty for pages that should not declare one. */
  canonicalPath?: string;
}

// Sets one attribute of a <head> tag, creating the tag if needed. Returns a function restoring the previous state.
function setHeadAttribute(selector: string, create: () => HTMLElement, attribute: string, value: string) {
  let element = document.head.querySelector<HTMLElement>(selector);
  const created = !element;
  if (!element) {
    element = create();
    document.head.appendChild(element);
  }
  const previous = element.getAttribute(attribute);
  element.setAttribute(attribute, value);

  return () => {
    if (created) element.remove();
    else if (previous !== null) element.setAttribute(attribute, previous);
  };
}

export function usePageMeta({ title, description, canonicalPath }: PageMeta) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    const restores = [() => { document.title = previousTitle; }];

    if (description) {
      restores.push(setHeadAttribute(
        'meta[name="description"]',
        () => Object.assign(document.createElement('meta'), { name: 'description' }),
        'content',
        description,
      ));
    }
    if (canonicalPath) {
      restores.push(setHeadAttribute(
        'link[rel="canonical"]',
        () => Object.assign(document.createElement('link'), { rel: 'canonical' }),
        'href',
        `${SITE_URL}${canonicalPath}`,
      ));
    }

    return () => restores.forEach((restore) => restore());
  }, [title, description, canonicalPath]);
}
