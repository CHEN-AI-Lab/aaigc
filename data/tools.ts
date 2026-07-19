import type { ToolCategoryId, CategoryInfo } from '../shared/types'

export const toolCategories: CategoryInfo[] = [
  { id: 'dev', nameEn: 'Developer Tools', icon: '🛠️', order: 1 },
  { id: 'text', nameEn: 'Text Tools', icon: '📝', order: 2 },
  { id: 'security', nameEn: 'Security Tools', icon: '🔒', order: 3 },
  { id: 'time', nameEn: 'Time Tools', icon: '⏰', order: 4 },
  { id: 'image', nameEn: 'Image Tools', icon: '🎨', order: 5 },
  { id: 'math', nameEn: 'Math Tools', icon: '🧮', order: 6 },
  { id: 'convert', nameEn: 'Converters', icon: '🔄', order: 7 },
]

export interface ToolMeta {
  id: string
  category: ToolCategoryId
  icon: string
  component: string
  npmDeps?: string[]
}

export const tools: ToolMeta[] = [
  // ─── Developer Tools ───
  { id: 'json-formatter', category: 'dev', icon: '📋', component: 'JsonFormatter' },
  { id: 'regex-tester', category: 'dev', icon: '🔍', component: 'RegexTester' },
  { id: 'base64', category: 'dev', icon: '🔐', component: 'Base64Codec' },
  { id: 'url-encode', category: 'dev', icon: '🔗', component: 'UrlEncoder' },
  { id: 'jwt-decoder', category: 'dev', icon: '🛡️', component: 'JwtDecoder' },
  { id: 'uuid-generator', category: 'dev', icon: '🆔', component: 'UuidGenerator' },
  { id: 'html-preview', category: 'dev', icon: '🌐', component: 'HtmlPreview' },
  { id: 'css-minifier', category: 'dev', icon: '🎨', component: 'CssMinifier' },

  // ─── Text Tools ───
  { id: 'markdown-preview', category: 'text', icon: '📄', component: 'MarkdownPreview', npmDeps: ['react-markdown'] },
  { id: 'word-counter', category: 'text', icon: '📊', component: 'WordCounter' },
  { id: 'text-diff', category: 'text', icon: '📑', component: 'TextDiff', npmDeps: ['diff'] },
  { id: 'case-converter', category: 'text', icon: '🔤', component: 'CaseConverter' },
  { id: 'lorem-ipsum', category: 'text', icon: '📜', component: 'LoremIpsum' },
  { id: 'text-to-slug', category: 'text', icon: '🔗', component: 'TextToSlug' },
  { id: 'list-sorter', category: 'text', icon: '📋', component: 'ListSorter' },

  // ─── Security Tools ───
  { id: 'password-generator', category: 'security', icon: '🔑', component: 'PasswordGenerator' },

  // ─── Time Tools ───
  { id: 'timestamp', category: 'time', icon: '⏱️', component: 'TimestampConverter' },
  { id: 'date-calculator', category: 'time', icon: '📅', component: 'DateCalculator' },

  // ─── Image Tools ───
  { id: 'qrcode', category: 'image', icon: '📱', component: 'QrCodeGenerator', npmDeps: ['qrcode'] },
  { id: 'color-picker', category: 'image', icon: '🎨', component: 'ColorPicker' },
  { id: 'image-to-base64', category: 'image', icon: '🖼️', component: 'ImageToBase64' },

  // ─── Math Tools ───
  { id: 'number-base', category: 'math', icon: '🔢', component: 'NumberBaseConverter' },

  // ─── Converters ───
  { id: 'yaml-json', category: 'convert', icon: '🔄', component: 'YamlJsonConverter', npmDeps: ['js-yaml'] },
  { id: 'html-entities', category: 'convert', icon: '🔣', component: 'HtmlEntities' },
  { id: 'json-to-csv', category: 'convert', icon: '📊', component: 'JsonToCsv' },
]