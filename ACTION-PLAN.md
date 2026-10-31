# LureLog SEO action plan

31 October 2026. Scope: public homepage and crawl/indexing foundations. The feature branch is local; nothing below is considered deployed.

| Priority | Action                                                                     | Impact / effort            | Status                                                                   |
| -------- | -------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------ |
| 1        | Return real robots.txt and a homepage-only XML sitemap                     | High / low                 | Implemented locally                                                      |
| 1        | Add canonical, descriptive title/description, OG and Twitter previews      | High / low                 | Implemented locally                                                      |
| 1        | Keep auth/workspace pages out of search with noindex; return real 404s     | High / low                 | Implemented locally                                                      |
| 1        | Prerender the existing public landing page during the build                | High / medium              | Implemented locally; one H1 and content links verified before JavaScript |
| 2        | Add truthful WebSite JSON-LD for LureLog's site name                       | Medium / low               | Implemented and validated locally                                        |
| 2        | Review PR, merge, and verify the deployed public responses                 | High / low                 | Pending push approval and deployment                                     |
| 2        | Verify the domain in Search Console; submit /sitemap.xml; inspect homepage | High / low                 | Requires domain-owner setup                                              |
| 3        | Measure mobile Lighthouse/PSI and field Core Web Vitals                    | Potentially high / unknown | PageSpeed API rate-limited; no score available                           |
| 3        | Plan genuinely useful public product/help/guide content                    | Strategic / medium         | Needs real product information and content scope                         |
| 4        | Consider separate English/Polish URLs if international search matters      | Strategic / high           | Optional; current language choice shares a URL                           |

## Release verification

1. `/robots.txt` returns HTTP 200, `text/plain`, valid rules and the canonical sitemap URL.
2. `/sitemap.xml` returns HTTP 200 XML with only `https://lure-log.com/`.
3. Homepage source contains the public copy, one H1, canonical, sharing metadata and WebSite JSON-LD before JavaScript runs.
4. `/login` and private app URLs return noindex headers and HTML metadata, without prerendered marketing markup.
5. An unknown URL returns 404; `/index.html` redirects permanently to `/`.
6. The browser still checks the real session; registration, language switching and private-route navigation remain usable.

## Recommendations intentionally excluded

- No invented ratings, testimonials, authors, company details, keyword pages or FAQ rich-result markup.
- No padding the homepage to meet a generic 500/600-word rule. Google does not prescribe a preferred word count.
- No blanket camera=() permission policy: camera uploads are an existing product feature.
- No llms.txt or AI-crawler policy change solely to satisfy an experimental collector score.
- No guessed performance numbers, guaranteed rankings, or fabricated modification dates.

See [the full audit](FULL-AUDIT-REPORT.md) for evidence, confidence, limitations and sources.
