import type { ToolCategoryId, CategoryInfo } from '../shared/types'

export const toolCategories: CategoryInfo[] = [
  { id: 'dev', name: '开发工具', nameEn: 'Developer Tools', icon: '🛠️', order: 1 },
  { id: 'text', name: '文本工具', nameEn: 'Text Tools', icon: '📝', order: 2 },
  { id: 'security', name: '安全工具', nameEn: 'Security Tools', icon: '🔒', order: 3 },
  { id: 'time', name: '时间工具', nameEn: 'Time Tools', icon: '⏰', order: 4 },
  { id: 'image', name: '图像工具', nameEn: 'Image Tools', icon: '🎨', order: 5 },
  { id: 'math', name: '数学工具', nameEn: 'Math Tools', icon: '🧮', order: 6 },
  { id: 'convert', name: '格式转换', nameEn: 'Converters', icon: '🔄', order: 7 },
]

export interface ToolMeta {
  id: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  category: ToolCategoryId
  icon: string
  component: string
  npmDeps?: string[]
}

export const tools: ToolMeta[] = [
  // ─── Developer Tools ───
  { id: 'json-formatter', name: 'JSON 格式化', nameEn: 'JSON Formatter', description: '格式化与校验 JSON 数据', descriptionEn: 'Format and validate JSON data', category: 'dev', icon: '📋', component: 'JsonFormatter' },
  { id: 'regex-tester', name: '正则测试器', nameEn: 'Regex Tester', description: '实时测试正则表达式', descriptionEn: 'Test regular expressions in real time', category: 'dev', icon: '🔍', component: 'RegexTester' },
  { id: 'base64', name: 'Base64 编解码', nameEn: 'Base64 Codec', description: '文本与 Base64 互相转换', descriptionEn: 'Encode and decode Base64', category: 'dev', icon: '🔐', component: 'Base64Codec' },
  { id: 'url-encode', name: 'URL 编解码', nameEn: 'URL Encoder', description: 'URL 编码与解码', descriptionEn: 'Encode and decode URLs', category: 'dev', icon: '🔗', component: 'UrlEncoder' },
  { id: 'jwt-decoder', name: 'JWT 解码器', nameEn: 'JWT Decoder', description: '解析 JWT Token 的 Payload', descriptionEn: 'Decode JWT token payloads', category: 'dev', icon: '🛡️', component: 'JwtDecoder' },
  { id: 'uuid-generator', name: 'UUID 生成器', nameEn: 'UUID Generator', description: '生成 UUID v4 标识符', descriptionEn: 'Generate UUID v4 identifiers', category: 'dev', icon: '🆔', component: 'UuidGenerator' },
  { id: 'html-preview', name: 'HTML 预览', nameEn: 'HTML Preview', description: '实时渲染 HTML 代码', descriptionEn: 'Live HTML rendering', category: 'dev', icon: '🌐', component: 'HtmlPreview' },

  // ─── Text Tools ───
  { id: 'markdown-preview', name: 'Markdown 预览', nameEn: 'Markdown Preview', description: '实时渲染 Markdown 内容', descriptionEn: 'Live Markdown rendering', category: 'text', icon: '📄', component: 'MarkdownPreview', npmDeps: ['react-markdown'] },
  { id: 'word-counter', name: '字数统计', nameEn: 'Word Counter', description: '统计字符数、单词数、行数', descriptionEn: 'Count characters, words, and lines', category: 'text', icon: '📊', component: 'WordCounter' },
  { id: 'text-diff', name: '文本对比', nameEn: 'Text Diff', description: '比较两段文本的差异', descriptionEn: 'Compare differences between two texts', category: 'text', icon: '📑', component: 'TextDiff', npmDeps: ['diff'] },
  { id: 'case-converter', name: '大小写转换', nameEn: 'Case Converter', description: '文本大小写转换：大写、小写、首字母大写', descriptionEn: 'Convert text case: upper, lower, title', category: 'text', icon: '🔤', component: 'CaseConverter' },
  { id: 'lorem-ipsum', name: 'Lorem Ipsum', nameEn: 'Lorem Ipsum', description: '生成占位文本', descriptionEn: 'Generate placeholder text', category: 'text', icon: '📜', component: 'LoremIpsum' },

  // ─── Security Tools ───
  { id: 'password-generator', name: '密码生成器', nameEn: 'Password Generator', description: '生成安全随机密码', descriptionEn: 'Generate secure random passwords', category: 'security', icon: '🔑', component: 'PasswordGenerator' },

  // ─── Time Tools ───
  { id: 'timestamp', name: '时间戳转换', nameEn: 'Timestamp Converter', description: 'Unix 时间戳与日期互转', descriptionEn: 'Convert between Unix timestamps and dates', category: 'time', icon: '⏱️', component: 'TimestampConverter' },
  { id: 'date-calculator', name: '日期计算器', nameEn: 'Date Calculator', description: '日期间隔计算与日期加减', descriptionEn: 'Calculate date differences and add/subtract days', category: 'time', icon: '📅', component: 'DateCalculator' },

  // ─── Image Tools ───
  { id: 'qrcode', name: '二维码生成', nameEn: 'QR Code Generator', description: '输入文字生成二维码图片', descriptionEn: 'Generate QR codes from text', category: 'image', icon: '📱', component: 'QrCodeGenerator', npmDeps: ['qrcode'] },
  { id: 'color-picker', name: '颜色选择器', nameEn: 'Color Picker', description: '选色并生成 HEX/RGB/HSL', descriptionEn: 'Pick colors and generate HEX/RGB/HSL values', category: 'image', icon: '🎨', component: 'ColorPicker' },
  { id: 'image-to-base64', name: '图片转 Base64', nameEn: 'Image to Base64', description: '将图片文件转换为 Base64 编码', descriptionEn: 'Convert image files to Base64 encoding', category: 'image', icon: '🖼️', component: 'ImageToBase64' },

  // ─── Math Tools ───
  { id: 'number-base', name: '进制转换', nameEn: 'Number Base Converter', description: '十进制、二进制、八进制、十六进制互转', descriptionEn: 'Convert between decimal, binary, octal, hex', category: 'math', icon: '🔢', component: 'NumberBaseConverter' },

  // ─── Converters ───
  { id: 'yaml-json', name: 'YAML ↔ JSON', nameEn: 'YAML to JSON', description: 'YAML 与 JSON 格式互转', descriptionEn: 'Convert between YAML and JSON formats', category: 'convert', icon: '🔄', component: 'YamlJsonConverter', npmDeps: ['js-yaml'] },
  { id: 'html-entities', name: 'HTML 实体编码', nameEn: 'HTML Entities', description: 'HTML 特殊字符转义与反转义', descriptionEn: 'Escape and unescape HTML special characters', category: 'convert', icon: '🔣', component: 'HtmlEntities' },
]