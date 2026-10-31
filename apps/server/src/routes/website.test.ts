import express from 'express';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterAll, expect, it } from 'vitest';
import { createWebsiteRouter } from './website.js';

const directory = mkdtempSync(path.join(tmpdir(), 'lurelog-seo-'));
writeFileSync(
  path.join(directory, 'index.html'),
  readFileSync(new URL('../../../client/index.html', import.meta.url), 'utf8').replace(
    '<div id="root"></div>',
    '<div id="root"><!--prerendered-home--><h1>Public landing preview</h1><!--/prerendered-home--></div>',
  ),
);
writeFileSync(path.join(directory, 'asset.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
const app = express().use(createWebsiteRouter(directory, 'https://lurelog.example.test'));
afterAll(() => rmSync(directory, { recursive: true, force: true }));

it('serves crawl rules without blocking scripts, images, or pages carrying noindex', async () => {
  const response = await request(app).get('/robots.txt');
  expect(response.status).toBe(200);
  expect(response.type).toBe('text/plain');
  expect(response.text).toContain('User-agent: *\nAllow: /\n');
  expect(response.text).toContain('Disallow: /api/');
  expect(response.text).toContain('Disallow: /media/');
  expect(response.text).toContain('Sitemap: https://lurelog.example.test/sitemap.xml');
  expect(response.text).not.toMatch(/Disallow: \/(?:assets|images|login|lures|catches)/);
});

it('lists only the public canonical homepage in the XML sitemap', async () => {
  const response = await request(app).get('/sitemap.xml').set('Host', 'untrusted.example');
  expect(response.status).toBe(200);
  expect(response.type).toBe('application/xml');
  expect(response.text).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
  expect(response.text.match(/<loc>/g)).toHaveLength(1);
  expect(response.text).toContain('<loc>https://lurelog.example.test/</loc>');
  expect(response.text).not.toMatch(/untrusted|lastmod|login|lures|catches/);
});

it('serves canonical and sharing metadata in homepage HTML before JavaScript runs', async () => {
  const response = await request(app).get('/?utm_source=test').set('Host', 'untrusted.example');
  expect(response.status).toBe(200);
  expect(response.headers['x-robots-tag']).toBeUndefined();
  expect(response.text).not.toContain('name="robots" content="noindex');
  expect(response.text).toContain('<title>Fishing Journal &amp; Lure Collection | LureLog</title>');
  expect(response.text).toContain('<link rel="canonical" href="https://lurelog.example.test/"');
  expect(response.text).toContain('property="og:url" content="https://lurelog.example.test/"');
  expect(response.text).toContain(
    'property="og:image" content="https://lurelog.example.test/images/tackle-box-hero.webp"',
  );
  expect(response.text).not.toMatch(/untrusted|utm_source/);
  expect(response.text).toContain('<h1>Public landing preview</h1>');
  const schema = JSON.parse(
    response.text.match(/<script type="application\/ld\+json">(.*?)<\/script>/)![1],
  );
  expect(schema).toEqual({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'LureLog',
    url: 'https://lurelog.example.test/',
  });
});

it.each([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password?token=private-token',
  '/dashboard',
  '/profile/',
  '/lures',
  '/lures/new',
  '/lures/record',
  '/lures/record/edit',
  '/lures/record/catches/new',
  '/catches',
  '/catches/new',
  '/catches/record',
  '/catches/record/edit',
])('keeps %s out of search while retaining the SPA and its deep links', async (url) => {
  const response = await request(app).get(url);
  expect(response.status).toBe(200);
  expect(response.headers['x-robots-tag']).toBe('noindex, follow');
  expect(response.text).toContain('<meta name="robots" content="noindex, follow"');
  expect(response.text).toContain('id="root"');
  expect(response.text).not.toMatch(/rel="canonical"|private-token|Public landing preview/);
  expect(response.text).not.toContain('application/ld+json');
});

it.each(['/missing-page', '/missing-file.png', '/lures/record/unknown'])(
  'returns a real 404 for %s instead of an indexable soft 404',
  async (url) => {
    const response = await request(app).get(url);
    expect(response.status).toBe(404);
    expect(response.headers['x-robots-tag']).toBe('noindex, follow');
    expect(response.text).toContain('id="root"');
  },
);

it('redirects the duplicate index URL and prevents encoded HTML assets from being indexed', async () => {
  const response = await request(app).get('/index.html');
  expect(response.status).toBe(301);
  expect(response.headers.location).toBe('/');
  const encoded = await request(app).get('/%69ndex.html');
  expect(encoded.status).toBe(200);
  expect(encoded.headers['x-robots-tag']).toBe('noindex, follow');
});

it('continues serving crawlable static assets', async () => {
  const response = await request(app).get('/asset.svg');
  expect(response.status).toBe(200);
  expect(response.type).toBe('image/svg+xml');
  expect(response.headers['x-robots-tag']).toBeUndefined();
});
