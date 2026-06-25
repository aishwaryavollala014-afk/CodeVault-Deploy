<div align="center">

# 🎨 CodeVault — HTML Prototype

### A clickable, static HTML/CSS/JS prototype of the whole CodeVault website.

Every screen of the product, fully navigable. Used to lock the visual design and flows before building the real Next.js app in [`../web-frontend`](../web-frontend).

</div>

---

## ▶️ How to open

Open any file in a browser (no build step). Start with **`landing.html`** and click through — every button leads to a real page.

```
open landing.html        # marketing site → login → app
```

---

## 🗺️ Pages (15)

### Public / marketing
| Page | Purpose |
|------|---------|
| `landing.html` | Marketing home — problem, solution, dashboard preview, GitHub sync, FAQ, founder story |
| `login.html` | GitHub-first sign-in (passwordless email link, no passwords) |
| `profile.html` | Public profile as a **visitor** sees it (`/u/gaurav`) |
| `privacy.html` | Privacy policy |
| `terms.html` | Terms of service |
| `contact.html` | Contact form + channels |

### App (logged-in shell with sidebar)
| Page | Purpose |
|------|---------|
| `overview.html` | Dashboard — totals, difficulty ring, heatmap, platform breakdown, topics, badges, recent submissions |
| `analytics.html` | Deep stats — monthly bars, languages, topics, Codeforces rating trend, filters |
| `repositories.html` | Synced GitHub repos — repo header, file list, commits, per-platform repo mapping |
| `public-profile.html` | Manage your public link — visibility toggles + live preview |
| `sync-status.html` | Connection health, per-platform status (incl. **session expired → Reconnect**), activity log |
| `settings.html` | Account, connected platforms, GitHub, sync prefs, notifications, appearance, danger zone |
| `notifications.html` | Notifications list, mark-all-read |
| `connect.html` | Connect-a-platform flow (pick platform → stats only / authorize sync) |
| `problem.html` | Single problem — `question.md` + `solution` + GitHub/platform links |

> 💡 Pricing/Upgrade is intentionally **not** included yet — to be added later.

---

## 🔗 Navigation map

```
landing ──▶ login ──▶ overview
                         ├─▶ analytics
                         ├─▶ repositories ──▶ problem
                         ├─▶ public-profile ──▶ profile (public view)
                         ├─▶ sync-status ──▶ connect
                         ├─▶ settings ──▶ connect
                         ├─▶ notifications        (🔔 bell)
                         └─▶ login                (logout)
landing footer ──▶ privacy · terms · contact
```

Every button is wired: 🔔 bell → notifications · Connect/Add/Reconnect → connect · Re-sync → sync-status · file rows → problem · Configure → settings#github · Open ↗ → profile · Open on GitHub → the real repo URL.

---

## 🎨 Design system

A warm, handcrafted palette that mixes platform-flavored colors — **not** a single brand color, and deliberately **no purple/blue/green theme**.

| Token | Color | Use |
|-------|-------|-----|
| Coral (primary) | `#f1543f` | buttons, links, brand, "Medium" |
| Gold / amber | `#e8a200` | accents, "Easy", badges |
| Rose / pink | `#e0457b` | accents, "Hard", highlights |
| Warm paper | `#f8f6f1` | app background |
| Ink / muted | `#1a160f` / `#6f6a5f` | text |

- **Type:** Inter (UI) + JetBrains Mono (code, numbers, URLs)
- **Heatmap:** coral intensity scale (no green contribution-graph look)
- **Icons:** one consistent inline-SVG set (no emoji)
- **Platform badges** keep their *real* brand colors (LeetCode orange, Codeforces blue, CodeChef brown, HackerRank green) — that's the "mix of platform UIs", not the theme.

---

## ♿ Built-in quality

- Responsive: sidebar collapses to a mobile drawer; landing nav becomes a hamburger menu
- Accessible: real `<button>`/`<a>` elements, `aria-label`/`aria-expanded`, visible focus rings, AA-contrast text, semantic headings
- Deterministic (seeded) heatmaps — stable across refreshes
- Self-contained: only Google Fonts is loaded externally

---

## ➡️ Next

These prototypes are the visual spec for the production app in [`../web-frontend`](../web-frontend) (Next.js + TypeScript + Tailwind). Components map 1:1 to the pages above.
