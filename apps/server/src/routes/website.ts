import express from 'express';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const pages = new Set([
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/dashboard',
  '/lures',
  '/lures/new',
  '/catches',
  '/catches/new',
  '/profile',
]);

function escapeMarkup(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!;
  });
}

export function createWebsiteRouter(clientDirectory: string, siteOrigin: string) {
  const router = express.Router();
  const homepage = new URL('/', siteOrigin).href;
  const canonical = escapeMarkup(homepage);
  const image = escapeMarkup(new URL('/images/tackle-box-hero.webp', siteOrigin).href);
  const template = readFileSync(path.join(clientDirectory, 'index.html'), 'utf8');
  const homepageHtml = template.replace(
    '</head>',
    `    <link rel="canonical" href="${canonical}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${image}" />
    <meta name="twitter:image" content="${image}" />
  </head>`,
  );
  const privateHtml = template.replace(
    '</head>',
    '    <meta name="robots" content="noindex, follow" />\n  </head>',
  );

  router.get('/robots.txt', (_req, res) => {
    // Keep app pages crawlable so search engines can read their noindex headers.
    res.type('text/plain').send(
      `User-agent: *
Allow: /
Disallow: /api/
Disallow: /media/

Sitemap: ${new URL('/sitemap.xml', siteOrigin).href}
`,
    );
  });
  router.get('/sitemap.xml', (_req, res) => {
    // The landing page is currently the only public, indexable page.
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${canonical}</loc></url>
</urlset>
`);
  });
  router.get('/index.html', (_req, res) => res.redirect(301, '/'));
  router.use(
    express.static(clientDirectory, {
      index: false,
      setHeaders: (res, file) => {
        if (path.extname(file) === '.html') res.setHeader('X-Robots-Tag', 'noindex, follow');
      },
    }),
  );
  router.get('/{*path}', (req, res) => {
    const pathname = req.path.replace(/\/+$/, '') || '/';
    const knownPage =
      pages.has(pathname) ||
      /^\/lures\/[^/]+(?:\/edit|\/catches\/new)?$/.test(pathname) ||
      /^\/catches\/[^/]+(?:\/edit)?$/.test(pathname);
    const indexable = pathname === '/';
    if (!indexable) res.set('X-Robots-Tag', 'noindex, follow');
    res
      .status(knownPage ? 200 : 404)
      .set('Cache-Control', 'no-cache')
      .type('html')
      .send(indexable ? homepageHtml : privateHtml);
  });
  return router;
}
