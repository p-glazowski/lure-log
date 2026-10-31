# LureLog SEO audit

Date: 31 October 2026. Scope: **single-page** audit of https://lure-log.com/, with crawl-endpoint, redirect and utility-page spot checks. Local production responses are compared with the deployed site. Private fishing records and authenticated pages were not crawled.

## Audit summary

**Overall assessment:** confirmed technical and discovery gaps on the live site; the feature branch fixes the observed foundations and prerenders the public landing page. Changes are local and have not been deployed.

**Score: Insufficient data.** No overall numeric grade is assigned because performance/field data and Search Console evidence are unavailable. The scripts' arbitrary word-count or AI-file thresholds are not treated as Google ranking requirements.

Top live issues:

1. The initial homepage HTML has no content headings or links and depends on JavaScript rendering.
2. `/robots.txt` and `/sitemap.xml` return the app HTML instead of valid crawler resources.
3. Canonical, sharing and explicit utility-page indexing metadata are missing.

Top opportunities:

1. Ship the prepared crawler/indexing fixes and prerendered public homepage.
2. Give search engines an explicit site name and preferred homepage URL.
3. Verify the domain in Search Console, submit the sitemap, and collect performance/indexing evidence after deployment.

## Findings table

| Area                 | Severity | Confidence | Finding                                                                                 | Evidence                                                                                                                                                                                                 | Fix / status                                                                                                                                                                      |
| -------------------- | -------- | ---------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rendering            | Warning  | Confirmed  | Homepage content is absent from the live initial HTML.                                  | The live parser found zero H1s and zero links; the local built response contains one H1, ten content links and 334 words.                                                                                | Implemented locally: prerender the existing signed-out React landing page during the production build. **Fixed locally; deployment pending**                                      |
| Crawl endpoints      | Warning  | Confirmed  | Live robots.txt and sitemap.xml return HTML rather than crawler resources.              | Both URLs returned 200 text/html and began with <!doctype html>; the sitemap collector reported invalid XML. Local responses are text/plain and application/xml with one public homepage URL.            | Implemented locally: dedicated production routes with absolute URLs from CLIENT_ORIGIN. **Fixed locally; deployment pending**                                                     |
| Canonical            | Warning  | Confirmed  | The live homepage has no canonical URL.                                                 | Live parsed canonical=null. Local HTML contains https://lure-log.com/ independent of Host headers and tracking parameters.                                                                               | Implemented locally: server-provided self-referencing homepage canonical; /index.html redirects to /. **Fixed locally; deployment pending**                                       |
| Indexing policy      | Warning  | Confirmed  | Live sign-in HTML has no explicit noindex instruction.                                  | /login returned the generic SPA shell with no X-Robots-Tag; the live source has no robots meta tag. Local /login has noindex in both HTTP headers and HTML.                                              | Implemented locally: noindex on non-home app pages and API/media responses; keep app pages crawlable so the instruction can be read. **Fixed locally; deployment pending**        |
| HTTP status          | Warning  | Confirmed  | Unknown live page URLs produce a soft 404 response.                                     | /missing-page returned HTTP 200 with the SPA shell; the local response is HTTP 404 with noindex.                                                                                                         | Implemented locally: recognize app deep links and return HTTP 404 for unknown paths. **Fixed locally; deployment pending**                                                        |
| Metadata and sharing | Warning  | Confirmed  | Live search metadata is generic and sharing metadata is missing.                        | Live title is LureLog — Every lure has a story; the social collector found no OG tags or Twitter card. Local source contains a descriptive fishing-journal title and complete OG/Twitter preview fields. | Implemented locally: descriptive English/Polish document titles, description and server-provided sharing URL/image. **Fixed locally; deployment pending**                         |
| Structured data      | Info     | Confirmed  | The live homepage has no site-name structured data.                                     | Live schema=[]; the local HTML contains valid JSON-LD WebSite with name=LureLog and the canonical homepage URL.                                                                                          | Implemented locally: minimal truthful WebSite data, without ratings, fabricated reviews, private search actions or inapplicable FAQ markup. **Fixed locally; deployment pending** |
| Core Web Vitals      | Info     | Hypothesis | Mobile performance and field Core Web Vitals could not be evaluated.                    | The anonymous PageSpeed collector was rate-limited; performance_score=null and metrics={}.                                                                                                               | Run Lighthouse/PSI or review Search Console/CrUX after deployment and sufficient traffic. **Unknown**                                                                             |
| International SEO    | Info     | Confirmed  | English and Polish currently share a URL and local language preference.                 | The app switches document language, title and copy; there are no /en or /pl public routes.                                                                                                               | Do not invent hreflang URLs. Consider real language routes only as a separate product change. **Intentional current scope**                                                       |
| AI crawler files     | Info     | Confirmed  | AI-file collector results contain an SPA fallback false positive.                       | The llms collector marked 200 responses as existing files even though it found no Markdown title or sections; these URLs use the same HTML fallback.                                                     | The real 404 fix handles nonexistent resources. No llms.txt or training-crawler policy change is required for this SEO task. **Generic recommendation filtered**                  |
| Images and layout    | Pass     | Confirmed  | The public hero image has descriptive alt text, responsive WebP sources and dimensions. | The local parser found a 1280×853 image with descriptive alt text. Browser review found one H1 and no page overflow at 320, 768, 1024 and 1440px.                                                        | Preserve the existing image behavior; do not lazy-load the primary hero image. **Verified locally**                                                                               |
| HTTPS and headers    | Pass     | Confirmed  | HTTPS and baseline security headers are present.                                        | HTTP redirects to HTTPS in one hop. Live HSTS, CSP, X-Frame-Options, X-Content-Type-Options and Referrer-Policy were observed.                                                                           | Preserve protections. Do not apply a blanket camera=() policy from generic script advice because mobile camera uploads are a product feature. **Verified live**                   |

## Impact and implementation notes

### Rendering

**Impact:** Discovery and understanding depend on a later JavaScript render; this is not evidence of an indexing block.

### Crawl endpoints

**Impact:** The URLs do not currently provide usable crawl rules or sitemap discovery.

### Canonical

**Impact:** Search engines receive no explicit preferred homepage URL.

### Indexing policy

**Impact:** Utility and authentication pages can compete for search visibility. Private fishing data remains protected by authentication.

### HTTP status

**Impact:** Search engines must infer that the URL has no content.

### Metadata and sharing

**Impact:** The title communicates less about the product, and link previews lack supplied title/image information.

### Structured data

**Impact:** Google has fewer explicit signals about the preferred site name; rich results are not guaranteed.

### Core Web Vitals

**Impact:** There is no evidence to claim a performance pass, failure or improvement.

### International SEO

**Impact:** The initial public HTML is English, and separate language indexing is not provided.

### AI crawler files

**Impact:** This is not evidence of a valid llms.txt file or a search-ranking defect.

### Images and layout

**Impact:** The image is described for accessibility and its aspect ratio can be reserved. This does not establish a measured CLS score.

### HTTPS and headers

**Impact:** The public site already has transport and browser security protections.

## Prioritized action plan

1. **Quick win / high impact:** review and deploy `codex/seo-foundations`. It supplies crawl endpoints, canonical/sharing metadata, noindex on private/utility routes, real 404s and a prerendered public homepage.
2. **Quick win / high impact:** after deployment, check the live response content types, homepage source, `/login` noindex, unknown-page 404 and `/index.html` redirect.
3. **Quick win / discovery:** verify domain ownership in Google Search Console, submit `https://lure-log.com/sitemap.xml`, and inspect the homepage URL.
4. **Strategic / measured performance:** obtain PSI/Lighthouse and field data before prioritizing bundle/font/image changes.
5. **Strategic / content:** decide whether real public help, product-information or fishing-guide pages would answer user questions. Add only accurate first-hand content and genuine support/company details. No fabricated authors, reviews, ratings or keyword pages.
6. **Optional / international:** consider dedicated English and Polish URLs only if separate language discovery becomes a product goal.

## Unknowns and follow-ups

- **Core Web Vitals:** the anonymous PageSpeed API was rate-limited. No LCP, INP, CLS, performance score or speed improvement is claimed.
- **Search Console:** no account/property access was provided. Index coverage, queries, impressions, traffic, ranking and crawl statistics are unknown.
- **Deployment:** local fixes are not counted as live fixes. Verify public responses after the PR is merged and the host finishes deploying.
- **Links/readability:** the live raw-HTML collectors saw no links and six words from the document shell; this does not mean the rendered landing page has only six words. The local prerendered response contains 334 words and ten non-fragment internal links.
- **Skill freshness:** bundled rubric/quality references dated May 2026 and schema/CWV references dated February 2026 exceed the skill's 90-day freshness window. Relevant implementation decisions were checked against current Google primary documentation. Hard word-count minima, blanket camera restrictions and automatic AI-crawler blocks were not applied.
- **Python environment:** the local Python 3.9/LibreSSL build emits an urllib3 compatibility warning. Direct site fetches succeeded with certificate verification enabled. No TLS verification was disabled.
- **Scope:** external backlinks, competitor rankings and authenticated user data were not audited.

## Validation and reproducibility

- Installed [Agentic SEO Skill](https://github.com/Bhanunamikaze/Agentic-SEO-Skill) at revision `445c46c268d947fac25c4b57d38aaf723129fe62` into project-local `.agents/skills/seo`; it remains untracked.
- Ran its fetch, HTML parser, readability, robots, sitemap, llms, security-header, redirect, social-metadata, internal-link, broken-link, anonymous PageSpeed, schema-validation, reference-freshness and finding-verification tools.
- The verifier retained 12 of 12 manually reviewed findings. Its deduplication does not replace the analyst review that filtered misleading generic recommendations.
- Raw live/local evidence is saved locally under `.local/seo-audit/`; no credentials or production records were used.
- Production build and prerender step pass. All 85 frontend tests and 55 backend tests pass. Production smoke verifies built content, schema, crawl responses, noindex, 404s, redirects and authentication/security behavior.
- Lint, type checking, formatting, and responsive/browser checks pass. Browser takeover has one H1 and no page overflow at 320, 768, 1024 and 1440px. English/Polish switching and the separate noindex sign-in page were verified.

## Primary sources

- [Google: JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google: robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
- [Google: noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
- [Google: sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google: site-name structured data](https://developers.google.com/search/docs/appearance/site-names)
- [Google: helpful, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
