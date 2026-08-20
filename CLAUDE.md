# AAIGC — Project Rules

## Project Overview

AI-powered tools and product portal. 38 free online utilities + 11 product showcases (CookMate, AIHub, Short Drama, Resume Optimizer, CopyCraft, ContentForge, PostForge, Maestro, AI Portfolio Studio, AI Toolbox, Content AI Site).

## Tech Stack

| Layer | Tech | Notes |
|-------|------|-------|
| Framework | Next.js 16 (App Router) | |
| Language | TypeScript strict mode | No `any` |
| Styling | Tailwind CSS 4 | Mistral warm color palette |
| i18n | next-intl v4 | 4 languages: en, zh-CN, zh-TW, ja |
| Build | pnpm workspace monorepo | |
| Test | Vitest + Playwright | Unit + E2E |
| Deploy | Vercel | Production + Preview |
| Stats | Cloudflare Worker + Upstash Redis | Phase 5, Live |

## Project Structure

```
aaigc/
├── shared/                   # Cross-platform code
│   ├── types/index.ts        # Product, Tool, ToolCategory, Locale
│   ├── constants/            # locales, WORKER_URL, categories
│   ├── messages/             # en.json, zh-CN.json, zh-TW.json, ja.json
│   ├── i18n/index.ts         # t(locale, path) loader
│   ├── utils/                # Pure utility functions
│   └── hooks/                # useVisitTracking
├── apps/web/                 # Next.js app — UI rendering only
│   └── src/
│       ├── app/[locale]/     # Pages: home, products, tools, about, stats, privacy, updates
│       └── components/       # UI components + tools/
├── data/                     # Static data: tools.ts, products.ts
├── tests/                    # Unit + E2E tests
├── scripts/                  # check.sh, translate.mjs, etc.
└── docs/                     # project-plan.md, architecture.md, worker-code.md
```

## Code Organization Rules

### shared/ —— All non-UI code
- `types/` — Type definitions (Product, Tool, ToolCategory, Locale)
- `constants/` — Constants (locales, WORKER_URL, tool categories)
- `messages/` — Translation files (en.json, zh-CN.json, zh-TW.json, ja.json)
- `i18n/` — `t(locale, path)` universal loader
- `utils/` — Pure utility functions
- `hooks/` — Cross-platform React hooks (useVisitTracking)

### apps/web/ —— UI rendering only
- `app/[locale]/` — Page routes
- `components/` — UI components
- `components/tools/` — Tool components (38 tools)
- **NO** hooks/ lib/ utils/ constants/ validators/ in apps/web/

## i18n Rules

- All user-visible strings must be in `shared/messages/` translation files
- Code must NOT contain `locale === 'en' ? 'xxx' : 'yyy'` hardcoded display text
- Default locale: `en` (English)
- 4 languages: en, zh-CN, zh-TW, ja
- Source languages: en.json and zh-CN.json are hand-written in parallel
- Other languages: generated from English via AI translation script
- Use `t(locale, path)` from `shared/i18n/index.ts` for server-side
- Use `useTranslations('namespace')` from next-intl for client components

## Git Rules

- All development on `preview` branch
- `main` branch only receives PR merges
- No direct commits to main
- No manual `vercel --prod`
- Push to preview → Vercel Preview environment
- PR merge → Vercel Production environment

## Design System

Mistral warm color palette:
- `--color-bg`: #fffaeb (warm ivory)
- `--color-surface`: #fff0c2 (cream)
- `--color-accent`: #fa520f (amber orange)
- `--color-accent-light`: #ffa110 (warm amber)
- `--color-text`: #1f1f1f (warm black)
- `--color-text-secondary`: #767d88 (muted gray)

## Quality Gate

Pre-commit: `pnpm test` + structure check
Check.sh: TypeScript compile + Lint + Test + Build + Structure + Translations
CI: Structure check + Lint + Test + Build

## Deployment

- 1 GitHub repo = 1 Vercel project
- preview branch → Preview env (auto-deploy)
- main branch → Production env (via PR merge)
- Rollback: `vercel rollback` (Hobby) or dashboard (Pro)

## Stats Architecture

Cloudflare Worker (stats gateway) → Upstash Redis (counters, rankings, online)
- Worker URL: https://stats.aaigc.workers.dev (deployed)
- All projects share 1 Worker + 1 Redis instance, key prefix `{project}:`
- Stats requests go to Worker, not Vercel (save function invocations)