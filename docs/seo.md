# Search and sharing metadata

The homepage is LureLog's only public, indexable page. Fishing records, collections, profiles,
sign-in, registration and password recovery remain outside the search index. Authentication and
ownership checks protect private records; crawler instructions are not access controls.

The production Express server provides:

- `/robots.txt`: allows crawling the site and its assets, excludes API/media crawling, and links to the sitemap.
- `/sitemap.xml`: lists only the canonical homepage. No private record URLs or invented modification dates are included.
- Homepage HTML: a descriptive title, description, canonical link, Open Graph metadata and a sharing image.
- Other app pages: `X-Robots-Tag: noindex, follow` and an equivalent HTML meta tag. These pages are crawlable so search engines can read `noindex`.
- Unknown page URLs: HTTP 404 with the app's not-found screen and `noindex`.
- `/index.html`: a permanent redirect to `/`, avoiding a second homepage URL.

Absolute metadata and sitemap URLs come from the validated `CLIENT_ORIGIN`, never request headers.
Set it to the intended public HTTPS origin for each deployment. The Vite development server does
not serve the production SEO routes. Preview deployments should be kept out of search through
the hosting platform's indexing controls.

The landing content still renders through React. Google must render its JavaScript to read the
page content; canonical and sharing metadata are available in the initial response. English and
Polish currently share one URL and use a local language preference, so there are no separate
language URLs or `hreflang` entries.

After merging and deploying, check `/robots.txt`, `/sitemap.xml`, the homepage source and the
`X-Robots-Tag` response on `/login`. Verify the domain in Google Search Console, submit
`https://<public-origin>/sitemap.xml`, and inspect the homepage URL to request indexing.
Submission helps discovery; it does not guarantee indexing or rankings.

The router tests cover crawl rules, canonical URLs, untrusted Host headers, private pages,
deep links, assets and 404s. `npm run smoke:production` checks the built app's SEO responses
alongside authentication and production security behavior.

References: [robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro),
[noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing),
[sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap),
[JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).
