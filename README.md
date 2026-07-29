# AAIGC

AI-powered tools and applications. Product portal and online utility collection.

## Products

| Product | URL | Status |
|---------|-----|--------|
| CookMate | https://cookmate.aaigc.online | ✅ Live |
| AIHub | https://aihub.aaigc.online | ✅ Live |
| Short Drama | https://short-drama.aaigc.online | 🔧 WIP |
| Resume Optimizer | https://resume-optimizer.aaigc.online | 🔧 WIP |

## Online Tools

14 free online utilities — no sign-up required.

**Developer Tools:** JSON Formatter, Regex Tester, Base64 Codec, URL Encoder, JWT Decoder
**Text Tools:** Markdown Preview, Word Counter, Text Diff
**Time Tools:** Timestamp Converter, Date Calculator
**Image Tools:** QR Code Generator, Color Picker
**Converters:** YAML↔JSON, HTML Entities

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS 4
- **i18n:** next-intl v4 (zh-CN + en)
- **Build:** pnpm workspace monorepo
- **Deploy:** Vercel

## Getting Started

```bash
pnpm install
pnpm dev        # Start dev server (localhost:3000)
pnpm build      # Production build
pnpm test       # Run tests
pnpm check      # Full quality gate
```

## Project Structure

```
├── shared/          # Cross-platform types, constants, translations
├── apps/web/        # Next.js application
├── data/            # Static product and tool data
├── tests/           # Unit and E2E tests
└── scripts/         # Build and quality scripts
```