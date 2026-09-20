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
├── apps/cli/        # aaigc command line client (Node)
├── data/            # Static product and tool data
├── tests/           # Unit and E2E tests
└── scripts/         # Build and quality scripts
```

## CLI (`aaigc`)

Node command-line client for the AAIGC tools and account API. It reuses the same
`shared/` layer as the web app — tool logic, types, error codes and translations are
never duplicated in the CLI.

### Commands

| Command | Description |
|---|---|
| `aaigc login` | Sign in with the device flow (no browser callback; prints a URL + user code) |
| `aaigc logout` | Revoke the server-side session, then clear local credentials |
| `aaigc tools list [--tier <t>] [--capability <c>]` | List the tools available locally |
| `aaigc tools run <toolId> --input '<json>'` | Run a tool locally |
| `aaigc favorites list [--since <iso>]` | List favorites synced from the server |
| `aaigc favorites add\|remove <toolId> [--type <t>]` | Add / remove a favorite |
| `aaigc help` | Show help (`--help`, `--version` also work) |

`tools list` and `tools run` are pure functions from `shared/tools` — they run offline and
need neither sign-in nor an API base URL. `login`, `logout` and `favorites` do need one.

### Global options

| Option | Description |
|---|---|
| `--json` | Machine-readable JSON on stdout only |
| `--lang <locale>` | `en` (default) / `zh-CN` / `zh-TW` / `ja` |
| `--color` / `--no-color` | Force / disable ANSI colors (also honours `NO_COLOR`) |
| `--api-base-url <url>` | API origin for this invocation only |
| `--config-dir <dir>` | Credential directory for this invocation only |

### Output contract

- **stdout carries data only**; diagnostics, warnings and errors go to **stderr**.
- With `--json`, stdout is exactly one parseable JSON document — no decoration, no
  progress line, no ANSI. Errors are written to stderr as
  `{"error":{"code":"…","message":"…"}}`.
- Colors, progress lines and table borders are switched off automatically when stdout is
  not a TTY.
- Table columns are padded by display width (East Asian Width), so CJK output stays aligned.

### Exit codes

| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | Business failure — API error, tool failure, not signed in |
| `2` | Usage or configuration error — bad flag, invalid `--lang`, missing API base URL |
| `130` | Interrupted (SIGINT); the in-flight progress line is cleared first |

### Credentials

Tokens are stored **outside the repository**, in the config directory:

| Platform | Location |
|---|---|
| Linux / macOS | `$XDG_CONFIG_HOME/aaigc` (falls back to `~/.config/aaigc`) |
| Windows | `%APPDATA%\aaigc` |

The directory is created with mode `0700`; `tokens.json` and `device-id` are written with
mode `0600`, atomically (temp file + rename). Access tokens are refreshed automatically.
If a refresh fails, the local credentials are cleared and the CLI tells you to log in again.

### Environment variables

CLI-only variables use the `AAIGC_CLI_*` prefix, so they can never collide with the App /
desktop variables. The single exception is `AAIGC_TELEMETRY`, a cross-platform switch shared
with the desktop client.

| Variable | Required | Purpose | If unset |
|---|---|---|---|
| `AAIGC_CLI_API_BASE_URL` | **Yes**, for network commands | Origin serving the AAIGC API | `login` / `logout` / `favorites` fail with `cliConfigMissing` (exit 2). `tools *` still work. |
| `AAIGC_CLI_CONFIG_DIR` | No | Directory holding credentials | OS default (see above) |
| `AAIGC_CLI_TOKEN_FILE` | No | Credential file name — a **plain file name** only; always resolves to `<AAIGC_CLI_CONFIG_DIR>/<name>` | `tokens.json` |
| `AAIGC_CLI_LANG` | No | Output language (`en` / `zh-CN` / `zh-TW` / `ja`) | `en` |
| `AAIGC_TELEMETRY` | No | Anonymous usage reporting; `1` / `true` / `yes` / `on` enables it | Off — telemetry is opt-in for the CLI |

There is deliberately **no non-empty fallback** for `AAIGC_CLI_API_BASE_URL`: an unconfigured
client fails loudly instead of silently pointing at a built-in domain (SK-8).

`AAIGC_CLI_TOKEN_FILE` rejects any value containing a path separator. An absolute path would
escape the `0700` directory / `0600` file protection, so the CLI refuses it rather than
"helpfully" resolving it.

> `AAIGC_CLI_TELEMETRY_ENDPOINT` is **not implemented**. Telemetry endpoints come from
> `NEXT_PUBLIC_WORKER_URL` / `NEXT_PUBLIC_FALLBACK_URL` via `shared/api/track.ts`; the CLI
> deliberately holds no endpoint of its own (SK-8). A CLI-specific endpoint would require
> adding an endpoint override to the shared `track()` first.

### Testing the device flow without a browser

`scripts/device-flow-auto-approve.mjs` approves a device code unattended, so CLI e2e runs
don't need someone watching a browser. It is **off by default** and refuses to run unless
`ALLOW_DEVICE_FLOW_AUTO_APPROVE=1` is set, and it refuses any target that is not localhost.
It drives the existing auth chain (verification code → Bearer token → approve) and does not
bypass the route's own authentication.

```bash
ALLOW_DEVICE_FLOW_AUTO_APPROVE=1 \
  node scripts/device-flow-auto-approve.mjs <userCode> --email you@example.com
```

> ⚠️ Local / CI only. Never set `ALLOW_DEVICE_FLOW_AUTO_APPROVE=1` in any deployed
> environment — it removes the human approval step of the device flow.

### Build

```bash
pnpm --filter cli build                    # bundles to apps/cli/dist/index.mjs (esbuild)
pnpm --filter cli exec -- tsc --noEmit     # type-check
```