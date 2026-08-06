import type { ToolCategoryId, CategoryInfo } from '../shared/types'

export const toolCategories: CategoryInfo[] = [
  { id: 'ai', nameEn: 'AI Tools', icon: '🪄', order: 1 },
  { id: 'dev', nameEn: 'Developer Tools', icon: '💻', order: 2 },
  { id: 'text', nameEn: 'Text Tools', icon: '✍️', order: 3 },
  { id: 'security', nameEn: 'Security Tools', icon: '🛡️', order: 4 },
  { id: 'convert', nameEn: 'Converters', icon: '🔀', order: 5 },
  { id: 'image', nameEn: 'Image Tools', icon: '🖼️', order: 6 },
  { id: 'math', nameEn: 'Math Tools', icon: '🔢', order: 7 },
  { id: 'network', nameEn: 'Network Tools', icon: '📡', order: 8 },
  { id: 'time', nameEn: 'Time Tools', icon: '🕐', order: 9 },
  { id: 'other', nameEn: 'Other Tools', icon: '🧩', order: 10 },
]

export interface ToolMeta {
  id: string
  category: ToolCategoryId
  icon: string
  component: string
  createdAt: string
  npmDeps?: string[]
}

export const tools: ToolMeta[] = [
  // ─── Developer Tools ───
  { id: 'json-formatter', category: 'dev', icon: '📋', component: 'JsonFormatter', createdAt: '2026-07-18' },
  { id: 'base64', category: 'dev', icon: '🔐', component: 'Base64Codec', createdAt: '2026-07-18' },
  { id: 'url-encode', category: 'dev', icon: '🔗', component: 'UrlEncoder', createdAt: '2026-07-18' },
  { id: 'regex-tester', category: 'dev', icon: '🔍', component: 'RegexTester', createdAt: '2026-07-18' },
  { id: 'jwt-decoder', category: 'dev', icon: '🛡️', component: 'JwtDecoder', createdAt: '2026-07-18' },
  { id: 'uuid-generator', category: 'dev', icon: '🆔', component: 'UuidGenerator', createdAt: '2026-07-18' },
  { id: 'html-preview', category: 'dev', icon: '🖥️', component: 'HtmlPreview', createdAt: '2026-07-18' },
  { id: 'html-entities', category: 'dev', icon: '🔣', component: 'HtmlEntities', createdAt: '2026-07-27' },
  { id: 'css-minifier', category: 'dev', icon: '✂️', component: 'CssMinifier', createdAt: '2026-07-19' },
  { id: 'number-base', category: 'dev', icon: '🔢', component: 'NumberBaseConverter', createdAt: '2026-07-27' },
  { id: 'yaml-json', category: 'dev', icon: '🔀', component: 'YamlJsonConverter', npmDeps: ['js-yaml'], createdAt: '2026-07-27' },
  { id: 'json-to-csv', category: 'dev', icon: '📊', component: 'JsonToCsv', createdAt: '2026-07-27' },

  // ─── Text Tools ───
  { id: 'word-counter', category: 'text', icon: '📝', component: 'WordCounter', createdAt: '2026-07-18' },
  { id: 'markdown-preview', category: 'text', icon: '📄', component: 'MarkdownPreview', npmDeps: ['react-markdown'], createdAt: '2026-07-18' },
  { id: 'case-converter', category: 'text', icon: '🔤', component: 'CaseConverter', createdAt: '2026-07-18' },
  { id: 'text-diff', category: 'text', icon: '📑', component: 'TextDiff', npmDeps: ['diff'], createdAt: '2026-07-18' },
  { id: 'lorem-ipsum', category: 'text', icon: '📜', component: 'LoremIpsum', createdAt: '2026-07-18' },
  { id: 'text-to-slug', category: 'text', icon: '🏷️', component: 'TextToSlug', createdAt: '2026-07-19' },
  { id: 'list-sorter', category: 'text', icon: '📌', component: 'ListSorter', createdAt: '2026-07-19' },

  // ─── Security Tools ───
  { id: 'password-generator', category: 'security', icon: '🔑', component: 'PasswordGenerator', createdAt: '2026-07-18' },

  // ─── Image Tools ───
  { id: 'qrcode', category: 'image', icon: '📲', component: 'QrCodeGenerator', npmDeps: ['qrcode'], createdAt: '2026-07-18' },
  { id: 'color-picker', category: 'image', icon: '🎯', component: 'ColorPicker', createdAt: '2026-07-18' },
  { id: 'image-to-base64', category: 'image', icon: '🖼️', component: 'ImageToBase64', createdAt: '2026-07-18' },
  { id: 'image-converter', category: 'image', icon: '🔄', component: 'ImageConverter', createdAt: '2026-07-31' },
  { id: 'image-editor', category: 'image', icon: '✂️', component: 'ImageEditor', createdAt: '2026-07-31' },

  // ─── Math Tools ───
  { id: 'calculator', category: 'math', icon: '🧮', component: 'Calculator', createdAt: '2026-07-19' },

  // ─── Network Tools ───
  { id: 'ip-lookup', category: 'network', icon: '📍', component: 'IpLookup', createdAt: '2026-07-27' },
  { id: 'dns-lookup', category: 'network', icon: '🌐', component: 'DnsLookup', createdAt: '2026-07-27' },
  { id: 'http-status-codes', category: 'network', icon: 'ℹ️', component: 'HttpStatusCodes', createdAt: '2026-07-27' },
  { id: 'user-agent-parser', category: 'network', icon: '🖥️', component: 'UserAgentParser', createdAt: '2026-07-27' },

  // ─── Time Tools ───
  { id: 'timestamp', category: 'time', icon: '⏱️', component: 'TimestampConverter', createdAt: '2026-07-18' },
  { id: 'date-calculator', category: 'time', icon: '📅', component: 'DateCalculator', createdAt: '2026-07-18' },
  { id: 'timer', category: 'time', icon: '⌛', component: 'Timer', createdAt: '2026-07-30' },

  // ─── Other Tools ───
  { id: 'emoji-picker', category: 'other', icon: '😊', component: 'EmojiPicker', createdAt: '2026-07-27' },
  { id: 'random-generator', category: 'other', icon: '🎲', component: 'RandomGenerator', createdAt: '2026-07-27' },
  { id: 'cron-builder', category: 'other', icon: '⏳', component: 'CronBuilder', createdAt: '2026-07-27' },
  { id: 'pdf-tool', category: 'other', icon: '📄', component: 'PdfTool', npmDeps: ['pdf-lib', 'jszip'], createdAt: '2026-07-30' },
  { id: 'file-renamer', category: 'other', icon: '🏷️', component: 'FileRenamer', createdAt: '2026-07-31' },
]