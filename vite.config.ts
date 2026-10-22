import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';

// Pages listed in sitemap.xml. Everything under PRIVATE_PATHS is an internal tool and is kept out of search engines.
const PUBLIC_PATHS = ['/', '/notre-histoire', '/ecom'];
const PRIVATE_PATHS = [
  '/api/', '/login', '/cms', '/dispatch', '/afro-digital', '/master-tracker', '/ecom/admin', '/ecom/cart',
  '/fleet', '/dashboard', '/vehicules', '/chauffeurs', '/conformite', '/flotte', '/prestataires', '/finance',
  '/budget', '/rapports', '/parametres', '/audit',
];

// Fills %SITE_URL% in index.html and emits robots.txt and sitemap.xml for the configured site URL.
function seoFiles(siteUrl: string): Plugin {
  return {
    name: 'afro-seo-files',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', siteUrl),
    generateBundle() {
      const lastmod = new Date().toISOString().slice(0, 10);
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: ['User-agent: *', 'Allow: /', ...PRIVATE_PATHS.map((p) => `Disallow: ${p}`), '', `Sitemap: ${siteUrl}/sitemap.xml`, ''].join('\n'),
      });
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...PUBLIC_PATHS.map((p) => `  <url><loc>${siteUrl}${p}</loc><lastmod>${lastmod}</lastmod></url>`),
          '</urlset>',
          '',
        ].join('\n'),
      });
    },
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const siteUrl = (env.VITE_SITE_URL || 'https://afronegoce.ma').replace(/\/+$/, '');
  return {
    plugins: [react(), tailwindcss(), seoFiles(siteUrl)],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.UPSTASH_REDIS_REST_URL': JSON.stringify(env.UPSTASH_REDIS_REST_URL),
      'process.env.UPSTASH_REDIS_REST_TOKEN': JSON.stringify(env.UPSTASH_REDIS_REST_TOKEN),
      __SITE_URL__: JSON.stringify(siteUrl),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
