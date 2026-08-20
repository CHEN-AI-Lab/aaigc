# AAIGC

AI-powered tools and applications. Product portal and online utility collection.

## Products

| Product | URL | Status |
|---------|-----|--------|
| CookMate | https://cookmate.aaigc.online | ✅ Live |
| AIHub | https://aihub.aaigc.online | 🔧 WIP |
| Short Drama | — | 🔧 WIP |
| Resume Optimizer | — | 🔧 WIP |
| CopyCraft | — | 🔧 WIP |
| ContentForge | — | 🔧 WIP |
| PostForge | — | 🔧 WIP |
| Maestro | — | 🔧 WIP |
| AI Portfolio Studio | — | 🔧 WIP |
| AI Toolbox | — | 🔧 WIP |
| Content AI Site | — | 🔧 WIP |

## Online Tools

38 free online utilities — no sign-up required.

**Developer Tools:** JSON Formatter, Regex Tester, Base64 Codec, URL Encoder, JWT Decoder, UUID Generator, HTML Preview, HTML Entities, CSS Minifier, Number Base Converter, YAML↔JSON, JSON→CSV
**Text Tools:** Markdown Preview, Word Counter, Text Diff, Case Converter, Lorem Ipsum Generator, Text to Slug, List Sorter
**Security:** Password Generator
**Image Tools:** QR Code Generator, Color Picker, Image to Base64, Image Converter, Image Editor
**Math:** Calculator
**Network:** IP Lookup, DNS Lookup, HTTP Status Codes, User-Agent Parser
**Time:** Timestamp Converter, Date Calculator, Timer
**Other:** Emoji Picker, Random Generator, Cron Builder, PDF Tool, File Renamer

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS 4
- **i18n:** next-intl v4 (en, zh-CN, zh-TW, ja)
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