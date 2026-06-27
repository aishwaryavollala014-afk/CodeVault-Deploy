# 🗺️ sitemap.xml

> Helps search engines discover CodeVault's public pages, especially shareable public profiles.

| Field | Detail |
|-------|--------|
| **Overview** | An XML sitemap listing indexable URLs (marketing, legal, public profiles). |
| **Purpose** | Improve crawl coverage + SEO for public content. |
| **Category** | ⭐ Strongly Recommended Before Launch |
| **Why it is needed** | Public profiles (`/u/:username`) are a growth lever; sitemaps speed indexing. |
| **Legally required?** | No. |
| **Technically required?** | No. |
| **When to implement** | Before / soon after launch. |
| **Priority** | 🟢 Low effort |
| **Estimated Cost** | $0. |
| **Renewal** | Auto-regenerate; resubmit on major changes. |
| **Official Website** | https://www.sitemaps.org |
| **Eligibility** | N/A. |

## Step-by-Step Process
1. Generate `/sitemap.xml` via Next.js `app/sitemap.ts` (static URLs) + dynamic public-profile entries.
2. Reference it in `robots.txt`.
3. Submit to Google Search Console + Bing Webmaster Tools.

## Required Documents
- None.

## Implementation Guide
- Static pages always; public profiles can be a dynamic/segmented sitemap (and an index sitemap when large).
- Exclude authed/app routes.

## Best Practices
- Keep `<lastmod>` accurate; split into multiple sitemaps past 50k URLs; use an index.

## Common Mistakes
- Listing private/authed URLs; stale `lastmod`; oversized single sitemap.

## CodeVault-specific Notes
- Only list profiles with `publicProfileEnabled = true`; regenerate as users opt in/out (respect the privacy toggle).

## Future Considerations
- Sitemap index + segmentation as public profiles scale to millions.

## Checklist
- [ ] `/sitemap.xml` generated
- [ ] Only public + opted-in URLs
- [ ] Referenced in robots.txt
- [ ] Submitted to Search Console/Bing

## References
- [ROBOTS_TXT.md](ROBOTS_TXT.md) · [../docs/FRONTEND_PLAN.md](../docs/FRONTEND_PLAN.md)
- sitemaps.org
