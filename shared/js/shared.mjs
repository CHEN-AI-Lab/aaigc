var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// shared/tools/context.ts
function defaultRandomBytes(length) {
  const bytes = new Uint8Array(length);
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.getRandomValues === "function") {
    cryptoObj.getRandomValues(bytes);
    return bytes;
  }
  throw new Error("No secure random source available for ToolContext.randomBytes");
}
function createToolContext(overrides = {}) {
  return {
    locale: overrides.locale ?? "en",
    timezone: overrides.timezone ?? "UTC",
    now: overrides.now ?? (() => Date.now()),
    randomBytes: overrides.randomBytes ?? defaultRandomBytes,
    signal: overrides.signal
  };
}

// shared/tools/common.ts
function toolOk(data) {
  return { ok: true, data };
}
function toolFail(code, messageKey, params, detail) {
  const error = params ? { code, messageKey, params } : { code, messageKey };
  if (detail !== void 0 && detail.length > 0) error.detail = detail;
  return { ok: false, error };
}
function errorDetail(caught) {
  if (caught instanceof Error) return caught.message;
  return typeof caught === "string" ? caught : "";
}
function readString(raw, name) {
  const value = raw[name];
  if (typeof value !== "string") return null;
  return value;
}
function requireString(raw, name, messageKey) {
  const value = readString(raw, name);
  if (value === null || value.trim().length === 0) {
    return { ok: false, error: { code: "emptyInput", messageKey } };
  }
  return { ok: true, value };
}
function readInt(raw, name, fallback) {
  const value = raw[name];
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}
function readBool(raw, name, fallback) {
  const value = raw[name];
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  if (typeof value === "number") return value !== 0;
  return fallback;
}
function readEnum(raw, name, allowed, fallback) {
  const value = raw[name];
  if (typeof value === "string" && allowed.includes(value)) {
    return value;
  }
  return fallback;
}
function clampInt(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}
var RANDOM_CHUNK_SIZE = 256;
var RandomSource = class {
  constructor(ctx) {
    __publicField(this, "ctx", ctx);
    __publicField(this, "buffer", new Uint8Array(0));
    __publicField(this, "offset", 0);
  }
  /** 下一个字节（0–255） */
  byte() {
    if (this.offset >= this.buffer.length) {
      this.buffer = this.ctx.randomBytes(RANDOM_CHUNK_SIZE);
      this.offset = 0;
    }
    return this.buffer[this.offset++];
  }
  /** 下一个 uint32 */
  uint32() {
    return (this.byte() << 24 | this.byte() << 16 | this.byte() << 8 | this.byte()) >>> 0;
  }
  /** [0, bound) 内的均匀整数（拒绝采样，避免取模偏置） */
  below(bound) {
    if (bound <= 0) return 0;
    if (bound === 1) return 0;
    const limit = Math.floor(4294967295 / bound) * bound;
    for (let attempt = 0; attempt < 64; attempt++) {
      const value = this.uint32();
      if (value < limit) return value % bound;
    }
    return this.uint32() % bound;
  }
  /** [min, max] 闭区间内的整数 */
  range(min, max) {
    if (max <= min) return min;
    return min + this.below(max - min + 1);
  }
  /** 从数组中均匀取一个元素 */
  pick(items) {
    return items[this.below(items.length)];
  }
  /** Fisher–Yates 洗牌（原地） */
  shuffle(items) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = this.below(i + 1);
      const tmp = items[i];
      items[i] = items[j];
      items[j] = tmp;
    }
    return items;
  }
};
var B64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var B64_LOOKUP = (() => {
  const table = {};
  for (let i = 0; i < B64_ALPHABET.length; i++) table[B64_ALPHABET[i]] = i;
  return table;
})();
function utf8Bytes(text) {
  const encoder = new TextEncoder();
  return encoder.encode(text);
}
function utf8Text(bytes) {
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}
function bytesToBase64(bytes) {
  let out = "";
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = bytes[i] << 16 | bytes[i + 1] << 8 | bytes[i + 2];
    out += B64_ALPHABET[n >> 18 & 63];
    out += B64_ALPHABET[n >> 12 & 63];
    out += B64_ALPHABET[n >> 6 & 63];
    out += B64_ALPHABET[n & 63];
  }
  const rest = bytes.length - i;
  if (rest === 1) {
    const n = bytes[i] << 16;
    out += B64_ALPHABET[n >> 18 & 63];
    out += B64_ALPHABET[n >> 12 & 63];
    out += "==";
  } else if (rest === 2) {
    const n = bytes[i] << 16 | bytes[i + 1] << 8;
    out += B64_ALPHABET[n >> 18 & 63];
    out += B64_ALPHABET[n >> 12 & 63];
    out += B64_ALPHABET[n >> 6 & 63];
    out += "=";
  }
  return out;
}
function textToBase64(text) {
  return bytesToBase64(utf8Bytes(text));
}
function base64ToBytes(input) {
  const clean = input.replace(/[\s=]/g, "");
  if (clean.length === 0) return new Uint8Array(0);
  if (clean.length % 4 === 1) return null;
  for (const char of clean) {
    if (B64_LOOKUP[char] === void 0) return null;
  }
  const outLength = Math.floor(clean.length * 3 / 4);
  const out = new Uint8Array(outLength);
  let pos = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const chunk = clean.slice(i, i + 4);
    let acc = 0;
    for (let j = 0; j < 4; j++) {
      acc = acc << 6 | (B64_LOOKUP[chunk[j]] ?? 0);
    }
    const bytes = [acc >> 16 & 255, acc >> 8 & 255, acc & 255];
    for (let j = 0; j < bytes.length && pos < outLength; j++) {
      out[pos++] = bytes[j];
    }
  }
  return out;
}
function base64ToText(input) {
  const bytes = base64ToBytes(input);
  if (bytes === null) return null;
  return utf8Text(bytes);
}
function padNumber(value, length) {
  return String(value).padStart(length, "0");
}
function upperCaseAscii(text) {
  return text.replace(/[a-z]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 32));
}
function lowerCaseAscii(text) {
  return text.replace(/[A-Z]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 32));
}

// shared/types/tool.ts
var TOOL_IDS = [
  "json-formatter",
  "base64",
  "url-encode",
  "regex-tester",
  "jwt-decoder",
  "uuid-generator",
  "html-preview",
  "html-entities",
  "css-minifier",
  "number-base",
  "yaml-json",
  "json-to-csv",
  "word-counter",
  "markdown-preview",
  "case-converter",
  "text-diff",
  "lorem-ipsum",
  "text-to-slug",
  "list-sorter",
  "password-generator",
  "qrcode",
  "color-picker",
  "image-to-base64",
  "image-converter",
  "image-editor",
  "calculator",
  "ip-lookup",
  "dns-lookup",
  "http-status-codes",
  "user-agent-parser",
  "timestamp",
  "date-calculator",
  "timer",
  "emoji-picker",
  "random-generator",
  "cron-builder",
  "pdf-tool",
  "file-renamer"
];

// shared/tools/json-formatter.ts
var MODES = ["format", "minify", "validate"];
function parseJsonFormatter(raw, _ctx) {
  const text = readString(raw, "text");
  if (text === null || text.trim().length === 0) {
    return toolFail("emptyInput", "tools.emptyInput");
  }
  return toolOk({
    text,
    mode: readEnum(raw, "mode", MODES, "format"),
    indent: clampInt(readInt(raw, "indent", 2), 1, 8)
  });
}
function runJsonFormatter(input, _ctx) {
  let parsed;
  try {
    parsed = JSON.parse(input.text);
  } catch (caught) {
    return toolFail("invalidJson", "tools.invalidJson", void 0, errorDetail(caught));
  }
  if (input.mode === "validate") {
    return toolOk({ text: "", valid: true, bytes: input.text.length });
  }
  const text = input.mode === "minify" ? JSON.stringify(parsed) : JSON.stringify(parsed, null, input.indent);
  return toolOk({ text, valid: true, bytes: text.length });
}
function renderJsonFormatter(out, _ctx) {
  return out.text;
}
var jsonFormatterTool = {
  id: "json-formatter",
  tier: "T1",
  capabilities: [],
  inputs: [
    { name: "text", kind: "textarea", required: true, labelKey: "tools.input", placeholderKey: "tools.jsonPlaceholder" },
    {
      name: "mode",
      kind: "select",
      required: false,
      labelKey: "tools.mode",
      default: "format",
      options: [
        { value: "format", labelKey: "tools.format" },
        { value: "minify", labelKey: "tools.minify" },
        { value: "validate", labelKey: "tools.validate" }
      ]
    },
    { name: "indent", kind: "number", required: false, labelKey: "tools.indent", default: 2 }
  ],
  parse: parseJsonFormatter,
  run: runJsonFormatter,
  render: renderJsonFormatter
};

// shared/tools/base64.ts
var MODES2 = ["encode", "decode"];
function parseBase64(raw, _ctx) {
  const text = readString(raw, "text");
  if (text === null || text.length === 0) {
    return toolOk({ text: "", mode: readEnum(raw, "mode", MODES2, "encode") });
  }
  return toolOk({ text, mode: readEnum(raw, "mode", MODES2, "encode") });
}
function runBase64(input, _ctx) {
  if (input.text.length === 0) return toolOk({ text: "" });
  if (input.mode === "encode") {
    return toolOk({ text: textToBase64(input.text) });
  }
  const decoded = base64ToText(input.text);
  if (decoded === null) return toolFail("invalidBase64", "tools.invalidBase64");
  return toolOk({ text: decoded });
}
function renderBase64(out, _ctx) {
  return out.text;
}
var base64Tool = {
  id: "base64",
  tier: "T1",
  capabilities: [],
  inputs: [
    { name: "text", kind: "textarea", required: true, labelKey: "tools.enterText" },
    {
      name: "mode",
      kind: "select",
      required: false,
      labelKey: "tools.mode",
      default: "encode",
      options: [
        { value: "encode", labelKey: "tools.encode" },
        { value: "decode", labelKey: "tools.decode" }
      ]
    }
  ],
  parse: parseBase64,
  run: runBase64,
  render: renderBase64
};

// shared/tools/url-encode.ts
var MODES3 = ["encode", "decode"];
function parseUrlEncode(raw, _ctx) {
  const text = readString(raw, "text") ?? "";
  return toolOk({ text, mode: readEnum(raw, "mode", MODES3, "encode") });
}
function runUrlEncode(input, _ctx) {
  try {
    if (input.mode === "encode") {
      return toolOk({ text: encodeURIComponent(input.text) });
    }
    return toolOk({ text: decodeURIComponent(input.text) });
  } catch {
    return toolFail("invalidUrl", "tools.invalidUrl");
  }
}
function renderUrlEncode(out, _ctx) {
  return out.text;
}
var urlEncodeTool = {
  id: "url-encode",
  tier: "T1",
  capabilities: [],
  inputs: [
    { name: "text", kind: "textarea", required: true, labelKey: "tools.enterUrl" },
    {
      name: "mode",
      kind: "select",
      required: false,
      labelKey: "tools.mode",
      default: "encode",
      options: [
        { value: "encode", labelKey: "tools.encode" },
        { value: "decode", labelKey: "tools.decode" }
      ]
    }
  ],
  parse: parseUrlEncode,
  run: runUrlEncode,
  render: renderUrlEncode
};

// shared/tools/regex-tester.ts
var VALID_FLAGS = /^[dgimsuvy]*$/;
function parseRegexTester(raw, _ctx) {
  const pattern = readString(raw, "pattern") ?? "";
  const flags = readString(raw, "flags") ?? "gm";
  const text = readString(raw, "text") ?? "";
  if (pattern.length === 0 || text.length === 0) {
    return toolOk({ pattern, flags, text });
  }
  if (!VALID_FLAGS.test(flags)) {
    return toolFail("invalidRegex", "tools.invalidRegex");
  }
  return toolOk({ pattern, flags, text });
}
function runRegexTester(input, _ctx) {
  if (input.pattern.length === 0 || input.text.length === 0) {
    return toolOk({ matches: [], total: 0 });
  }
  let regex;
  try {
    regex = new RegExp(input.pattern, input.flags);
  } catch (caught) {
    return toolFail("invalidRegex", "tools.invalidRegex", void 0, errorDetail(caught));
  }
  const hasGlobal = input.flags.includes("g") || input.flags.includes("y");
  const matches = [];
  if (hasGlobal) {
    let m;
    let guard = 0;
    while ((m = regex.exec(input.text)) !== null) {
      matches.push({ index: m.index, match: m[0] });
      if (m.index === regex.lastIndex) regex.lastIndex++;
      if (++guard > 1e5) break;
    }
  } else {
    const m = regex.exec(input.text);
    if (m) matches.push({ index: m.index, match: m[0] });
  }
  return toolOk({ matches, total: matches.length });
}
function renderRegexTester(out, _ctx) {
  return out.matches.map((m, i) => `#${i + 1} @${m.index}	${m.match}`).join("\n");
}
var regexTesterTool = {
  id: "regex-tester",
  tier: "T1",
  capabilities: [],
  inputs: [
    { name: "pattern", kind: "text", required: true, labelKey: "tools.regularExpression" },
    { name: "flags", kind: "text", required: false, labelKey: "tools.flags", default: "gm" },
    { name: "text", kind: "textarea", required: true, labelKey: "tools.testText" }
  ],
  parse: parseRegexTester,
  run: runRegexTester,
  render: renderRegexTester
};

// shared/tools/jwt-decoder.ts
function normalizeSegment(segment) {
  let out = segment.replace(/-/g, "+").replace(/_/g, "/");
  const remainder = out.length % 4;
  if (remainder === 2) out += "==";
  else if (remainder === 3) out += "=";
  else if (remainder === 1) out += "===";
  return out;
}
function parseJwtDecoder(raw, _ctx) {
  const token = (readString(raw, "token") ?? "").trim();
  if (token.length === 0) return toolFail("emptyInput", "tools.emptyInput");
  return toolOk({ token });
}
function runJwtDecoder(input, _ctx) {
  const parts = input.token.split(".");
  if (parts.length !== 3 || parts[0].length === 0 || parts[1].length === 0) {
    return toolFail("invalidJwt", "tools.invalidJwt");
  }
  const headerText = base64ToText(normalizeSegment(parts[0]));
  const payloadText = base64ToText(normalizeSegment(parts[1]));
  if (headerText === null || payloadText === null) {
    return toolFail("invalidJwt", "tools.invalidJwt");
  }
  let header;
  let payload;
  try {
    header = JSON.parse(headerText);
    payload = JSON.parse(payloadText);
  } catch {
    return toolFail("invalidJwt", "tools.invalidJwt");
  }
  let algorithm = null;
  let expiresAt = null;
  if (header && typeof header === "object") {
    const alg = header.alg;
    if (typeof alg === "string") algorithm = alg;
  }
  if (payload && typeof payload === "object") {
    const exp = payload.exp;
    if (typeof exp === "number") expiresAt = exp;
  }
  return toolOk({
    header: JSON.stringify(header, null, 2),
    payload: JSON.stringify(payload, null, 2),
    algorithm,
    expiresAt
  });
}
function renderJwtDecoder(out, _ctx) {
  return `HEADER
${out.header}

PAYLOAD
${out.payload}`;
}
var jwtDecoderTool = {
  id: "jwt-decoder",
  tier: "T1",
  capabilities: [],
  inputs: [
    { name: "token", kind: "textarea", required: true, labelKey: "tools.jwtPlaceholder" }
  ],
  parse: parseJwtDecoder,
  run: runJwtDecoder,
  render: renderJwtDecoder
};

// shared/tools/uuid-generator.ts
var HEX = "0123456789abcdef";
function formatUuidV4(bytes) {
  if (bytes.length < 16) return null;
  const b = new Uint8Array(16);
  b.set(bytes.subarray(0, 16));
  b[6] = b[6] & 15 | 64;
  b[8] = b[8] & 63 | 128;
  let out = "";
  for (let i = 0; i < 16; i++) {
    out += HEX[b[i] >> 4];
    out += HEX[b[i] & 15];
    if (i === 3 || i === 5 || i === 7 || i === 9) out += "-";
  }
  return out;
}
function parseUuidGenerator(raw, _ctx) {
  return toolOk({ count: clampInt(readInt(raw, "count", 1), 1, 100) });
}
function runUuidGenerator(input, ctx) {
  const source = new RandomSource(ctx);
  const values = [];
  for (let i = 0; i < input.count; i++) {
    const bytes = new Uint8Array(16);
    for (let j = 0; j < 16; j++) bytes[j] = source.byte();
    const uuid = formatUuidV4(bytes);
    if (uuid === null) break;
    values.push(uuid);
  }
  return toolOk({ values, text: values.join("\n") });
}
function renderUuidGenerator(out, _ctx) {
  return out.text;
}
var uuidGeneratorTool = {
  id: "uuid-generator",
  tier: "T1",
  capabilities: [],
  inputs: [
    { name: "count", kind: "number", required: false, labelKey: "tools.count", default: 1 }
  ],
  parse: parseUuidGenerator,
  run: runUuidGenerator,
  render: renderUuidGenerator
};

// shared/tools/html-preview.ts
var DOCTYPE_RE = /^\s*<!doctype\s+html\s*>/i;
var HTML_TAG_RE = /<html[\s>]/i;
function parseHtmlPreview(raw, _ctx) {
  return toolOk({ html: readString(raw, "html") ?? "" });
}
function runHtmlPreview(input, _ctx) {
  const html = input.html;
  const hasDoctype = DOCTYPE_RE.test(html);
  const hasHtmlTag = HTML_TAG_RE.test(html);
  const isFullDocument = hasDoctype || hasHtmlTag;
  const normalized = isFullDocument ? html : `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
</head>
<body>
${html}
</body>
</html>`;
  return toolOk({ html: normalized, isFullDocument, bytes: normalized.length });
}
function renderHtmlPreview(out, _ctx) {
  return out.html;
}
var htmlPreviewTool = {
  id: "html-preview",
  tier: "T2",
  capabilities: ["dom"],
  inputs: [{ name: "html", kind: "textarea", required: true, labelKey: "tools.editor" }],
  parse: parseHtmlPreview,
  run: runHtmlPreview,
  render: renderHtmlPreview
};

// shared/tools/html-entities.ts
var MODES4 = ["escape", "unescape"];
var NAMED_ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\xA0",
  copy: "\xA9",
  reg: "\xAE",
  trade: "\u2122",
  deg: "\xB0",
  plusmn: "\xB1",
  times: "\xD7",
  divide: "\xF7",
  frac12: "\xBD",
  frac14: "\xBC",
  frac34: "\xBE",
  larr: "\u2190",
  rarr: "\u2192",
  uarr: "\u2191",
  darr: "\u2193",
  harr: "\u2194",
  hellip: "\u2026",
  mdash: "\u2014",
  ndash: "\u2013",
  lsquo: "\u2018",
  rsquo: "\u2019",
  ldquo: "\u201C",
  rdquo: "\u201D",
  euro: "\u20AC",
  pound: "\xA3",
  yen: "\xA5",
  cent: "\xA2",
  sect: "\xA7",
  para: "\xB6",
  middot: "\xB7",
  bull: "\u2022",
  dagger: "\u2020",
  permil: "\u2030",
  prime: "\u2032",
  oline: "\u203E",
  lparen: "(",
  rparen: ")"
};
var ESCAPE_PAIRS = [
  [/&/g, "&amp;"],
  [/</g, "&lt;"],
  [/>/g, "&gt;"],
  [/"/g, "&quot;"],
  [/'/g, "&#39;"]
];
function escapeHtmlEntities(text) {
  let out = text;
  for (const [pattern, replacement] of ESCAPE_PAIRS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}
function unescapeHtmlEntities(text) {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (entity, body) => {
    if (body.startsWith("#")) {
      const isHex = body[1] === "x" || body[1] === "X";
      const digits = isHex ? body.slice(2) : body.slice(1);
      const codePoint = Number.parseInt(digits, isHex ? 16 : 10);
      if (!Number.isFinite(codePoint) || codePoint < 0 || codePoint > 1114111) return entity;
      return String.fromCodePoint(codePoint);
    }
    const named = NAMED_ENTITIES[body];
    if (named !== void 0) return named;
    const lower = body.toLowerCase();
    const namedLower = NAMED_ENTITIES[lower];
    return namedLower === void 0 ? entity : namedLower;
  });
}
function parseHtmlEntities(raw, _ctx) {
  return toolOk({
    text: readString(raw, "text") ?? "",
    mode: readEnum(raw, "mode", MODES4, "escape")
  });
}
function runHtmlEntities(input, _ctx) {
  return toolOk({
    text: input.mode === "escape" ? escapeHtmlEntities(input.text) : unescapeHtmlEntities(input.text)
  });
}
function renderHtmlEntities(out, _ctx) {
  return out.text;
}
var htmlEntitiesTool = {
  id: "html-entities",
  tier: "T1",
  capabilities: [],
  inputs: [
    { name: "text", kind: "textarea", required: true, labelKey: "tools.enterHtml" },
    {
      name: "mode",
      kind: "select",
      required: false,
      labelKey: "tools.mode",
      default: "escape",
      options: [
        { value: "escape", labelKey: "tools.escape" },
        { value: "unescape", labelKey: "tools.unescape" }
      ]
    }
  ],
  parse: parseHtmlEntities,
  run: runHtmlEntities,
  render: renderHtmlEntities
};

// shared/tools/css-minifier.ts
var MODES5 = ["minify", "format"];
function minifyCss(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s*([{}:;,])\s*/g, "$1").replace(/\s+/g, " ").replace(/;}/g, "}").trim();
}
function formatCss(css) {
  return css.replace(/\{/g, " {\n  ").replace(/;/g, ";\n  ").replace(/}/g, "\n}\n").replace(/:\s+/g, ": ").replace(/\n\s*\n/g, "\n").trim();
}
function parseCssMinifier(raw, _ctx) {
  return toolOk({
    css: readString(raw, "css") ?? "",
    mode: readEnum(raw, "mode", MODES5, "minify")
  });
}
function runCssMinifier(input, _ctx) {
  if (input.css.trim().length === 0) return toolOk({ css: "", savedBytes: 0 });
  if (input.mode === "minify") {
    const minified = minifyCss(input.css);
    return toolOk({ css: minified, savedBytes: Math.max(0, input.css.length - minified.length) });
  }
  return toolOk({ css: formatCss(input.css), savedBytes: 0 });
}
function renderCssMinifier(out, _ctx) {
  return out.css;
}
var cssMinifierTool = {
  id: "css-minifier",
  tier: "T1",
  capabilities: [],
  inputs: [
    { name: "css", kind: "textarea", required: true, labelKey: "tools.enterText" },
    {
      name: "mode",
      kind: "select",
      required: false,
      labelKey: "tools.mode",
      default: "minify",
      options: [
        { value: "minify", labelKey: "tools.minify" },
        { value: "format", labelKey: "tools.format" }
      ]
    }
  ],
  parse: parseCssMinifier,
  run: runCssMinifier,
  render: renderCssMinifier
};

// shared/tools/number-base.ts
var BASES = [
  { base: 2, label: "BIN" },
  { base: 8, label: "OCT" },
  { base: 10, label: "DEC" },
  { base: 16, label: "HEX" }
];
function parseNumberBase(raw, _ctx) {
  const value = (readString(raw, "value") ?? "").trim();
  if (value.length === 0) return toolFail("emptyInput", "tools.emptyInput");
  return toolOk({ value, fromBase: clampInt(readInt(raw, "fromBase", 10), 2, 16) });
}
function runNumberBase(input, _ctx) {
  const decimal = Number.parseInt(input.value, input.fromBase);
  if (Number.isNaN(decimal)) return toolFail("invalidNumber", "tools.invalidNumber");
  return toolOk({
    decimal,
    values: BASES.map(({ base, label }) => ({
      base,
      label,
      value: decimal.toString(base).toUpperCase()
    }))
  });
}
function renderNumberBase(out, _ctx) {
  return out.values.map((entry) => `${entry.label}	${entry.value}`).join("\n");
}
var numberBaseTool = {
  id: "number-base",
  tier: "T1",
  capabilities: [],
  inputs: [
    { name: "value", kind: "text", required: true, labelKey: "tools.enterNumber" },
    {
      name: "fromBase",
      kind: "select",
      required: false,
      labelKey: "tools.fromBase",
      default: 10,
      options: [
        { value: "2", labelKey: "tools.base2" },
        { value: "8", labelKey: "tools.base8" },
        { value: "10", labelKey: "tools.base10" },
        { value: "16", labelKey: "tools.base16" }
      ]
    }
  ],
  parse: parseNumberBase,
  run: runNumberBase,
  render: renderNumberBase
};

// shared/tools/yaml-json.ts
var MODES6 = ["yaml2json", "json2yaml"];
function stripComment(text) {
  let quote = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === "#" && (i === 0 || /\s/.test(text[i - 1]))) {
      return text.slice(0, i).trimEnd();
    }
  }
  return text.trimEnd();
}
function preprocess(source) {
  const lines = [];
  for (const raw of source.split("\n")) {
    if (raw.trim().length === 0) continue;
    const expanded = raw.replace(/\t/g, "  ");
    const indent = expanded.length - expanded.trimStart().length;
    const text = stripComment(expanded.trim());
    if (text.length === 0) continue;
    lines.push({ indent, text });
  }
  return lines;
}
function parseScalar(text) {
  const value = text.trim();
  if (value.length === 0) return null;
  if (value.startsWith('"')) {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === "string") return parsed;
    } catch {
      return value.slice(1, value.lastIndexOf('"'));
    }
    return value.slice(1, value.lastIndexOf('"'));
  }
  if (value.startsWith("'") && value.endsWith("'") && value.length >= 2) {
    return value.slice(1, -1).replace(/''/g, "'");
  }
  if (value === "true" || value === "yes" || value === "on") return true;
  if (value === "false" || value === "no" || value === "off") return false;
  if (value === "null" || value === "~" || value === "Null" || value === "NULL") return null;
  if (/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(value)) {
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return value;
}
function splitKey(text) {
  let quote = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === ":") {
      const key = text.slice(0, i).trim();
      const rest = text.slice(i + 1).trim();
      const unquotedKey = key.startsWith('"') || key.startsWith("'") ? key.slice(1, -1) : key;
      return { key: unquotedKey, rest };
    }
  }
  return { key: text, rest: "" };
}
function isSequenceItem(text) {
  return text === "-" || text.startsWith("- ");
}
function looksLikeMapping(text) {
  return splitKey(text).rest !== "" || /^[^\s:]+:$/.test(text);
}
function parseBlock(lines, start, indent) {
  let i = start;
  if (i >= lines.length) return { value: null, next: i };
  if (isSequenceItem(lines[i].text)) {
    const array = [];
    while (i < lines.length && lines[i].indent === indent && isSequenceItem(lines[i].text)) {
      const rest = lines[i].text === "-" ? "" : lines[i].text.slice(2).trim();
      i++;
      if (rest.length === 0) {
        if (i < lines.length && lines[i].indent > indent) {
          const sub = parseBlock(lines, i, lines[i].indent);
          array.push(sub.value);
          i = sub.next;
        } else {
          array.push(null);
        }
      } else if (looksLikeMapping(rest)) {
        const childIndent = indent + 2;
        const subLines = [{ indent: childIndent, text: rest }];
        for (let j = i; j < lines.length && lines[j].indent > indent; j++) {
          subLines.push(lines[j]);
        }
        const sub = parseBlock(subLines, 0, childIndent);
        array.push(sub.value);
        while (i < lines.length && lines[i].indent > indent) i++;
      } else {
        array.push(parseScalar(rest));
      }
    }
    return { value: array, next: i };
  }
  const object = {};
  while (i < lines.length && lines[i].indent === indent && !isSequenceItem(lines[i].text)) {
    const { key, rest } = splitKey(lines[i].text);
    i++;
    if (rest.length === 0) {
      if (i < lines.length && lines[i].indent > indent) {
        const sub = parseBlock(lines, i, lines[i].indent);
        object[key] = sub.value;
        i = sub.next;
      } else {
        object[key] = null;
      }
    } else {
      object[key] = parseScalar(rest);
    }
  }
  return { value: object, next: i };
}
function parseYaml(source) {
  const lines = preprocess(source);
  if (lines.length === 0) return null;
  const result = parseBlock(lines, 0, lines[0].indent);
  return result.value;
}
function scalarToYaml(value) {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  const text = typeof value === "string" ? value : JSON.stringify(value);
  const needsQuote = text.length === 0 || /^[-+]?[\d.]/.test(text) || text === "true" || text === "false" || text === "null" || text === "~" || text === "yes" || text === "no" || /[:#{}[\],&*?|>%@`"']/.test(text) || /^\s|\s$/.test(text);
  return needsQuote ? JSON.stringify(text) : text;
}
function dumpYaml(value, indent = 0) {
  const pad = " ".repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) return `${pad}[]`;
    return value.map((item) => {
      if (Array.isArray(item)) {
        return item.length === 0 ? `${pad}- []` : `${pad}-
${dumpYaml(item, indent + 2)}`;
      }
      if (item !== null && typeof item === "object") {
        const body = dumpYaml(item, indent + 2);
        return Object.keys(item).length === 0 ? `${pad}- {}` : `${pad}-
${body}`;
      }
      return `${pad}- ${scalarToYaml(item)}`;
    }).join("\n");
  }
  if (value !== null && typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 0) return `${pad}{}`;
    return keys.map((key) => {
      const child = value[key];
      const safeKey = scalarToYaml(key);
      if (Array.isArray(child)) {
        return child.length === 0 ? `${pad}${safeKey}: []` : `${pad}${safeKey}:
${dumpYaml(child, indent + 2)}`;
      }
      if (child !== null && typeof child === "object") {
        return Object.keys(child).length === 0 ? `${pad}${safeKey}: {}` : `${pad}${safeKey}:
${dumpYaml(child, indent + 2)}`;
      }
      return `${pad}${safeKey}: ${scalarToYaml(child)}`;
    }).join("\n");
  }
  return `${pad}${scalarToYaml(value)}`;
}
function parseYamlJson(raw, _ctx) {
  const text = readString(raw, "text") ?? "";
  const mode = readEnum(raw, "mode", MODES6, "yaml2json");
  if (text.trim().length === 0) return toolFail("emptyInput", "tools.emptyInput");
  return toolOk({ text, mode });
}
function runYamlJson(input, _ctx) {
  try {
    if (input.mode === "yaml2json") {
      const parsed2 = parseYaml(input.text);
      if (parsed2 === null) return toolFail("emptyInput", "tools.emptyYaml");
      return toolOk({ text: JSON.stringify(parsed2, null, 2) });
    }
    const parsed = JSON.parse(input.text);
    return toolOk({ text: `${dumpYaml(parsed)}
` });
  } catch {
    return toolFail("invalidJson", "tools.conversionFailed");
  }
}
function renderYamlJson(out, _ctx) {
  return out.text;
}
var yamlJsonTool = {
  id: "yaml-json",
  tier: "T1",
  capabilities: [],
  inputs: [
    { name: "text", kind: "textarea", required: true, labelKey: "tools.pleaseEnterContent" },
    {
      name: "mode",
      kind: "select",
      required: false,
      labelKey: "tools.mode",
      default: "yaml2json",
      options: [
        { value: "yaml2json", labelKey: "tools.yamlToJson" },
        { value: "json2yaml", labelKey: "tools.jsonToYaml" }
      ]
    }
  ],
  parse: parseYamlJson,
  run: runYamlJson,
  render: renderYamlJson
};

// shared/tools/json-to-csv.ts
function flattenObject(value, prefix = "") {
  const result = {};
  if (value === null || value === void 0) return result;
  if (typeof value !== "object" || Array.isArray(value)) {
    result[prefix] = String(value);
    return result;
  }
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child !== null && typeof child === "object" && !Array.isArray(child)) {
      Object.assign(result, flattenObject(child, path));
    } else {
      result[path] = child === null || child === void 0 ? "" : String(child);
    }
  }
  return result;
}
function escapeCsvCell(value) {
  const text = String(value);
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}
function parseJsonToCsv(raw, _ctx) {
  const json = (readString(raw, "json") ?? "").trim();
  if (json.length === 0) return toolFail("emptyInput", "tools.emptyInput");
  return toolOk({ json });
}
function runJsonToCsv(input, _ctx) {
  let data;
  try {
    data = JSON.parse(input.json);
  } catch {
    return toolFail("invalidJson", "tools.invalidJson");
  }
  if (Array.isArray(data)) {
    if (data.length === 0) return toolFail("invalidInput", "tools.invalidInput");
    const hasObjects = data.some(
      (item) => item !== null && typeof item === "object" && !Array.isArray(item)
    );
    if (hasObjects) {
      const flatRows = data.map((row) => flattenObject(row));
      const headers = [...new Set(flatRows.flatMap((row) => Object.keys(row)))];
      const lines2 = [
        headers.join(","),
        ...flatRows.map((row) => headers.map((h) => escapeCsvCell(row[h] ?? "")).join(","))
      ];
      return toolOk({ csv: lines2.join("\n"), columns: headers, rows: flatRows.length });
    }
    const lines = ["Value", ...data.map((v) => escapeCsvCell(String(v)))];
    return toolOk({ csv: lines.join("\n"), columns: ["Value"], rows: data.length });
  }
  if (data !== null && typeof data === "object") {
    const flat = flattenObject(data);
    const lines = [
      "Key,Value",
      ...Object.entries(flat).map(([k, v]) => `${k},${escapeCsvCell(String(v))}`)
    ];
    return toolOk({ csv: lines.join("\n"), columns: ["Key", "Value"], rows: Object.keys(flat).length });
  }
  return toolOk({ csv: `Value
${String(data)}`, columns: ["Value"], rows: 1 });
}
function renderJsonToCsv(out, _ctx) {
  return out.csv;
}
var jsonToCsvTool = {
  id: "json-to-csv",
  tier: "T1",
  capabilities: [],
  inputs: [
    { name: "json", kind: "textarea", required: true, labelKey: "tools.input", placeholderKey: "tools.jsonPlaceholder" }
  ],
  parse: parseJsonToCsv,
  run: runJsonToCsv,
  render: renderJsonToCsv
};

// shared/tools/word-counter.ts
var CJK_RE = /[一-鿿㐀-䶿豈-﫿]/g;
function parseWordCounter(raw, _ctx) {
  return toolOk({ text: readString(raw, "text") ?? "" });
}
function runWordCounter(input, _ctx) {
  const text = input.text;
  return toolOk({
    chars: text.length,
    charsNoSpace: text.replace(/\s/g, "").length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    lines: text ? text.split("\n").length : 0,
    cjk: (text.match(CJK_RE) || []).length
  });
}
function renderWordCounter(out, _ctx) {
  return [
    `characters	${out.chars}`,
    `noSpace	${out.charsNoSpace}`,
    `words	${out.words}`,
    `lines	${out.lines}`,
    `cjk	${out.cjk}`
  ].join("\n");
}
var wordCounterTool = {
  id: "word-counter",
  tier: "T1",
  capabilities: [],
  inputs: [{ name: "text", kind: "textarea", required: true, labelKey: "tools.typeOrPasteText" }],
  parse: parseWordCounter,
  run: runWordCounter,
  render: renderWordCounter
};

// shared/tools/markdown-preview.ts
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function renderInline(text) {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, (_m, code) => `<code>${code}</code>`);
  out = out.replace(/\*\*([^*]+)\*\*/g, (_m, bold) => `<strong>${bold}</strong>`);
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, (_m, prefix, em) => `${prefix}<em>${em}</em>`);
  out = out.replace(/~~([^~]+)~~/g, (_m, s) => `<del>${s}</del>`);
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+|#[^\s)]*|\/[^\s)]*)\)/g,
    (_m, label, href) => `<a href="${href}" rel="noopener noreferrer">${label}</a>`
  );
  return out;
}
function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let index = 0;
  const closeList = (state2) => {
    if (state2.listType !== null) {
      html.push(state2.listType === "ol" ? "</ol>" : "</ul>");
      state2.listType = null;
    }
  };
  const state = { listType: null };
  while (index < lines.length) {
    const raw = lines[index];
    const line = raw.trimEnd();
    if (line.trim().length === 0) {
      closeList(state);
      index++;
      continue;
    }
    const fence = line.match(/^\s*```(\w*)\s*$/);
    if (fence) {
      closeList(state);
      const lang = fence[1] ?? "";
      const body = [];
      index++;
      while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) {
        body.push(escapeHtml(lines[index]));
        index++;
      }
      index++;
      const cls = lang ? ` class="language-${escapeHtml(lang)}"` : "";
      html.push(`<pre><code${cls}>${body.join("\n")}</code></pre>`);
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      closeList(state);
      const level = heading[1].length;
      html.push(`<h${level}>${renderInline(heading[2].trim())}</h${level}>`);
      index++;
      continue;
    }
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      closeList(state);
      html.push("<hr />");
      index++;
      continue;
    }
    if (/^\s*>\s?/.test(line)) {
      closeList(state);
      const body = [];
      while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
        body.push(renderInline(lines[index].replace(/^\s*>\s?/, "")));
        index++;
      }
      html.push(`<blockquote>${body.join("<br />")}</blockquote>`);
      continue;
    }
    const unordered = line.match(/^\s*[-*+]\s+(.*)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    const listType = unordered ? "ul" : ordered ? "ol" : null;
    if (listType) {
      if (state.listType !== listType) {
        closeList(state);
        html.push(`<${listType}>`);
        state.listType = listType;
      }
      const content = (unordered ?? ordered)?.[1] ?? "";
      html.push(`<li>${renderInline(content)}</li>`);
      index++;
      continue;
    }
    closeList(state);
    const paragraph = [];
    while (index < lines.length && lines[index].trim().length > 0 && !/^\s*```/.test(lines[index]) && !/^#{1,6}\s/.test(lines[index]) && !/^\s*>/.test(lines[index]) && !/^\s*[-*+]\s/.test(lines[index]) && !/^\s*\d+[.)]\s/.test(lines[index])) {
      paragraph.push(renderInline(lines[index].replace(/ {2,}$/, (m) => m.length >= 2 ? "<br />" : m)));
      index++;
    }
    if (paragraph.length > 0) html.push(`<p>${paragraph.join("<br />")}</p>`);
  }
  closeList(state);
  return html.join("\n");
}
function parseMarkdownPreview(raw, _ctx) {
  return toolOk({ markdown: readString(raw, "markdown") ?? "" });
}
function runMarkdownPreview(input, _ctx) {
  const trimmed = input.markdown.trim();
  return toolOk({
    html: trimmed.length === 0 ? "" : markdownToHtml(input.markdown),
    words: trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length
  });
}
function renderMarkdownPreview(out, _ctx) {
  return out.html;
}
var markdownPreviewTool = {
  id: "markdown-preview",
  tier: "T1",
  capabilities: [],
  inputs: [{ name: "markdown", kind: "textarea", required: true, labelKey: "tools.originalText" }],
  parse: parseMarkdownPreview,
  run: runMarkdownPreview,
  render: renderMarkdownPreview
};

// shared/tools/case-converter.ts
var STYLES = ["upper", "lower", "title", "camel", "snake"];
function toTitleCase(text) {
  return text.replace(/\b\w/g, (c) => c.toUpperCase());
}
function toCamelCase(text) {
  return text.replace(/[^a-zA-Z0-9]+(.)/g, (_match, c) => c.toUpperCase());
}
function toSnakeCase(text) {
  return text.replace(/\s+/g, "_").toLowerCase();
}
function convertCase(text, style) {
  switch (style) {
    case "upper":
      return text.toUpperCase();
    case "lower":
      return text.toLowerCase();
    case "title":
      return toTitleCase(text);
    case "camel":
      return toCamelCase(text);
    case "snake":
      return toSnakeCase(text);
  }
}
function parseCaseConverter(raw, _ctx) {
  return toolOk({
    text: readString(raw, "text") ?? "",
    style: readEnum(raw, "style", STYLES, "upper")
  });
}
function runCaseConverter(input, _ctx) {
  if (input.text.length === 0) return toolOk({ text: "" });
  return toolOk({ text: convertCase(input.text, input.style) });
}
function renderCaseConverter(out, _ctx) {
  return out.text;
}
var caseConverterTool = {
  id: "case-converter",
  tier: "T1",
  capabilities: [],
  inputs: [
    { name: "text", kind: "textarea", required: true, labelKey: "tools.enterText" },
    {
      name: "style",
      kind: "select",
      required: false,
      labelKey: "tools.mode",
      default: "upper",
      options: [
        { value: "upper", labelKey: "tools.caseUpper" },
        { value: "lower", labelKey: "tools.caseLower" },
        { value: "title", labelKey: "tools.caseTitle" },
        { value: "camel", labelKey: "tools.caseCamel" },
        { value: "snake", labelKey: "tools.caseSnake" }
      ]
    }
  ],
  parse: parseCaseConverter,
  run: runCaseConverter,
  render: renderCaseConverter
};

// shared/tools/text-diff.ts
function splitLines(text) {
  if (text.length === 0) return [];
  const matches = text.match(/[^\n]*\n|[^\n]+$/g);
  return matches ?? [];
}
function lcsTable(a, b) {
  const table = [];
  for (let i = 0; i <= a.length; i++) {
    table.push(new Array(b.length + 1).fill(0));
  }
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  return table;
}
function diffLines(left, right) {
  const a = splitLines(left);
  const b = splitLines(right);
  const table = lcsTable(a, b);
  const parts = [];
  const push = (type, value) => {
    const last = parts[parts.length - 1];
    if (last && last.type === type) {
      last.value += value;
      last.lines += 1;
      return;
    }
    parts.push({ type, value, lines: 1 });
  };
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push("equal", a[i]);
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      push("removed", a[i]);
      i++;
    } else {
      push("added", b[j]);
      j++;
    }
  }
  while (i < a.length) {
    push("removed", a[i]);
    i++;
  }
  while (j < b.length) {
    push("added", b[j]);
    j++;
  }
  return parts;
}
function parseTextDiff(raw, _ctx) {
  return toolOk({ left: readString(raw, "left") ?? "", right: readString(raw, "right") ?? "" });
}
function runTextDiff(input, _ctx) {
  const parts = diffLines(input.left, input.right);
  let addedLines = 0;
  let removedLines = 0;
  for (const part of parts) {
    if (part.type === "added") addedLines += part.lines;
    if (part.type === "removed") removedLines += part.lines;
  }
  return toolOk({
    parts,
    addedLines,
    removedLines,
    totalLines: Math.max(splitLines(input.left).length, splitLines(input.right).length)
  });
}
function renderTextDiff(out, _ctx) {
  return out.parts.map((part) => {
    const marker = part.type === "added" ? "+" : part.type === "removed" ? "-" : " ";
    return part.value.split("\n").filter((line, index, arr) => !(index === arr.length - 1 && line === "")).map((line) => `${marker}${line}`).join("\n");
  }).join("\n");
}
var textDiffTool = {
  id: "text-diff",
  tier: "T1",
  capabilities: [],
  inputs: [
    { name: "left", kind: "textarea", required: true, labelKey: "tools.originalText" },
    { name: "right", kind: "textarea", required: true, labelKey: "tools.modifiedText" }
  ],
  parse: parseTextDiff,
  run: runTextDiff,
  render: renderTextDiff
};

// shared/tools/lorem-ipsum.ts
var UNITS = ["paragraphs", "sentences", "words"];
var WORDS = [
  "lorem",
  "ipsum",
  "dolor",
  "sit",
  "amet",
  "consectetur",
  "adipiscing",
  "elit",
  "sed",
  "do",
  "eiusmod",
  "tempor",
  "incididunt",
  "ut",
  "labore",
  "et",
  "dolore",
  "magna",
  "aliqua",
  "enim",
  "ad",
  "minim",
  "veniam",
  "quis",
  "nostrud",
  "exercitation",
  "ullamco",
  "laboris",
  "nisi",
  "aliquip",
  "ex",
  "ea",
  "commodo",
  "consequat",
  "duis",
  "aute",
  "irure",
  "dolor",
  "reprehenderit",
  "voluptate",
  "velit",
  "esse",
  "cillum",
  "dolore",
  "eu",
  "fugiat",
  "nulla",
  "pariatur"
];
function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
function makeSentence(source, minWords, spread) {
  const length = minWords + source.below(spread);
  const words = [];
  for (let i = 0; i < length; i++) words.push(source.pick(WORDS));
  return `${capitalize(words.join(" "))}.`;
}
function parseLoremIpsum(raw, _ctx) {
  return toolOk({
    count: clampInt(readInt(raw, "count", 5), 1, 100),
    unit: readEnum(raw, "unit", UNITS, "paragraphs")
  });
}
function runLoremIpsum(input, ctx) {
  const source = new RandomSource(ctx);
  if (input.unit === "words") {
    const words = [];
    for (let i = 0; i < input.count; i++) words.push(source.pick(WORDS));
    const text = words.join(" ");
    return toolOk({ text: `${capitalize(text)}.` });
  }
  if (input.unit === "sentences") {
    const sentences = [];
    for (let i = 0; i < input.count; i++) sentences.push(makeSentence(source, 5, 15));
    return toolOk({ text: sentences.join(" ") });
  }
  const paragraphs = [];
  for (let i = 0; i < input.count; i++) {
    const sentenceCount = 3 + source.below(5);
    const sentences = [];
    for (let j = 0; j < sentenceCount; j++) sentences.push(makeSentence(source, 8, 20));
    paragraphs.push(sentences.join(" "));
  }
  return toolOk({ text: paragraphs.join("\n\n") });
}
function renderLoremIpsum(out, _ctx) {
  return out.text;
}
var loremIpsumTool = {
  id: "lorem-ipsum",
  tier: "T1",
  capabilities: [],
  inputs: [
    { name: "count", kind: "number", required: false, labelKey: "tools.count", default: 5 },
    {
      name: "unit",
      kind: "select",
      required: false,
      labelKey: "tools.mode",
      default: "paragraphs",
      options: [
        { value: "paragraphs", labelKey: "tools.loremParagraphs" },
        { value: "sentences", labelKey: "tools.loremSentences" },
        { value: "words", labelKey: "tools.loremWords" }
      ]
    }
  ],
  parse: parseLoremIpsum,
  run: runLoremIpsum,
  render: renderLoremIpsum
};

// shared/tools/text-to-slug.ts
function toSlug(text) {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
function parseTextToSlug(raw, _ctx) {
  return toolOk({ text: readString(raw, "text") ?? "" });
}
function runTextToSlug(input, _ctx) {
  if (input.text.trim().length === 0) return toolOk({ slug: "" });
  return toolOk({ slug: toSlug(input.text) });
}
function renderTextToSlug(out, _ctx) {
  return out.slug;
}
var textToSlugTool = {
  id: "text-to-slug",
  tier: "T1",
  capabilities: [],
  inputs: [{ name: "text", kind: "textarea", required: true, labelKey: "tools.enterText" }],
  parse: parseTextToSlug,
  run: runTextToSlug,
  render: renderTextToSlug
};

// shared/tools/list-sorter.ts
var MODES7 = ["asc", "desc", "unique", "shuffle"];
function parseListSorter(raw, _ctx) {
  return toolOk({
    text: readString(raw, "text") ?? "",
    mode: readEnum(raw, "mode", MODES7, "asc")
  });
}
function runListSorter(input, ctx) {
  const lines = input.text.split("\n");
  switch (input.mode) {
    case "asc":
      lines.sort((a, b) => a.localeCompare(b));
      break;
    case "desc":
      lines.sort((a, b) => b.localeCompare(a));
      break;
    case "unique":
      return toolOk({ text: [...new Set(lines)].join("\n"), lines: new Set(lines).size });
    case "shuffle":
      new RandomSource(ctx).shuffle(lines);
      break;
  }
  return toolOk({ text: lines.join("\n"), lines: lines.length });
}
function renderListSorter(out, _ctx) {
  return out.text;
}
var listSorterTool = {
  id: "list-sorter",
  tier: "T1",
  capabilities: [],
  inputs: [
    { name: "text", kind: "textarea", required: true, labelKey: "tools.enterText" },
    {
      name: "mode",
      kind: "select",
      required: false,
      labelKey: "tools.mode",
      default: "asc",
      options: [
        { value: "asc", labelKey: "tools.sortAsc" },
        { value: "desc", labelKey: "tools.sortDesc" },
        { value: "unique", labelKey: "tools.dedup" },
        { value: "shuffle", labelKey: "tools.shuffle" }
      ]
    }
  ],
  parse: parseListSorter,
  run: runListSorter,
  render: renderListSorter
};

// shared/tools/password-generator.ts
var UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
var LOWER = "abcdefghijklmnopqrstuvwxyz";
var DIGITS = "0123456789";
var SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
function scoreStrength(length, flags) {
  let score = 0;
  if (length >= 8) score += 25;
  if (length >= 12) score += 25;
  if (flags.upper && flags.lower) score += 15;
  if (flags.digits) score += 15;
  if (flags.symbols) score += 20;
  return Math.min(100, score);
}
function parsePasswordGenerator(raw, _ctx) {
  return toolOk({
    length: clampInt(readInt(raw, "length", 16), 4, 128),
    upper: readBool(raw, "upper", true),
    lower: readBool(raw, "lower", true),
    digits: readBool(raw, "digits", true),
    symbols: readBool(raw, "symbols", true)
  });
}
function runPasswordGenerator(input, ctx) {
  let pool = "";
  if (input.upper) pool += UPPER;
  if (input.lower) pool += LOWER;
  if (input.digits) pool += DIGITS;
  if (input.symbols) pool += SYMBOLS;
  if (pool.length === 0) {
    return toolFail("invalidInput", "tools.invalidInput");
  }
  const source = new RandomSource(ctx);
  let password = "";
  for (let i = 0; i < input.length; i++) {
    password += pool[source.below(pool.length)];
  }
  return toolOk({
    password,
    strength: scoreStrength(input.length, input),
    poolSize: pool.length
  });
}
function renderPasswordGenerator(out, _ctx) {
  return out.password;
}
var passwordGeneratorTool = {
  id: "password-generator",
  tier: "T1",
  capabilities: [],
  inputs: [
    { name: "length", kind: "number", required: false, labelKey: "tools.length", default: 16 },
    { name: "upper", kind: "boolean", required: false, labelKey: "tools.upper", default: true },
    { name: "lower", kind: "boolean", required: false, labelKey: "tools.lower", default: true },
    { name: "digits", kind: "boolean", required: false, labelKey: "tools.digits", default: true },
    { name: "symbols", kind: "boolean", required: false, labelKey: "tools.symbols", default: true }
  ],
  parse: parsePasswordGenerator,
  run: runPasswordGenerator,
  render: renderPasswordGenerator
};

// shared/tools/qrcode.ts
var HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
function parseQrCode(raw, _ctx) {
  const text = (readString(raw, "text") ?? "").trim();
  if (text.length === 0) return toolFail("emptyInput", "tools.pleaseEnterText");
  if (text.length > 2953) return toolFail("outOfRange", "tools.outOfRange");
  const dark = readString(raw, "dark");
  const light = readString(raw, "light");
  if (dark !== null && !HEX_COLOR_RE.test(dark)) return toolFail("invalidHex", "tools.invalidHex");
  if (light !== null && !HEX_COLOR_RE.test(light)) return toolFail("invalidHex", "tools.invalidHex");
  return toolOk({
    text,
    width: clampInt(readInt(raw, "width", 256), 64, 2048),
    margin: clampInt(readInt(raw, "margin", 2), 0, 16),
    ...dark === null ? {} : { dark },
    ...light === null ? {} : { light }
  });
}
function runQrCode(input, _ctx) {
  return toolOk({
    text: input.text,
    width: input.width,
    margin: input.margin,
    dark: input.dark ?? "#1f1f1f",
    light: input.light ?? "#ffffff"
  });
}
function renderQrCode(out, _ctx) {
  return out.text;
}
var qrCodeTool = {
  id: "qrcode",
  tier: "T2",
  capabilities: ["canvas"],
  inputs: [
    { name: "text", kind: "textarea", required: true, labelKey: "tools.enterTextOrUrl" },
    { name: "width", kind: "number", required: false, labelKey: "tools.width", default: 256 },
    { name: "margin", kind: "number", required: false, labelKey: "tools.margin", default: 2 }
  ],
  parse: parseQrCode,
  run: runQrCode,
  render: renderQrCode
};

// shared/tools/color-picker.ts
var HEX_RE = /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;
function normalizeHex(input) {
  const value = input.trim();
  if (!HEX_RE.test(value)) return null;
  const body = value.replace("#", "");
  if (body.length === 3) {
    return `#${body[0]}${body[0]}${body[1]}${body[1]}${body[2]}${body[2]}`.toLowerCase();
  }
  return `#${body.toLowerCase()}`;
}
function hexToRgb(hex) {
  const normalized = normalizeHex(hex);
  if (normalized === null) return null;
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16)
  };
}
function rgbToHex(rgb) {
  return `#${padNumber(rgb.r, 2)}${padNumber(rgb.g, 2)}${padNumber(rgb.b, 2)}`;
}
function rgbToHsl(rgb) {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}
function parseColorPicker(raw, _ctx) {
  const hex = readString(raw, "hex");
  if (hex === null || normalizeHex(hex) === null) {
    return toolFail("invalidHex", "tools.invalidHex");
  }
  return toolOk({ hex });
}
function runColorPicker(input, _ctx) {
  const hex = normalizeHex(input.hex);
  if (hex === null) return toolFail("invalidHex", "tools.invalidHex");
  const rgb = hexToRgb(hex);
  if (rgb === null) return toolFail("invalidHex", "tools.invalidHex");
  const hsl = rgbToHsl(rgb);
  return toolOk({
    hex,
    rgb,
    hsl,
    rgbText: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    hslText: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    luminance: (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  });
}
function renderColorPicker(out, _ctx) {
  return [out.hex, out.rgbText, out.hslText].join("\n");
}
var colorPickerTool = {
  id: "color-picker",
  tier: "T1",
  capabilities: [],
  inputs: [{ name: "hex", kind: "color", required: true, labelKey: "tools.hex", default: "#fa520f" }],
  parse: parseColorPicker,
  run: runColorPicker,
  render: renderColorPicker
};

// shared/tools/image-to-base64.ts
var MAX_IMAGE_BYTES = 5 * 1024 * 1024;
var ALLOWED_MIME = /* @__PURE__ */ new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/svg+xml",
  "image/avif"
]);
function guessMimeType(fileName) {
  const ext = fileName.toLowerCase().split(".").pop() ?? "";
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "bmp":
      return "image/bmp";
    case "svg":
      return "image/svg+xml";
    case "avif":
      return "image/avif";
    default:
      return "application/octet-stream";
  }
}
function bytesToDataUrl(bytes, mimeType) {
  return `data:${mimeType};base64,${bytesToBase64(bytes)}`;
}
function parseImageToBase64(raw, _ctx) {
  const rawBytes = raw.bytes;
  if (!Array.isArray(rawBytes)) return toolFail("invalidInput", "tools.failedToRead");
  const bytes = [];
  for (const item of rawBytes) {
    if (typeof item !== "number" || item < 0 || item > 255) {
      return toolFail("invalidInput", "tools.failedToRead");
    }
    bytes.push(item);
  }
  if (bytes.length > MAX_IMAGE_BYTES) return toolFail("outOfRange", "tools.fileTooLarge");
  const fileName = readString(raw, "fileName") ?? "";
  const providedMime = readString(raw, "mimeType");
  const mimeType = providedMime && providedMime.length > 0 ? providedMime : guessMimeType(fileName);
  if (!ALLOWED_MIME.has(mimeType)) return toolFail("invalidInput", "tools.failedToRead");
  return toolOk({ bytes, mimeType, fileName });
}
function runImageToBase64(input, _ctx) {
  const bytes = new Uint8Array(input.bytes);
  const base64 = bytesToBase64(bytes);
  return toolOk({
    dataUrl: `data:${input.mimeType};base64,${base64}`,
    base64,
    bytes: bytes.length,
    fileName: input.fileName
  });
}
function renderImageToBase64(out, _ctx) {
  return out.dataUrl;
}
var imageToBase64Tool = {
  id: "image-to-base64",
  tier: "T2",
  capabilities: ["file"],
  inputs: [
    { name: "bytes", kind: "file", required: true, labelKey: "tools.dropImage" },
    { name: "fileName", kind: "text", required: false, labelKey: "tools.fileName" },
    { name: "mimeType", kind: "text", required: false, labelKey: "tools.mimeType" }
  ],
  parse: parseImageToBase64,
  run: runImageToBase64,
  render: renderImageToBase64
};

// shared/tools/image-converter.ts
var FORMATS = ["png", "jpeg", "webp", "bmp", "gif"];
var IMAGE_MIME = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
  bmp: "image/bmp",
  gif: "image/gif"
};
var LOSSLESS_FORMATS = ["png", "bmp", "gif"];
function targetFileName(sourceName, format, size) {
  const dot = sourceName.lastIndexOf(".");
  const base = dot > 0 ? sourceName.slice(0, dot) : sourceName;
  const ext = format === "jpeg" ? "jpg" : format;
  const suffix = size && size.width > 0 && size.height > 0 ? `_${size.width}x${size.height}` : "";
  return `${base}${suffix}.${ext}`;
}
function normalizeQuality(format, quality) {
  if (LOSSLESS_FORMATS.includes(format)) return 1;
  return Math.min(1, Math.max(0.1, quality));
}
function scaleDimensions(width, height, scalePercent) {
  const factor = scalePercent / 100;
  return {
    width: Math.max(1, Math.round(width * factor)),
    height: Math.max(1, Math.round(height * factor))
  };
}
function scaleToAbsolute(width, height, targetWidth, targetHeight) {
  if (targetWidth <= 0 || targetHeight <= 0) {
    return { width: Math.max(1, Math.trunc(width)), height: Math.max(1, Math.trunc(height)) };
  }
  return {
    width: Math.max(1, Math.trunc(targetWidth)),
    height: Math.max(1, Math.trunc(targetHeight))
  };
}
function parseImageConverter(raw, _ctx) {
  const sourceWidth = readInt(raw, "sourceWidth", 0);
  const sourceHeight = readInt(raw, "sourceHeight", 0);
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return toolFail("invalidInput", "tools.invalidInput");
  }
  return toolOk({
    fileName: readString(raw, "fileName") ?? "image",
    sourceWidth,
    sourceHeight,
    targetFormat: readEnum(raw, "targetFormat", FORMATS, "png"),
    quality: clampInt(readInt(raw, "quality", 90), 1, 100) / 100,
    scalePercent: clampInt(readInt(raw, "scalePercent", 100), 1, 400)
  });
}
function runImageConverter(input, _ctx) {
  const { width, height } = scaleDimensions(input.sourceWidth, input.sourceHeight, input.scalePercent);
  return toolOk({
    fileName: targetFileName(input.fileName, input.targetFormat),
    mimeType: IMAGE_MIME[input.targetFormat],
    width,
    height,
    quality: normalizeQuality(input.targetFormat, input.quality)
  });
}
function renderImageConverter(out, _ctx) {
  return `${out.fileName}	${out.mimeType}	${out.width}x${out.height}	q=${out.quality}`;
}
var imageConverterTool = {
  id: "image-converter",
  tier: "T2",
  capabilities: ["canvas", "file"],
  inputs: [
    { name: "fileName", kind: "text", required: true, labelKey: "tools.fileName" },
    { name: "sourceWidth", kind: "number", required: true, labelKey: "tools.width" },
    { name: "sourceHeight", kind: "number", required: true, labelKey: "tools.height" },
    {
      name: "targetFormat",
      kind: "select",
      required: false,
      labelKey: "tools.format",
      default: "png",
      options: [
        { value: "png", labelKey: "tools.formatPng" },
        { value: "jpeg", labelKey: "tools.formatJpeg" },
        { value: "webp", labelKey: "tools.formatWebp" }
      ]
    },
    { name: "quality", kind: "number", required: false, labelKey: "tools.quality", default: 90 },
    { name: "scalePercent", kind: "number", required: false, labelKey: "tools.scale", default: 100 }
  ],
  parse: parseImageConverter,
  run: runImageConverter,
  render: renderImageConverter
};

// shared/tools/image-editor.ts
var ALLOWED_ROTATIONS = [0, 90, 180, 270];
function normalizeRotation(rotation) {
  const normalized = (rotation % 360 + 360) % 360;
  const index = Math.round(normalized / 90) % 4;
  return ALLOWED_ROTATIONS[index];
}
function clampCrop(crop, width, height) {
  const x = clampInt(crop.x, 0, Math.max(0, width - 1));
  const y = clampInt(crop.y, 0, Math.max(0, height - 1));
  const w = clampInt(crop.width, 1, Math.max(1, width - x));
  const h = clampInt(crop.height, 1, Math.max(1, height - y));
  return { x, y, width: w, height: h };
}
function parseImageEditor(raw, _ctx) {
  const width = readInt(raw, "width", 0);
  const height = readInt(raw, "height", 0);
  if (width <= 0 || height <= 0) return toolFail("invalidInput", "tools.invalidInput");
  return toolOk({
    width,
    height,
    cropX: clampInt(readInt(raw, "cropX", 0), 0, width),
    cropY: clampInt(readInt(raw, "cropY", 0), 0, height),
    cropWidth: clampInt(readInt(raw, "cropWidth", width), 1, width),
    cropHeight: clampInt(readInt(raw, "cropHeight", height), 1, height),
    rotation: readInt(raw, "rotation", 0),
    scalePercent: clampInt(readInt(raw, "scalePercent", 100), 1, 400),
    flipX: raw.flipX === true,
    flipY: raw.flipY === true
  });
}
function runImageEditor(input, _ctx) {
  const crop = clampCrop(
    { x: input.cropX, y: input.cropY, width: input.cropWidth, height: input.cropHeight },
    input.width,
    input.height
  );
  const rotation = normalizeRotation(input.rotation);
  const swap = rotation === 90 || rotation === 270;
  const factor = input.scalePercent / 100;
  return toolOk({
    crop,
    rotation,
    scalePercent: input.scalePercent,
    flipX: input.flipX,
    flipY: input.flipY,
    outputWidth: Math.max(1, Math.round((swap ? crop.height : crop.width) * factor)),
    outputHeight: Math.max(1, Math.round((swap ? crop.width : crop.height) * factor))
  });
}
function renderImageEditor(out, _ctx) {
  return [
    `crop	${out.crop.x},${out.crop.y} ${out.crop.width}x${out.crop.height}`,
    `rotate	${out.rotation}`,
    `scale	${out.scalePercent}%`,
    `flip	${out.flipX ? "X" : "-"}${out.flipY ? "Y" : "-"}`,
    `output	${out.outputWidth}x${out.outputHeight}`
  ].join("\n");
}
var imageEditorTool = {
  id: "image-editor",
  tier: "T2",
  capabilities: ["canvas", "file"],
  inputs: [
    { name: "width", kind: "number", required: true, labelKey: "tools.width" },
    { name: "height", kind: "number", required: true, labelKey: "tools.height" },
    { name: "cropX", kind: "number", required: false, labelKey: "tools.cropX", default: 0 },
    { name: "cropY", kind: "number", required: false, labelKey: "tools.cropY", default: 0 },
    { name: "cropWidth", kind: "number", required: false, labelKey: "tools.cropWidth", default: 0 },
    { name: "cropHeight", kind: "number", required: false, labelKey: "tools.cropHeight", default: 0 },
    {
      name: "rotation",
      kind: "select",
      required: false,
      labelKey: "tools.rotation",
      default: 0,
      options: [
        { value: "0", labelKey: "tools.rotate0" },
        { value: "90", labelKey: "tools.rotate90" },
        { value: "180", labelKey: "tools.rotate180" },
        { value: "270", labelKey: "tools.rotate270" }
      ]
    },
    { name: "scalePercent", kind: "number", required: false, labelKey: "tools.scale", default: 100 },
    { name: "flipX", kind: "boolean", required: false, labelKey: "tools.flipX", default: false },
    { name: "flipY", kind: "boolean", required: false, labelKey: "tools.flipY", default: false }
  ],
  parse: parseImageEditor,
  run: runImageEditor,
  render: renderImageEditor
};

// shared/tools/calculator.ts
var MODES8 = ["expression", "binary", "convert"];
function computeBinary(a, b, op) {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      return b !== 0 ? a / b : NaN;
    case "%":
      return b !== 0 ? a % b : NaN;
    default:
      return b;
  }
}
var PRECEDENCE = { "+": 1, "-": 1, "*": 2, "/": 2, "%": 2, "^": 3 };
var RIGHT_ASSOCIATIVE = /* @__PURE__ */ new Set(["^"]);
function tokenizeExpression(input) {
  const tokens = [];
  let i = 0;
  let expectOperand = true;
  while (i < input.length) {
    const ch = input[i];
    if (ch === " " || ch === "	") {
      i++;
      continue;
    }
    if (ch === "(") {
      tokens.push({ kind: "lparen" });
      i++;
      expectOperand = true;
      continue;
    }
    if (ch === ")") {
      tokens.push({ kind: "rparen" });
      i++;
      expectOperand = false;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < input.length && /[0-9.]/.test(input[j])) j++;
      const literal = input.slice(i, j);
      const value = Number.parseFloat(literal);
      if (Number.isNaN(value)) throw new Error("invalidNumber");
      tokens.push({ kind: "number", value });
      i = j;
      expectOperand = false;
      continue;
    }
    if ("+-*/%^".includes(ch)) {
      if (expectOperand && (ch === "-" || ch === "+")) {
        const sign = ch === "-" ? -1 : 1;
        i++;
        let j = i;
        while (j < input.length && /[0-9.]/.test(input[j])) j++;
        if (j === i) throw new Error("invalidExpression");
        const value = Number.parseFloat(input.slice(i, j));
        if (Number.isNaN(value)) throw new Error("invalidNumber");
        tokens.push({ kind: "number", value: sign * value });
        i = j;
        expectOperand = false;
        continue;
      }
      tokens.push({ kind: "operator", value: ch });
      i++;
      expectOperand = true;
      continue;
    }
    throw new Error("invalidExpression");
  }
  return tokens;
}
function evaluateExpression(input) {
  const tokens = tokenizeExpression(input.trim());
  if (tokens.length === 0) throw new Error("emptyInput");
  const output = [];
  const operators = [];
  const popToOutput = () => {
    const op = operators.pop();
    if (op !== void 0) output.push({ kind: "operator", value: op });
  };
  for (const token of tokens) {
    if (token.kind === "number") {
      output.push({ kind: "number", value: token.value });
      continue;
    }
    if (token.kind === "lparen") {
      operators.push("(");
      continue;
    }
    if (token.kind === "rparen") {
      while (operators.length > 0 && operators[operators.length - 1] !== "(") popToOutput();
      if (operators.length === 0) throw new Error("invalidExpression");
      operators.pop();
      continue;
    }
    const current = token.value;
    while (operators.length > 0) {
      const top = operators[operators.length - 1];
      if (top === "(") break;
      const topPrec = PRECEDENCE[top] ?? 0;
      const curPrec = PRECEDENCE[current] ?? 0;
      if (topPrec > curPrec || topPrec === curPrec && !RIGHT_ASSOCIATIVE.has(current)) {
        popToOutput();
      } else {
        break;
      }
    }
    operators.push(current);
  }
  while (operators.length > 0) {
    const top = operators[operators.length - 1];
    if (top === "(") throw new Error("invalidExpression");
    popToOutput();
  }
  const stack = [];
  for (const token of output) {
    if (token.kind === "number") {
      stack.push(token.value);
      continue;
    }
    const b = stack.pop();
    const a = stack.pop();
    if (a === void 0 || b === void 0) throw new Error("invalidExpression");
    const result = token.value === "^" ? Math.pow(a, b) : computeBinary(a, b, token.value);
    if (Number.isNaN(result)) throw new Error("invalidExpression");
    stack.push(result);
  }
  if (stack.length !== 1) throw new Error("invalidExpression");
  return stack[0];
}
var LENGTH_UNITS = [
  { id: "mm", toBase: (v) => v / 1e3, fromBase: (v) => v * 1e3 },
  { id: "cm", toBase: (v) => v / 100, fromBase: (v) => v * 100 },
  { id: "m", toBase: (v) => v, fromBase: (v) => v },
  { id: "km", toBase: (v) => v * 1e3, fromBase: (v) => v / 1e3 },
  { id: "inch", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
  { id: "ft", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 }
];
var WEIGHT_UNITS = [
  { id: "mg", toBase: (v) => v / 1e3, fromBase: (v) => v * 1e3 },
  { id: "g", toBase: (v) => v, fromBase: (v) => v },
  { id: "kg", toBase: (v) => v * 1e3, fromBase: (v) => v / 1e3 },
  { id: "lb", toBase: (v) => v * 453.59237, fromBase: (v) => v / 453.59237 },
  { id: "oz", toBase: (v) => v * 28.349523125, fromBase: (v) => v / 28.349523125 }
];
var TEMPERATURE_UNITS = [
  { id: "c", toBase: (v) => v, fromBase: (v) => v },
  { id: "f", toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => v * 9 / 5 + 32 },
  { id: "k", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 }
];
var UNIT_GROUPS = {
  length: LENGTH_UNITS,
  weight: WEIGHT_UNITS,
  temperature: TEMPERATURE_UNITS
};
function convertUnit(value, fromUnit, toUnit) {
  for (const group of Object.values(UNIT_GROUPS)) {
    const from = group.find((u) => u.id === fromUnit);
    const to = group.find((u) => u.id === toUnit);
    if (from && to) return to.fromBase(from.toBase(value));
  }
  return NaN;
}
function parseCalculator(raw, _ctx) {
  const mode = readEnum(raw, "mode", MODES8, "expression");
  const expression = readString(raw, "expression") ?? "";
  if (mode === "expression" && expression.trim().length === 0) {
    return toolFail("emptyInput", "tools.emptyInput");
  }
  return toolOk({
    mode,
    expression,
    a: readInt(raw, "a", 0),
    b: readInt(raw, "b", 0),
    op: readString(raw, "op") ?? "+",
    value: readInt(raw, "value", 0),
    fromUnit: readString(raw, "fromUnit") ?? "m",
    toUnit: readString(raw, "toUnit") ?? "cm"
  });
}
function formatNumber(value) {
  if (Number.isNaN(value) || !Number.isFinite(value)) return "NaN";
  return String(Number(value.toFixed(10)));
}
function runCalculator(input, _ctx) {
  try {
    if (input.mode === "expression") {
      const value2 = evaluateExpression(input.expression);
      return toolOk({ value: value2, display: formatNumber(value2) });
    }
    if (input.mode === "binary") {
      const value2 = computeBinary(input.a, input.b, input.op);
      if (Number.isNaN(value2)) return toolFail("invalidInput", "tools.invalidInput");
      return toolOk({ value: value2, display: formatNumber(value2) });
    }
    const value = convertUnit(input.value, input.fromUnit, input.toUnit);
    if (Number.isNaN(value)) return toolFail("invalidInput", "tools.invalidInput");
    return toolOk({ value, display: formatNumber(value) });
  } catch {
    return toolFail("invalidExpression", "tools.invalidExpression");
  }
}
function renderCalculator(out, _ctx) {
  return out.display;
}
var calculatorTool = {
  id: "calculator",
  tier: "T1",
  capabilities: [],
  inputs: [
    {
      name: "mode",
      kind: "select",
      required: false,
      labelKey: "tools.mode",
      default: "expression",
      options: [
        { value: "expression", labelKey: "tools.calcExpression" },
        { value: "binary", labelKey: "tools.calcBinary" },
        { value: "convert", labelKey: "tools.calcConvert" }
      ]
    },
    { name: "expression", kind: "text", required: false, labelKey: "tools.calcExpression" },
    { name: "a", kind: "number", required: false, labelKey: "tools.calcA", default: 0 },
    { name: "b", kind: "number", required: false, labelKey: "tools.calcB", default: 0 },
    { name: "op", kind: "text", required: false, labelKey: "tools.calcOp", default: "+" },
    { name: "value", kind: "number", required: false, labelKey: "tools.calcValue", default: 0 },
    { name: "fromUnit", kind: "text", required: false, labelKey: "tools.calcFromUnit", default: "m" },
    { name: "toUnit", kind: "text", required: false, labelKey: "tools.calcToUnit", default: "cm" }
  ],
  parse: parseCalculator,
  run: runCalculator,
  render: renderCalculator
};

// shared/constants/domains.ts
var PUBLIC_SITE_DOMAIN = "aaigc.online";
var PUBLIC_SITE_ORIGIN = `https://${PUBLIC_SITE_DOMAIN}`;
var STATS_SITE_ORIGIN = `https://stats.${PUBLIC_SITE_DOMAIN}`;
var STATS_PREVIEW_SITE_ORIGIN = `https://stats-pre.${PUBLIC_SITE_DOMAIN}`;
var CONTACT_EMAIL = `AAIGC@${PUBLIC_SITE_DOMAIN}`;

// shared/constants/endpoints.ts
function readEnv(name) {
  return typeof process !== "undefined" && process.env ? process.env[name] ?? "" : "";
}
function parseList(raw) {
  return raw.split(",").map((part) => part.trim()).filter((part) => part.length > 0);
}
function dnsDohEndpoints() {
  return parseList(readEnv("DNS_DOH_ENDPOINTS"));
}
function ipGeoEndpoints() {
  return parseList(readEnv("IP_GEO_ENDPOINTS"));
}
function ipEchoEndpoint() {
  return readEnv("IP_ECHO_ENDPOINT");
}
function productUrlMap() {
  const raw = readEnv("PRODUCT_URL_MAP_JSON");
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (!value || typeof value !== "object" || Array.isArray(value)) continue;
      const entry = value;
      const item = {};
      if (typeof entry.url === "string") item.url = entry.url;
      if (typeof entry.previewUrl === "string") item.previewUrl = entry.previewUrl;
      if (typeof entry.productionUrl === "string") item.productionUrl = entry.productionUrl;
      out[key] = item;
    }
    return out;
  } catch {
    return {};
  }
}

// shared/tools/ip-lookup.ts
var IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
function isIpv4(value) {
  const match = IPV4_RE.exec(value.trim());
  if (!match) return false;
  return match.slice(1).every((part) => {
    const n = Number.parseInt(part, 10);
    return n >= 0 && n <= 255;
  });
}
function isIpv6(value) {
  const text = value.trim();
  if (text.length === 0 || text.length > 45) return false;
  if (text.split("::").length > 2) return false;
  return /^[0-9a-fA-F:.]+$/.test(text) && /:/.test(text);
}
function isValidIp(value) {
  return isIpv4(value) || isIpv6(value);
}
function isPrivateOrReserved(ip) {
  const text = ip.trim();
  if (isIpv6(text)) {
    const lower = text.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    if (/^f[cd]/.test(lower)) return true;
    if (lower.startsWith("fe80")) return true;
    return false;
  }
  const match = IPV4_RE.exec(text);
  if (!match) return false;
  const [, a, b] = match;
  const first = Number.parseInt(a, 10);
  const second = Number.parseInt(b, 10);
  if (first === 10) return true;
  if (first === 127) return true;
  if (first === 0) return true;
  if (first === 169 && second === 254) return true;
  if (first === 172 && second >= 16 && second <= 31) return true;
  if (first === 192 && second === 168) return true;
  if (first === 100 && second >= 64 && second <= 127) return true;
  if (first >= 224) return true;
  return false;
}
var DATACENTER_KEYWORDS = [
  "cloud",
  "datacenter",
  "hosting",
  "amazon",
  "google cloud",
  "azure",
  "alibaba",
  "tencent",
  "huawei cloud",
  "backbone",
  "idc",
  "ovh",
  "digitalocean",
  "linode",
  "vultr",
  "hetzner"
];
var EDU_KEYWORDS = ["edu", "university", "college", "school", "cernet", "ac.cn", "sch.cn"];
var GOV_KEYWORDS = ["gov", "government", "state", "federal", "municipal"];
var CDN_KEYWORDS = ["cdn", "cloudflare", "fastly", "akamai", "cloudfront"];
function guessUsage(org) {
  const lower = org.toLowerCase();
  if (CDN_KEYWORDS.some((k) => lower.includes(k))) return "cdn";
  if (DATACENTER_KEYWORDS.some((k) => lower.includes(k))) return "datacenter";
  if (EDU_KEYWORDS.some((k) => lower.includes(k))) return "education";
  if (GOV_KEYWORDS.some((k) => lower.includes(k))) return "government";
  if (lower.length === 0) return "unknown";
  return "isp";
}
function normalizeGeoResponse(data) {
  const org = data.org ?? data.isp ?? data.organization ?? "";
  let usage = guessUsage(org);
  if (data.hosting === true) usage = "datacenter";
  else if (data.proxy === true) usage = "proxy";
  else if (data.mobile === true) usage = "mobile";
  return {
    ip: data.ip ?? data.query ?? "",
    country: data.country_name ?? data.country ?? "",
    region: data.regionName ?? data.region_name ?? data.region ?? "",
    city: data.city ?? "",
    isp: data.isp ?? data.org ?? data.organization ?? "",
    usage
  };
}
function parseIpLookup(raw, _ctx) {
  const ip = (readString(raw, "ip") ?? "").trim();
  if (ip.length === 0) return toolFail("emptyInput", "tools.emptyInput");
  if (!isValidIp(ip)) return toolFail("invalidInput", "tools.invalidInput");
  return toolOk({ ip });
}
async function runIpLookup(input, ctx) {
  const isPrivate = isPrivateOrReserved(input.ip);
  if (isPrivate) {
    return toolOk({
      ip: input.ip,
      country: "",
      region: "",
      city: "",
      isp: "",
      usage: "unknown",
      isPrivate: true
    });
  }
  if (!ctx.fetchJson) return toolFail("unsupportedPlatform", "tools.unsupportedPlatform");
  const endpoints = ipGeoEndpoints();
  if (endpoints.length === 0) return toolFail("networkFailed", "tools.networkFailed");
  for (const endpoint of endpoints) {
    try {
      const url = endpoint.replace("{ip}", encodeURIComponent(input.ip));
      const data = await ctx.fetchJson(url);
      const normalized = normalizeGeoResponse(data);
      if (normalized.ip.length > 0 || normalized.city.length > 0) {
        return toolOk({ ...normalized, isPrivate: false });
      }
    } catch {
    }
  }
  return toolOk({
    ip: input.ip,
    country: "",
    region: "",
    city: "",
    isp: "",
    usage: "unknown",
    isPrivate: false
  });
}
function renderIpLookup(out, _ctx) {
  return [
    `ip	${out.ip}`,
    `country	${out.country}`,
    `region	${out.region}`,
    `city	${out.city}`,
    `isp	${out.isp}`,
    `usage	${out.usage}`
  ].join("\n");
}
var ipLookupTool = {
  id: "ip-lookup",
  tier: "T3",
  capabilities: ["network"],
  inputs: [{ name: "ip", kind: "text", required: true, labelKey: "tools.ipAddress" }],
  parse: parseIpLookup,
  run: runIpLookup,
  render: renderIpLookup
};
async function fetchPublicIp(ctx) {
  const endpoint = ipEchoEndpoint();
  if (!ctx.fetchJson || endpoint.length === 0) {
    return toolFail("networkFailed", "tools.networkFailed");
  }
  try {
    const data = await ctx.fetchJson(endpoint);
    if (typeof data.ip === "string" && data.ip.length > 0) return toolOk({ ip: data.ip });
    return toolFail("networkFailed", "tools.networkFailed");
  } catch {
    return toolFail("networkFailed", "tools.networkFailed");
  }
}

// shared/tools/dns-lookup.ts
var VALID_DNS_TYPES = [
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "NS",
  "TXT",
  "SOA",
  "SRV",
  "CAA",
  "PTR"
];
var DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/;
function normalizeDomain(input) {
  return input.trim().replace(/^[a-z][a-z0-9+.-]*:\/\//i, "").split("/")[0].split("?")[0].split("#")[0].replace(/:\d+$/, "").toLowerCase();
}
function parseDnsLookup(raw, _ctx) {
  const rawName = (readString(raw, "name") ?? "").trim();
  if (rawName.length === 0) return toolFail("emptyInput", "tools.missingDomain");
  if (rawName.length > 253) return toolFail("outOfRange", "tools.domainTooLong");
  const typeInput = (readString(raw, "type") ?? "A").toUpperCase();
  if (!VALID_DNS_TYPES.includes(typeInput)) {
    return toolFail("invalidInput", "tools.invalidDnsType");
  }
  const name = normalizeDomain(rawName);
  if (!DOMAIN_RE.test(name)) return toolFail("invalidInput", "tools.invalidDomain");
  return toolOk({ name, type: typeInput });
}
async function runDnsLookup(input, ctx) {
  const endpoints = dnsDohEndpoints();
  if (!ctx.fetchJson) return toolFail("unsupportedPlatform", "tools.unsupportedPlatform");
  if (endpoints.length === 0) return toolFail("networkFailed", "tools.networkFailed");
  const query = `?name=${encodeURIComponent(input.name)}&type=${encodeURIComponent(input.type)}`;
  let lastAuthority = [];
  for (const endpoint of endpoints) {
    try {
      const data = await ctx.fetchJson(`${endpoint}${query}`, {
        headers: { accept: "application/dns-json" }
      });
      if (data.Answer && data.Answer.length > 0) {
        return toolOk({
          name: input.name,
          type: input.type,
          answers: data.Answer,
          authority: [],
          note: null
        });
      }
      if (data.Authority && data.Authority.length > 0) lastAuthority = data.Authority;
    } catch {
    }
  }
  if (lastAuthority.length > 0) {
    return toolOk({
      name: input.name,
      type: input.type,
      answers: lastAuthority,
      authority: lastAuthority,
      note: `No ${input.type} records \u2014 showing SOA/NS instead`
    });
  }
  return toolFail("networkFailed", "tools.dnsNoRecords");
}
function renderDnsLookup(out, _ctx) {
  const lines = out.answers.map((answer) => `${answer.name}	${answer.type}	${answer.data}`);
  if (out.note) lines.unshift(`# ${out.note}`);
  return lines.join("\n");
}
var dnsLookupTool = {
  id: "dns-lookup",
  tier: "T3",
  capabilities: ["network"],
  inputs: [
    { name: "name", kind: "text", required: true, labelKey: "tools.domain" },
    {
      name: "type",
      kind: "select",
      required: false,
      labelKey: "tools.dnsType",
      default: "A",
      options: VALID_DNS_TYPES.map((type) => ({ value: type, labelKey: `tools.dnsType${type}` }))
    }
  ],
  parse: parseDnsLookup,
  run: runDnsLookup,
  render: renderDnsLookup
};

// shared/tools/http-status-codes.ts
var RAW = [
  { code: 100, name: "Continue" },
  { code: 101, name: "Switching Protocols" },
  { code: 102, name: "Processing" },
  { code: 200, name: "OK" },
  { code: 201, name: "Created" },
  { code: 202, name: "Accepted" },
  { code: 204, name: "No Content" },
  { code: 301, name: "Moved Permanently" },
  { code: 302, name: "Found" },
  { code: 304, name: "Not Modified" },
  { code: 307, name: "Temporary Redirect" },
  { code: 308, name: "Permanent Redirect" },
  { code: 400, name: "Bad Request" },
  { code: 401, name: "Unauthorized" },
  { code: 403, name: "Forbidden" },
  { code: 404, name: "Not Found" },
  { code: 405, name: "Method Not Allowed" },
  { code: 408, name: "Request Timeout" },
  { code: 409, name: "Conflict" },
  { code: 410, name: "Gone" },
  { code: 422, name: "Unprocessable Entity" },
  { code: 429, name: "Too Many Requests" },
  { code: 500, name: "Internal Server Error" },
  { code: 502, name: "Bad Gateway" },
  { code: 503, name: "Service Unavailable" },
  { code: 504, name: "Gateway Timeout" }
];
function categoryOf(code) {
  if (code < 200) return "info";
  if (code < 300) return "success";
  if (code < 400) return "redirect";
  if (code < 500) return "clientError";
  return "serverError";
}
var CATEGORY_KEYS = {
  info: "tools.httpInfo",
  success: "tools.httpSuccess",
  redirect: "tools.httpRedirect",
  clientError: "tools.httpClientError",
  serverError: "tools.httpServerError"
};
var HTTP_STATUS_CODES = RAW.map((entry) => ({
  code: entry.code,
  name: entry.name,
  category: categoryOf(entry.code),
  messageKey: `tools.httpStatus${entry.code}`,
  categoryKey: CATEGORY_KEYS[categoryOf(entry.code)]
}));
function parseHttpStatusCodes(raw, _ctx) {
  return toolOk({ query: (readString(raw, "query") ?? "").trim() });
}
function runHttpStatusCodes(input, _ctx) {
  const query = input.query.toLowerCase();
  const entries = query ? HTTP_STATUS_CODES.filter(
    (entry) => String(entry.code).includes(query) || entry.name.toLowerCase().includes(query) || entry.messageKey.toLowerCase().includes(query)
  ) : [...HTTP_STATUS_CODES];
  return toolOk({ entries, total: entries.length });
}
function renderHttpStatusCodes(out, _ctx) {
  return out.entries.map((entry) => `${entry.code}	${entry.name}`).join("\n");
}
var httpStatusCodesTool = {
  id: "http-status-codes",
  tier: "T1",
  capabilities: [],
  inputs: [{ name: "query", kind: "text", required: false, labelKey: "tools.search" }],
  parse: parseHttpStatusCodes,
  run: runHttpStatusCodes,
  render: renderHttpStatusCodes
};

// shared/tools/user-agent-parser.ts
var BROWSER_KEYS = {
  chrome: "tools.uaChrome",
  edge: "tools.uaEdge",
  firefox: "tools.uaFirefox",
  safari: "tools.uaSafari",
  opera: "tools.uaOpera",
  bot: "tools.uaBot",
  unknown: "tools.uaUnknown"
};
var OS_KEYS = {
  windows: "tools.uaWindows",
  macos: "tools.uaMacos",
  android: "tools.uaAndroid",
  ios: "tools.uaIos",
  linux: "tools.uaLinux",
  unknown: "tools.uaUnknown"
};
var DEVICE_KEYS = {
  mobile: "tools.uaMobile",
  tablet: "tools.uaTablet",
  desktop: "tools.uaDesktop"
};
function detectBrowser(ua) {
  if (/bot|crawler|spider|crawling/i.test(ua)) return "bot";
  if (ua.includes("Edg/")) return "edge";
  if (ua.includes("OPR/") || ua.includes("Opera")) return "opera";
  if (ua.includes("Firefox/")) return "firefox";
  if (ua.includes("Chrome/")) return "chrome";
  if (ua.includes("Safari/")) return "safari";
  return "unknown";
}
function detectOs(ua) {
  if (/Windows/i.test(ua)) return "windows";
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Macintosh|Mac OS X/i.test(ua)) return "macos";
  if (/Linux/i.test(ua)) return "linux";
  return "unknown";
}
function detectDevice(ua, os) {
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android/i.test(ua)) return os === "android" || os === "ios" ? "mobile" : "mobile";
  return "desktop";
}
function parseUserAgentParser(raw, _ctx) {
  const userAgent = (readString(raw, "userAgent") ?? "").trim();
  if (userAgent.length === 0) return toolFail("emptyInput", "tools.emptyInput");
  return toolOk({ userAgent });
}
function runUserAgentParser(input, _ctx) {
  const browser = detectBrowser(input.userAgent);
  const os = detectOs(input.userAgent);
  const device = detectDevice(input.userAgent, os);
  return toolOk({
    browser,
    browserKey: BROWSER_KEYS[browser],
    os,
    osKey: OS_KEYS[os],
    device,
    deviceKey: DEVICE_KEYS[device],
    raw: input.userAgent
  });
}
function renderUserAgentParser(out, _ctx) {
  return [`browser	${out.browser}`, `os	${out.os}`, `device	${out.device}`].join("\n");
}
var userAgentParserTool = {
  id: "user-agent-parser",
  tier: "T1",
  capabilities: [],
  inputs: [
    { name: "userAgent", kind: "textarea", required: true, labelKey: "tools.uaPlaceholder" }
  ],
  parse: parseUserAgentParser,
  run: runUserAgentParser,
  render: renderUserAgentParser
};

// shared/tools/timestamp.ts
var MODES9 = ["toDate", "toTimestamp"];
var PARTS_FORMAT = /* @__PURE__ */ new Map();
function partsFormatter(timeZone) {
  const cached = PARTS_FORMAT.get(timeZone);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  PARTS_FORMAT.set(timeZone, formatter);
  return formatter;
}
function zonedParts(epochMs, timeZone) {
  const parts = partsFormatter(timeZone).formatToParts(new Date(epochMs));
  const values = {};
  for (const part of parts) values[part.type] = part.value;
  return {
    year: Number.parseInt(values.year ?? "1970", 10),
    month: Number.parseInt(values.month ?? "01", 10),
    day: Number.parseInt(values.day ?? "01", 10),
    hour: Number.parseInt(values.hour ?? "00", 10),
    minute: Number.parseInt(values.minute ?? "00", 10),
    second: Number.parseInt(values.second ?? "00", 10)
  };
}
function zoneOffsetMs(epochMs, timeZone) {
  const parts = zonedParts(epochMs, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second, 0);
  return asUtc - Math.floor(epochMs / 1e3) * 1e3;
}
function zonedWallClockToEpoch(parts, timeZone) {
  const naive = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    parts.millisecond
  );
  const firstOffset = zoneOffsetMs(naive, timeZone);
  let epoch = naive - firstOffset;
  const secondOffset = zoneOffsetMs(epoch, timeZone);
  if (secondOffset !== firstOffset) epoch = naive - secondOffset;
  return epoch;
}
function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
function formatZoned(epochMs, timeZone, withMillis) {
  const parts = zonedParts(epochMs, timeZone);
  const base = `${parts.year}-${padNumber(parts.month, 2)}-${padNumber(parts.day, 2)} ${padNumber(
    parts.hour,
    2
  )}:${padNumber(parts.minute, 2)}:${padNumber(parts.second, 2)}`;
  if (!withMillis) return base;
  const millis = (epochMs % 1e3 + 1e3) % 1e3;
  return `${base}.${padNumber(millis, 3)}`;
}
function parseTimestamp(raw, ctx) {
  const mode = readEnum(raw, "mode", MODES9, "toDate");
  if (mode === "toDate") {
    const timestamp = (readString(raw, "timestamp") ?? "").trim();
    if (timestamp.length === 0) return toolFail("emptyInput", "tools.emptyInput");
    const parsed = Number.parseInt(timestamp, 10);
    if (!Number.isFinite(parsed)) return toolFail("invalidTimestamp", "tools.invalidTimestamp");
    return toolOk({
      mode,
      timestamp,
      year: 1970,
      month: 1,
      day: 1,
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0
    });
  }
  const nowParts = zonedParts(ctx.now(), ctx.timezone);
  const year = readInt(raw, "year", nowParts.year);
  const month = readInt(raw, "month", nowParts.month);
  if (month < 1 || month > 12) return toolFail("invalidDate", "tools.invalidDate");
  const day = readInt(raw, "day", nowParts.day);
  if (day < 1 || day > daysInMonth(year, month)) return toolFail("invalidDate", "tools.invalidDate");
  return toolOk({
    mode,
    timestamp: "",
    year,
    month,
    day,
    hour: readInt(raw, "hour", 0),
    minute: readInt(raw, "minute", 0),
    second: readInt(raw, "second", 0),
    millisecond: readInt(raw, "millisecond", 0)
  });
}
function runTimestamp(input, ctx) {
  if (input.mode === "toDate") {
    const raw = Number.parseInt(input.timestamp, 10);
    if (!Number.isFinite(raw)) return toolFail("invalidTimestamp", "tools.invalidTimestamp");
    const epochMs2 = raw < 1e12 ? raw * 1e3 : raw;
    if (!Number.isFinite(new Date(epochMs2).getTime())) {
      return toolFail("invalidTimestamp", "tools.invalidTimestamp");
    }
    return toolOk({
      localText: formatZoned(epochMs2, ctx.timezone, true),
      utcIso: new Date(epochMs2).toISOString(),
      epochMs: epochMs2,
      epochSeconds: Math.floor(epochMs2 / 1e3),
      millisecond: 0
    });
  }
  const epochMs = zonedWallClockToEpoch(
    {
      year: input.year,
      month: input.month,
      day: input.day,
      hour: input.hour,
      minute: input.minute,
      second: input.second,
      millisecond: input.millisecond
    },
    ctx.timezone
  );
  if (!Number.isFinite(epochMs)) return toolFail("invalidDate", "tools.invalidDate");
  return toolOk({
    localText: formatZoned(epochMs, ctx.timezone, true),
    utcIso: new Date(epochMs).toISOString(),
    epochMs,
    epochSeconds: Math.floor(epochMs / 1e3),
    millisecond: input.millisecond
  });
}
function renderTimestamp(out, _ctx) {
  return [`local	${out.localText}`, `utc	${out.utcIso}`, `seconds	${out.epochSeconds}`, `ms	${out.epochMs}`].join("\n");
}
var timestampTool = {
  id: "timestamp",
  tier: "T1",
  capabilities: [],
  inputs: [
    {
      name: "mode",
      kind: "select",
      required: false,
      labelKey: "tools.mode",
      default: "toDate",
      options: [
        { value: "toDate", labelKey: "tools.timestampToDate" },
        { value: "toTimestamp", labelKey: "tools.dateToTimestamp" }
      ]
    },
    { name: "timestamp", kind: "text", required: false, labelKey: "tools.timestamp" },
    { name: "year", kind: "number", required: false, labelKey: "tools.year" },
    { name: "month", kind: "number", required: false, labelKey: "tools.month" },
    { name: "day", kind: "number", required: false, labelKey: "tools.day" },
    { name: "hour", kind: "number", required: false, labelKey: "tools.hour" },
    { name: "minute", kind: "number", required: false, labelKey: "tools.minute" },
    { name: "second", kind: "number", required: false, labelKey: "tools.ss" },
    { name: "millisecond", kind: "number", required: false, labelKey: "tools.ms" }
  ],
  parse: parseTimestamp,
  run: runTimestamp,
  render: renderTimestamp
};

// shared/tools/date-calculator.ts
var MODES10 = ["diff", "add"];
function daysInMonthUtc(year, month) {
  return daysInMonth(year, month);
}
function formatDateParts(parts) {
  return `${parts.year}-${padNumber(parts.month, 2)}-${padNumber(parts.day, 2)} ${padNumber(
    parts.hour,
    2
  )}:${padNumber(parts.minute, 2)}:${padNumber(parts.second, 2)}`;
}
function partsFromEpoch(epochMs) {
  const date = new Date(epochMs);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds()
  };
}
function addCalendar(parts, years, months, days) {
  const totalMonths = parts.month - 1 + months;
  const yearCarry = Math.floor(totalMonths / 12);
  let year = parts.year + years + yearCarry;
  let month = (totalMonths % 12 + 12) % 12 + 1;
  let day = parts.day;
  const maxDay = daysInMonthUtc(year, month);
  if (day > maxDay) day = maxDay;
  const base = Date.UTC(year, month - 1, day, parts.hour, parts.minute, parts.second);
  const shifted = new Date(base + days * 864e5);
  year = shifted.getUTCFullYear();
  month = shifted.getUTCMonth() + 1;
  day = shifted.getUTCDate();
  return { year, month, day, hour: parts.hour, minute: parts.minute, second: parts.second };
}
function readParts(raw, prefix, fallback) {
  const year = readInt(raw, `${prefix}Year`, fallback.year);
  const month = readInt(raw, `${prefix}Month`, fallback.month);
  const day = readInt(raw, `${prefix}Day`, fallback.day);
  if (month < 1 || month > 12) return fallback;
  if (day < 1 || day > daysInMonthUtc(year, month)) return fallback;
  return {
    year,
    month,
    day,
    hour: readInt(raw, `${prefix}Hour`, fallback.hour),
    minute: readInt(raw, `${prefix}Minute`, fallback.minute),
    second: readInt(raw, `${prefix}Second`, fallback.second)
  };
}
function parseDateCalculator(raw, ctx) {
  const nowParts = zonedParts(ctx.now(), ctx.timezone);
  const fallback = {
    year: nowParts.year,
    month: nowParts.month,
    day: nowParts.day,
    hour: 0,
    minute: 0,
    second: 0
  };
  return toolOk({
    mode: readEnum(raw, "mode", MODES10, "diff"),
    start: readParts(raw, "start", fallback),
    end: readParts(raw, "end", fallback),
    deltaYears: readInt(raw, "deltaYears", 0),
    deltaMonths: readInt(raw, "deltaMonths", 0),
    deltaDays: readInt(raw, "deltaDays", 0)
  });
}
function runDateCalculator(input, _ctx) {
  const startMs = Date.UTC(
    input.start.year,
    input.start.month - 1,
    input.start.day,
    input.start.hour,
    input.start.minute,
    input.start.second
  );
  if (input.mode === "diff") {
    const endMs = Date.UTC(
      input.end.year,
      input.end.month - 1,
      input.end.day,
      input.end.hour,
      input.end.minute,
      input.end.second
    );
    const delta2 = endMs - startMs;
    const abs = Math.abs(delta2);
    const totalSeconds2 = Math.floor(abs / 1e3);
    return toolOk({
      epochMs: delta2,
      days: Math.floor(totalSeconds2 / 86400),
      hours: Math.floor(totalSeconds2 % 86400 / 3600),
      minutes: Math.floor(totalSeconds2 % 3600 / 60),
      seconds: totalSeconds2 % 60,
      totalDays: Math.floor(abs / 864e5 * 100) / 100,
      resultText: `${delta2 >= 0 ? "+" : "-"}${Math.floor(totalSeconds2 / 86400)}d ${Math.floor(
        totalSeconds2 % 86400 / 3600
      )}h ${Math.floor(totalSeconds2 % 3600 / 60)}m ${totalSeconds2 % 60}s`,
      startText: formatDateParts(input.start),
      endText: formatDateParts(input.end)
    });
  }
  const target = addCalendar(input.start, input.deltaYears, input.deltaMonths, input.deltaDays);
  const targetMs = Date.UTC(
    target.year,
    target.month - 1,
    target.day,
    target.hour,
    target.minute,
    target.second
  );
  const delta = targetMs - startMs;
  const totalSeconds = Math.floor(Math.abs(delta) / 1e3);
  return toolOk({
    epochMs: targetMs,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor(totalSeconds % 86400 / 3600),
    minutes: Math.floor(totalSeconds % 3600 / 60),
    seconds: totalSeconds % 60,
    totalDays: Math.floor(Math.abs(delta) / 864e5 * 100) / 100,
    resultText: formatDateParts(target),
    startText: formatDateParts(input.start),
    endText: formatDateParts(target)
  });
}
function renderDateCalculator(out, _ctx) {
  return [`start	${out.startText}`, `end	${out.endText}`, `result	${out.resultText}`].join("\n");
}
var dateCalculatorTool = {
  id: "date-calculator",
  tier: "T1",
  capabilities: [],
  inputs: [
    {
      name: "mode",
      kind: "select",
      required: false,
      labelKey: "tools.mode",
      default: "diff",
      options: [
        { value: "diff", labelKey: "tools.dateDiff" },
        { value: "add", labelKey: "tools.dateAdd" }
      ]
    },
    { name: "startYear", kind: "number", required: false, labelKey: "tools.year" },
    { name: "startMonth", kind: "number", required: false, labelKey: "tools.month" },
    { name: "startDay", kind: "number", required: false, labelKey: "tools.day" },
    { name: "endYear", kind: "number", required: false, labelKey: "tools.year" },
    { name: "endMonth", kind: "number", required: false, labelKey: "tools.month" },
    { name: "endDay", kind: "number", required: false, labelKey: "tools.day" },
    { name: "deltaYears", kind: "number", required: false, labelKey: "tools.deltaYears", default: 0 },
    { name: "deltaMonths", kind: "number", required: false, labelKey: "tools.deltaMonths", default: 0 },
    { name: "deltaDays", kind: "number", required: false, labelKey: "tools.deltaDays", default: 0 }
  ],
  parse: parseDateCalculator,
  run: runDateCalculator,
  render: renderDateCalculator
};

// shared/tools/timer.ts
function clampHours(value) {
  return clampInt(value, 0, 99);
}
function clampMinutes(value) {
  return clampInt(value, 0, 59);
}
function clampSeconds(value) {
  return clampInt(value, 0, 59);
}
function formatClock(totalSeconds) {
  const total = Math.max(0, Math.trunc(totalSeconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor(total % 3600 / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${padNumber(m, 2)}:${padNumber(s, 2)}`;
  return `${padNumber(m, 2)}:${padNumber(s, 2)}`;
}
function formatStopwatch(elapsedMs) {
  const total = Math.max(0, Math.trunc(elapsedMs));
  const centiseconds = Math.floor(total % 1e3 / 10);
  const totalSeconds = Math.floor(total / 1e3);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${padNumber(m, 2)}:${padNumber(s, 2)}.${padNumber(centiseconds, 2)}`;
}
function parseTimer(raw, _ctx) {
  const hours = clampHours(readInt(raw, "hours", 0));
  const minutes = clampMinutes(readInt(raw, "minutes", 5));
  const seconds = clampSeconds(readInt(raw, "seconds", 0));
  const elapsedMs = Math.max(0, readInt(raw, "elapsedMs", 0));
  const remainingSeconds = Math.max(0, readInt(raw, "remainingSeconds", 0));
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  if (totalSeconds <= 0 && remainingSeconds <= 0) {
    return toolFail("outOfRange", "tools.outOfRange");
  }
  return toolOk({ hours, minutes, seconds, elapsedMs, remainingSeconds });
}
function runTimer(input, _ctx) {
  const totalSeconds = input.hours * 3600 + input.minutes * 60 + input.seconds;
  const remaining = input.remainingSeconds > 0 ? input.remainingSeconds : totalSeconds;
  const progress = totalSeconds > 0 ? Math.min(1, Math.max(0, 1 - remaining / totalSeconds)) : 0;
  return toolOk({
    totalSeconds,
    remainingText: formatClock(remaining),
    elapsedText: formatStopwatch(input.elapsedMs),
    progress
  });
}
function renderTimer(out, _ctx) {
  return [`remaining	${out.remainingText}`, `elapsed	${out.elapsedText}`].join("\n");
}
var timerTool = {
  id: "timer",
  tier: "T2",
  capabilities: ["timer"],
  inputs: [
    { name: "hours", kind: "number", required: false, labelKey: "tools.hour", default: 0 },
    { name: "minutes", kind: "number", required: false, labelKey: "tools.minute", default: 5 },
    { name: "seconds", kind: "number", required: false, labelKey: "tools.ss", default: 0 },
    { name: "elapsedMs", kind: "number", required: false, labelKey: "tools.elapsed", default: 0 },
    { name: "remainingSeconds", kind: "number", required: false, labelKey: "tools.remaining", default: 0 }
  ],
  parse: parseTimer,
  run: runTimer,
  render: renderTimer
};

// shared/tools/emoji-picker.ts
var CATEGORY_KEYS2 = {
  smileys: "tools.emojiSmileys",
  gestures: "tools.emojiGestures",
  animals: "tools.emojiAnimals",
  food: "tools.emojiFood",
  symbols: "tools.emojiSymbols"
};
var RAW2 = [
  { category: "smileys", emoji: "\u{1F600}", name: "Grinning Face" },
  { category: "smileys", emoji: "\u{1F603}", name: "Grinning Face with Big Eyes" },
  { category: "smileys", emoji: "\u{1F604}", name: "Grinning Face with Smiling Eyes" },
  { category: "smileys", emoji: "\u{1F601}", name: "Beaming Face with Smiling Eyes" },
  { category: "smileys", emoji: "\u{1F602}", name: "Face with Tears of Joy" },
  { category: "smileys", emoji: "\u{1F923}", name: "Rolling on the Floor Laughing" },
  { category: "smileys", emoji: "\u{1F60A}", name: "Smiling Face with Smiling Eyes" },
  { category: "smileys", emoji: "\u{1F607}", name: "Smiling Face with Halo" },
  { category: "smileys", emoji: "\u{1F642}", name: "Slightly Smiling Face" },
  { category: "smileys", emoji: "\u{1F609}", name: "Winking Face" },
  { category: "smileys", emoji: "\u{1F60D}", name: "Smiling Face with Heart-Eyes" },
  { category: "smileys", emoji: "\u{1F970}", name: "Smiling Face with Hearts" },
  { category: "smileys", emoji: "\u{1F618}", name: "Face Blowing a Kiss" },
  { category: "smileys", emoji: "\u{1F60B}", name: "Face Savoring Food" },
  { category: "smileys", emoji: "\u{1F61C}", name: "Winking Face with Tongue" },
  { category: "smileys", emoji: "\u{1F92A}", name: "Zany Face" },
  { category: "smileys", emoji: "\u{1F917}", name: "Hugging Face" },
  { category: "smileys", emoji: "\u{1F914}", name: "Thinking Face" },
  { category: "smileys", emoji: "\u{1F928}", name: "Face with Raised Eyebrow" },
  { category: "smileys", emoji: "\u{1F610}", name: "Neutral Face" },
  { category: "smileys", emoji: "\u{1F611}", name: "Expressionless Face" },
  { category: "smileys", emoji: "\u{1F644}", name: "Face with Rolling Eyes" },
  { category: "smileys", emoji: "\u{1F62C}", name: "Grimacing Face" },
  { category: "smileys", emoji: "\u{1F62E}", name: "Face with Open Mouth" },
  { category: "smileys", emoji: "\u{1F632}", name: "Astonished Face" },
  { category: "smileys", emoji: "\u{1F633}", name: "Flushed Face" },
  { category: "smileys", emoji: "\u{1F97A}", name: "Pleading Face" },
  { category: "smileys", emoji: "\u{1F622}", name: "Crying Face" },
  { category: "smileys", emoji: "\u{1F62D}", name: "Loudly Crying Face" },
  { category: "smileys", emoji: "\u{1F624}", name: "Face with Steam From Nose" },
  { category: "smileys", emoji: "\u{1F621}", name: "Pouting Face" },
  { category: "smileys", emoji: "\u{1F480}", name: "Skull" },
  { category: "smileys", emoji: "\u{1F47B}", name: "Ghost" },
  { category: "smileys", emoji: "\u{1F916}", name: "Robot" },
  { category: "smileys", emoji: "\u{1F389}", name: "Party Popper" },
  { category: "smileys", emoji: "\u2728", name: "Sparkles" },
  { category: "gestures", emoji: "\u{1F44D}", name: "Thumbs Up" },
  { category: "gestures", emoji: "\u{1F44E}", name: "Thumbs Down" },
  { category: "gestures", emoji: "\u{1F44C}", name: "OK Hand" },
  { category: "gestures", emoji: "\u270C\uFE0F", name: "Victory Hand" },
  { category: "gestures", emoji: "\u{1F91E}", name: "Crossed Fingers" },
  { category: "gestures", emoji: "\u{1F91F}", name: "Love-You Gesture" },
  { category: "gestures", emoji: "\u{1F918}", name: "Sign of the Horns" },
  { category: "gestures", emoji: "\u{1F44B}", name: "Waving Hand" },
  { category: "gestures", emoji: "\u{1F44F}", name: "Clapping Hands" },
  { category: "gestures", emoji: "\u{1F64C}", name: "Raising Hands" },
  { category: "gestures", emoji: "\u{1F91D}", name: "Handshake" },
  { category: "gestures", emoji: "\u{1F64F}", name: "Folded Hands" },
  { category: "gestures", emoji: "\u270D\uFE0F", name: "Writing Hand" },
  { category: "gestures", emoji: "\u{1F440}", name: "Eyes" },
  { category: "gestures", emoji: "\u{1F4AA}", name: "Flexed Biceps" },
  { category: "gestures", emoji: "\u{1FAE1}", name: "Saluting Face" },
  { category: "animals", emoji: "\u{1F436}", name: "Dog Face" },
  { category: "animals", emoji: "\u{1F431}", name: "Cat Face" },
  { category: "animals", emoji: "\u{1F42D}", name: "Mouse Face" },
  { category: "animals", emoji: "\u{1F439}", name: "Hamster" },
  { category: "animals", emoji: "\u{1F430}", name: "Rabbit Face" },
  { category: "animals", emoji: "\u{1F98A}", name: "Fox" },
  { category: "animals", emoji: "\u{1F43B}", name: "Bear" },
  { category: "animals", emoji: "\u{1F43C}", name: "Panda" },
  { category: "animals", emoji: "\u{1F428}", name: "Koala" },
  { category: "animals", emoji: "\u{1F42F}", name: "Tiger Face" },
  { category: "animals", emoji: "\u{1F981}", name: "Lion" },
  { category: "animals", emoji: "\u{1F42E}", name: "Cow Face" },
  { category: "animals", emoji: "\u{1F437}", name: "Pig Face" },
  { category: "animals", emoji: "\u{1F438}", name: "Frog" },
  { category: "animals", emoji: "\u{1F435}", name: "Monkey Face" },
  { category: "animals", emoji: "\u{1F414}", name: "Chicken" },
  { category: "animals", emoji: "\u{1F427}", name: "Penguin" },
  { category: "animals", emoji: "\u{1F426}", name: "Bird" },
  { category: "animals", emoji: "\u{1F986}", name: "Duck" },
  { category: "animals", emoji: "\u{1F989}", name: "Owl" },
  { category: "animals", emoji: "\u{1F987}", name: "Bat" },
  { category: "animals", emoji: "\u{1F43A}", name: "Wolf" },
  { category: "animals", emoji: "\u{1F434}", name: "Horse Face" },
  { category: "animals", emoji: "\u{1F984}", name: "Unicorn" },
  { category: "animals", emoji: "\u{1F41D}", name: "Honeybee" },
  { category: "animals", emoji: "\u{1F98B}", name: "Butterfly" },
  { category: "animals", emoji: "\u{1F40C}", name: "Snail" },
  { category: "animals", emoji: "\u{1F422}", name: "Turtle" },
  { category: "animals", emoji: "\u{1F40D}", name: "Snake" },
  { category: "animals", emoji: "\u{1F419}", name: "Octopus" },
  { category: "animals", emoji: "\u{1F41F}", name: "Fish" },
  { category: "animals", emoji: "\u{1F42C}", name: "Dolphin" },
  { category: "animals", emoji: "\u{1F433}", name: "Spouting Whale" },
  { category: "animals", emoji: "\u{1F988}", name: "Shark" },
  { category: "animals", emoji: "\u{1F418}", name: "Elephant" },
  { category: "food", emoji: "\u{1F34E}", name: "Red Apple" },
  { category: "food", emoji: "\u{1F34A}", name: "Tangerine" },
  { category: "food", emoji: "\u{1F34B}", name: "Lemon" },
  { category: "food", emoji: "\u{1F34C}", name: "Banana" },
  { category: "food", emoji: "\u{1F349}", name: "Watermelon" },
  { category: "food", emoji: "\u{1F347}", name: "Grapes" },
  { category: "food", emoji: "\u{1F353}", name: "Strawberry" },
  { category: "food", emoji: "\u{1F352}", name: "Cherries" },
  { category: "food", emoji: "\u{1F351}", name: "Peach" },
  { category: "food", emoji: "\u{1F96D}", name: "Mango" },
  { category: "food", emoji: "\u{1F34D}", name: "Pineapple" },
  { category: "food", emoji: "\u{1F95D}", name: "Kiwi" },
  { category: "food", emoji: "\u{1F345}", name: "Tomato" },
  { category: "food", emoji: "\u{1F951}", name: "Avocado" },
  { category: "food", emoji: "\u{1F33D}", name: "Corn" },
  { category: "food", emoji: "\u{1F955}", name: "Carrot" },
  { category: "food", emoji: "\u{1F35E}", name: "Bread" },
  { category: "food", emoji: "\u{1F9C0}", name: "Cheese Wedge" },
  { category: "food", emoji: "\u{1F354}", name: "Hamburger" },
  { category: "food", emoji: "\u{1F35F}", name: "French Fries" },
  { category: "food", emoji: "\u{1F355}", name: "Pizza" },
  { category: "food", emoji: "\u{1F32E}", name: "Taco" },
  { category: "food", emoji: "\u{1F35C}", name: "Steaming Bowl" },
  { category: "food", emoji: "\u{1F363}", name: "Sushi" },
  { category: "food", emoji: "\u{1F35A}", name: "Cooked Rice" },
  { category: "food", emoji: "\u{1F370}", name: "Shortcake" },
  { category: "food", emoji: "\u{1F382}", name: "Birthday Cake" },
  { category: "food", emoji: "\u{1F36B}", name: "Chocolate Bar" },
  { category: "food", emoji: "\u{1F369}", name: "Doughnut" },
  { category: "food", emoji: "\u2615", name: "Hot Beverage" },
  { category: "food", emoji: "\u{1F37A}", name: "Beer Mug" },
  { category: "symbols", emoji: "\u2764\uFE0F", name: "Red Heart" },
  { category: "symbols", emoji: "\u{1F9E1}", name: "Orange Heart" },
  { category: "symbols", emoji: "\u{1F49B}", name: "Yellow Heart" },
  { category: "symbols", emoji: "\u{1F49A}", name: "Green Heart" },
  { category: "symbols", emoji: "\u{1F499}", name: "Blue Heart" },
  { category: "symbols", emoji: "\u{1F49C}", name: "Purple Heart" },
  { category: "symbols", emoji: "\u{1F5A4}", name: "Black Heart" },
  { category: "symbols", emoji: "\u{1F494}", name: "Broken Heart" },
  { category: "symbols", emoji: "\u{1F4AF}", name: "Hundred Points" },
  { category: "symbols", emoji: "\u{1F525}", name: "Fire" },
  { category: "symbols", emoji: "\u2B50", name: "Star" },
  { category: "symbols", emoji: "\u2705", name: "Check Mark Button" },
  { category: "symbols", emoji: "\u274C", name: "Cross Mark" },
  { category: "symbols", emoji: "\u26A0\uFE0F", name: "Warning" },
  { category: "symbols", emoji: "\u2753", name: "Red Question Mark" },
  { category: "symbols", emoji: "\u2757", name: "Red Exclamation Mark" },
  { category: "symbols", emoji: "\u267B\uFE0F", name: "Recycling Symbol" },
  { category: "symbols", emoji: "\u26A1", name: "High Voltage" },
  { category: "symbols", emoji: "\u{1F4A1}", name: "Light Bulb" },
  { category: "symbols", emoji: "\u{1F680}", name: "Rocket" }
];
var EMOJI_ENTRIES = RAW2.map((item) => ({
  emoji: item.emoji,
  category: item.category,
  categoryKey: CATEGORY_KEYS2[item.category],
  name: item.name,
  nameKey: `tools.emojiName${(item.emoji.codePointAt(0) ?? 0).toString(16).toUpperCase()}`
}));
var EMOJI_CATEGORIES = ["smileys", "gestures", "animals", "food", "symbols"].map((id) => ({ id, key: CATEGORY_KEYS2[id] }));
var CATEGORY_IDS = EMOJI_CATEGORIES.map((c) => c.id);
function parseEmojiPicker(raw, _ctx) {
  const rawCategory = readString(raw, "category") ?? "smileys";
  const category = CATEGORY_IDS.includes(rawCategory) ? rawCategory : "smileys";
  return toolOk({ category, query: (readString(raw, "query") ?? "").trim() });
}
function runEmojiPicker(input, _ctx) {
  const query = input.query.toLowerCase();
  const entries = EMOJI_ENTRIES.filter((entry) => {
    if (query.length === 0) return entry.category === input.category;
    return entry.name.toLowerCase().includes(query) || entry.emoji === input.query;
  });
  return toolOk({ entries, categories: [...EMOJI_CATEGORIES], total: entries.length });
}
function renderEmojiPicker(out, _ctx) {
  return out.entries.map((entry) => `${entry.emoji}	${entry.name}`).join("\n");
}
var emojiPickerTool = {
  id: "emoji-picker",
  tier: "T1",
  capabilities: [],
  inputs: [
    { name: "category", kind: "select", required: false, labelKey: "tools.category", default: "smileys" },
    { name: "query", kind: "text", required: false, labelKey: "tools.search" }
  ],
  parse: parseEmojiPicker,
  run: runEmojiPicker,
  render: renderEmojiPicker
};

// shared/tools/random-generator.ts
var MODES11 = ["number", "string", "color"];
var DEFAULT_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function parseRandomGenerator(raw, _ctx) {
  const mode = readEnum(raw, "mode", MODES11, "number");
  const min = readInt(raw, "min", 1);
  const max = readInt(raw, "max", 100);
  if (mode === "number" && max < min) return toolFail("outOfRange", "tools.outOfRange");
  const charset = typeof raw.charset === "string" && raw.charset.length > 0 ? raw.charset : DEFAULT_CHARSET;
  if (mode === "string" && charset.length === 0) return toolFail("invalidInput", "tools.invalidInput");
  return toolOk({ mode, min, max, length: clampInt(readInt(raw, "length", 8), 1, 256), charset });
}
function runRandomGenerator(input, ctx) {
  const source = new RandomSource(ctx);
  if (input.mode === "number") {
    const value2 = source.range(input.min, input.max);
    return toolOk({ value: String(value2), numeric: value2 });
  }
  if (input.mode === "string") {
    let out = "";
    for (let i = 0; i < input.length; i++) out += source.pick(input.charset.split(""));
    return toolOk({ value: out, numeric: NaN });
  }
  const bytes = new Uint8Array(3);
  for (let i = 0; i < 3; i++) bytes[i] = source.byte();
  const value = `#${padNumber(bytes[0], 2)}${padNumber(bytes[1], 2)}${padNumber(bytes[2], 2)}`;
  return toolOk({ value, numeric: NaN });
}
function renderRandomGenerator(out, _ctx) {
  return out.value;
}
var randomGeneratorTool = {
  id: "random-generator",
  tier: "T1",
  capabilities: [],
  inputs: [
    {
      name: "mode",
      kind: "select",
      required: false,
      labelKey: "tools.mode",
      default: "number",
      options: [
        { value: "number", labelKey: "tools.randomNumber" },
        { value: "string", labelKey: "tools.randomString" },
        { value: "color", labelKey: "tools.randomColor" }
      ]
    },
    { name: "min", kind: "number", required: false, labelKey: "tools.min", default: 1 },
    { name: "max", kind: "number", required: false, labelKey: "tools.max", default: 100 },
    { name: "length", kind: "number", required: false, labelKey: "tools.length", default: 8 },
    { name: "charset", kind: "text", required: false, labelKey: "tools.charset" }
  ],
  parse: parseRandomGenerator,
  run: runRandomGenerator,
  render: renderRandomGenerator
};

// shared/tools/cron-builder.ts
var CRON_FIELDS = [
  { name: "minute", min: 0, max: 59 },
  { name: "hour", min: 0, max: 23 },
  { name: "dayOfMonth", min: 1, max: 31 },
  { name: "month", min: 1, max: 12 },
  { name: "dayOfWeek", min: 0, max: 7 }
];
function parseField(value, min, max) {
  const raw = value.trim();
  if (raw.length === 0) return null;
  const values = /* @__PURE__ */ new Set();
  for (const part of raw.split(",")) {
    if (part.length === 0) return null;
    const [rangePart, stepPart] = part.split("/");
    const step = stepPart === void 0 ? 1 : Number.parseInt(stepPart, 10);
    if (!Number.isFinite(step) || step < 1) return null;
    let from = min;
    let to = max;
    if (rangePart !== "*") {
      const [fromPart, toPart] = rangePart.split("-");
      from = Number.parseInt(fromPart, 10);
      if (!Number.isFinite(from)) return null;
      to = toPart === void 0 ? from : Number.parseInt(toPart, 10);
      if (!Number.isFinite(to)) return null;
    }
    if (from < min || to > max || from > to) return null;
    for (let v = from; v <= to; v += step) values.add(v);
  }
  if (max === 7 && values.has(7)) values.add(0);
  return [...values].sort((a, b) => a - b);
}
function isDangerousCron(fields) {
  const restricted = fields.dayOfMonth !== "*" || fields.dayOfWeek !== "*" || fields.month !== "*";
  return restricted && (fields.minute === "*" || fields.hour === "*");
}
function nextCronRuns(fields, fromMs, count) {
  const minutes = parseField(fields.minute, 0, 59);
  const hours = parseField(fields.hour, 0, 23);
  const days = parseField(fields.dayOfMonth, 1, 31);
  const months = parseField(fields.month, 1, 12);
  const dows = parseField(fields.dayOfWeek, 0, 7);
  if (!minutes || !hours || !days || !months || !dows) return [];
  const runs = [];
  let cursor = Math.floor(fromMs / 6e4) * 6e4;
  const limit = cursor + 5 * 366 * 24 * 60 * 6e4;
  while (runs.length < count && cursor <= limit) {
    const date = new Date(cursor);
    const monthOk = months.includes(date.getUTCMonth() + 1);
    const dayOk = days.includes(date.getUTCDate());
    const dowOk = dows.includes(date.getUTCDay());
    if (monthOk && dayOk && dowOk && hours.includes(date.getUTCHours()) && minutes.includes(date.getUTCMinutes())) {
      runs.push(cursor);
    }
    cursor += 6e4;
  }
  return runs;
}
function parseCronBuilder(raw, _ctx) {
  const fields = {
    minute: readString(raw, "minute") ?? "*",
    hour: readString(raw, "hour") ?? "*",
    dayOfMonth: readString(raw, "dayOfMonth") ?? "*",
    month: readString(raw, "month") ?? "*",
    dayOfWeek: readString(raw, "dayOfWeek") ?? "*"
  };
  for (const spec of CRON_FIELDS) {
    if (parseField(fields[spec.name], spec.min, spec.max) === null) {
      return toolFail("invalidExpression", "tools.invalidExpression");
    }
  }
  return toolOk({ ...fields, count: clampInt(readInt(raw, "count", 5), 1, 20) });
}
function runCronBuilder(input, ctx) {
  const fields = {
    minute: input.minute,
    hour: input.hour,
    dayOfMonth: input.dayOfMonth,
    month: input.month,
    dayOfWeek: input.dayOfWeek
  };
  return toolOk({
    expression: `${fields.minute} ${fields.hour} ${fields.dayOfMonth} ${fields.month} ${fields.dayOfWeek}`,
    dangerous: isDangerousCron(fields),
    nextRuns: nextCronRuns(fields, ctx.now(), input.count),
    fields
  });
}
function renderCronBuilder(out, _ctx) {
  const lines = [out.expression, `dangerous	${out.dangerous}`];
  for (const run of out.nextRuns) lines.push(`next	${new Date(run).toISOString()}`);
  return lines.join("\n");
}
var cronBuilderTool = {
  id: "cron-builder",
  tier: "T1",
  capabilities: [],
  inputs: [
    { name: "minute", kind: "text", required: false, labelKey: "tools.cronMinute", default: "*" },
    { name: "hour", kind: "text", required: false, labelKey: "tools.cronHour", default: "*" },
    { name: "dayOfMonth", kind: "text", required: false, labelKey: "tools.cronDay", default: "*" },
    { name: "month", kind: "text", required: false, labelKey: "tools.cronMonth", default: "*" },
    { name: "dayOfWeek", kind: "text", required: false, labelKey: "tools.cronDow", default: "*" }
  ],
  parse: parseCronBuilder,
  run: runCronBuilder,
  render: renderCronBuilder
};

// shared/tools/pdf-tool.ts
var OPERATIONS = ["merge", "split", "extract", "rotate"];
function parsePageRange(range, pageCount) {
  const raw = range.trim();
  if (raw.length === 0) {
    return pageCount > 0 ? Array.from({ length: pageCount }, (_, i) => i) : [];
  }
  const indexes = /* @__PURE__ */ new Set();
  for (const part of raw.split(",")) {
    const segment = part.trim();
    if (segment.length === 0) continue;
    const [fromPart, toPart] = segment.split("-");
    if (toPart === void 0) {
      const single = Number.parseInt(fromPart, 10);
      if (!Number.isFinite(single) || single < 1 || single > pageCount) return null;
      indexes.add(single - 1);
      continue;
    }
    const hasFrom = fromPart.trim().length > 0;
    const hasTo = toPart.trim().length > 0;
    const from = hasFrom ? Number.parseInt(fromPart, 10) : 1;
    const to = hasTo ? Number.parseInt(toPart, 10) : pageCount;
    if (!Number.isFinite(from) || !Number.isFinite(to) || from < 1 || to > pageCount || from > to) {
      return null;
    }
    for (let p = from; p <= to; p++) indexes.add(p - 1);
  }
  return [...indexes].sort((a, b) => a - b);
}
function pdfOutputFileName(sourceName, operation) {
  const dot = sourceName.lastIndexOf(".");
  const base = dot > 0 ? sourceName.slice(0, dot) : sourceName;
  switch (operation) {
    case "merge":
      return `${base}_merged.pdf`;
    case "split":
      return `${base}.zip`;
    case "extract":
      return `${base}-extracted.pdf`;
    case "rotate":
      return `${base}-rotated.pdf`;
  }
}
function parsePdfTool(raw, _ctx) {
  const pageCount = Number.parseInt(String(raw.pageCount ?? "0"), 10);
  if (!Number.isFinite(pageCount) || pageCount < 1) {
    return toolFail("emptyInput", "tools.emptyInput");
  }
  return toolOk({
    operation: readEnum(raw, "operation", OPERATIONS, "merge"),
    pageCount,
    range: readString(raw, "range") ?? "",
    fileName: readString(raw, "fileName") ?? "document.pdf"
  });
}
function runPdfTool(input, _ctx) {
  const pageIndexes = parsePageRange(input.range, input.pageCount);
  if (pageIndexes === null) return toolFail("outOfRange", "tools.outOfRange");
  return toolOk({
    pageIndexes,
    outputFileName: pdfOutputFileName(input.fileName, input.operation),
    operation: input.operation,
    parts: input.operation === "split" ? pageIndexes.length || input.pageCount : 1
  });
}
function renderPdfTool(out, _ctx) {
  const pages = out.pageIndexes.length === 0 ? "all" : out.pageIndexes.map((i) => i + 1).join(",");
  return [`operation	${out.operation}`, `pages	${pages}`, `output	${out.outputFileName}`].join("\n");
}
var pdfTool = {
  id: "pdf-tool",
  tier: "T2",
  capabilities: ["file"],
  inputs: [
    {
      name: "operation",
      kind: "select",
      required: false,
      labelKey: "tools.mode",
      default: "merge",
      options: [
        { value: "merge", labelKey: "tools.pdfMerge" },
        { value: "split", labelKey: "tools.pdfSplit" },
        { value: "extract", labelKey: "tools.pdfExtract" },
        { value: "rotate", labelKey: "tools.pdfRotate" }
      ]
    },
    { name: "pageCount", kind: "number", required: true, labelKey: "tools.pageCount" },
    { name: "range", kind: "text", required: false, labelKey: "tools.pageRange" },
    { name: "fileName", kind: "text", required: false, labelKey: "tools.fileName" }
  ],
  parse: parsePdfTool,
  run: runPdfTool,
  render: renderPdfTool
};

// shared/utils/fileRename.ts
var _idCounter = 0;
function uid() {
  return `fr_${++_idCounter}`;
}
function splitName(name) {
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return [name, ""];
  return [name.slice(0, dot), name.slice(dot)];
}
function padNumber2(n, digits) {
  return String(n).padStart(digits, "0");
}
function applyRule(baseName, rule, index, _all) {
  switch (rule.type) {
    case "findReplace":
      return baseName.split(rule.find).join(rule.replace);
    case "deleteBefore": {
      const idx = baseName.indexOf(rule.text);
      return idx >= 0 ? baseName.slice(idx) : baseName;
    }
    case "deleteAfter": {
      const idx = baseName.indexOf(rule.text);
      return idx >= 0 ? baseName.slice(0, idx + rule.text.length) : baseName;
    }
    case "prefix":
      return rule.text + baseName;
    case "suffix":
      return baseName + rule.text;
    case "numbering": {
      const num = padNumber2(rule.start + index, rule.digits);
      if (rule.replaceOriginal) return num;
      return rule.position === "prefix" ? num + baseName : baseName + num;
    }
    case "case": {
      switch (rule.mode) {
        case "upper":
          return baseName.toUpperCase();
        case "lower":
          return baseName.toLowerCase();
        case "capitalize":
          return baseName.replace(/\b[a-z]/g, (c) => c.toUpperCase());
      }
    }
    case "clean": {
      let s = baseName;
      if (rule.removeSpaces) {
        s = s.replace(/\s+/g, rule.spaceReplacement || "");
      }
      if (rule.removeSpecialChars) {
        const allowed = rule.removeSpaces ? /[^a-zA-Z0-9\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af_-]/g : /[^a-zA-Z0-9\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af_-\s]/g;
        s = s.replace(allowed, "");
      }
      return s;
    }
    case "regex": {
      try {
        return baseName.replace(new RegExp(rule.pattern, "g"), rule.replacement);
      } catch {
        return baseName;
      }
    }
    case "keepNumber": {
      const nums = baseName.match(/\d+/g);
      if (!nums) return baseName;
      const num = padNumber2(parseInt(nums[0], 10), rule.digits);
      return rule.position === "prefix" ? num + baseName : baseName + num;
    }
    default:
      return baseName;
  }
}
function compareNames(a, b) {
  const isEngA = /^[a-zA-Z]/.test(a);
  const isEngB = /^[a-zA-Z]/.test(b);
  if (isEngA !== isEngB) return isEngA ? -1 : 1;
  const isCnA = /[\u4e00-\u9fff]/.test(a);
  const isCnB = /[\u4e00-\u9fff]/.test(b);
  if (isCnA && isCnB) return a.localeCompare(b, "zh-CN", { numeric: true });
  return a.localeCompare(b, "en", { numeric: true });
}
function applyRuleToFolderSegments(path, rule, fileIndex, allNames) {
  const parts = path.split("/");
  const level = rule.folderLevel ?? 1;
  if (parts.length <= level) return path;
  parts[level] = applyRule(parts[level], rule, fileIndex, allNames);
  return parts.join("/");
}
function applyRules(files, rules, renameFolder = false, newFolderName = "") {
  const commonPrefix = renameFolder && newFolderName ? getCommonPrefix(files.map((f) => f.path)) : "";
  const newNames = [];
  const fileRules = rules.filter((r) => r.type !== "numberFolders" && !r.folderMode);
  const folderModeRules = rules.filter((r) => r.folderMode && r.type !== "numberFolders");
  const numberFolderRules = rules.filter((r) => r.type === "numberFolders");
  let folderNumberMap = null;
  if (numberFolderRules.length > 0) {
    const nf = numberFolderRules[0];
    const folderLevel = nf.level ?? 1;
    const usePerFolder = nf.perFolder ?? false;
    if (usePerFolder) {
      folderNumberMap = {};
      const parentGroups = {};
      for (const file of files) {
        const parts = file.path.split("/");
        if (parts.length <= folderLevel + 1) continue;
        const parent = parts.slice(0, folderLevel).join("/");
        if (!parentGroups[parent]) parentGroups[parent] = /* @__PURE__ */ new Set();
        parentGroups[parent].add(parts[folderLevel]);
      }
      for (const [parent, nameSet] of Object.entries(parentGroups)) {
        const sorted = Array.from(nameSet).sort((a, b) => compareNames(a, b));
        sorted.forEach((name, i) => {
          folderNumberMap[`${parent}/${name}`] = padNumber2(nf.start + i, nf.digits);
        });
      }
    } else {
      const folderNames = /* @__PURE__ */ new Set();
      for (const file of files) {
        const parts = file.path.split("/");
        if (parts.length <= folderLevel + 1) continue;
        folderNames.add(parts[folderLevel]);
      }
      const sorted = Array.from(folderNames).sort((a, b) => compareNames(a, b));
      folderNumberMap = {};
      sorted.forEach((name, i) => {
        folderNumberMap[name] = padNumber2(nf.start + i, nf.digits);
      });
    }
  }
  let folderIndexMap = null;
  const hasPerFolder = rules.some((r) => r.type === "numbering" && r.perFolder);
  if (hasPerFolder) {
    folderIndexMap = {};
    const folderCounts = {};
    for (const file of files) {
      const dir = file.path.includes("/") ? file.path.slice(0, file.path.lastIndexOf("/")) : "";
      if (!folderCounts[dir]) folderCounts[dir] = 0;
      folderIndexMap[file.path] = folderCounts[dir];
      folderCounts[dir]++;
    }
  }
  const items = files.map((file, fileIndex) => {
    const [baseName, ext] = splitName(file.name);
    let newBase = baseName;
    for (const rule of fileRules) {
      const effectiveIndex = rule.type === "numbering" && rule.perFolder && folderIndexMap ? folderIndexMap[file.path] : fileIndex;
      newBase = applyRule(newBase, rule, effectiveIndex, newNames);
    }
    const newName = newBase + ext;
    newNames.push(newName);
    let newPath = file.path;
    if (commonPrefix && newFolderName) {
      newPath = newFolderName + file.path.slice(commonPrefix.length);
    }
    const lastSlash = newPath.lastIndexOf("/");
    newPath = lastSlash >= 0 ? newPath.slice(0, lastSlash + 1) + newName : newName;
    if (folderNumberMap) {
      const nf = numberFolderRules[0];
      const folderLevel = nf.level ?? 1;
      const usePerFolder = nf.perFolder ?? false;
      const parts = newPath.split("/");
      if (parts.length > folderLevel) {
        const oldName = parts[folderLevel];
        const key = usePerFolder ? parts.slice(0, folderLevel).join("/") + "/" + oldName : oldName;
        const newName2 = folderNumberMap[key];
        if (newName2) {
          parts[folderLevel] = newName2;
          newPath = parts.join("/");
        }
      }
    }
    for (const rule of folderModeRules) {
      newPath = applyRuleToFolderSegments(newPath, rule, fileIndex, newNames);
    }
    const origPath = file.path;
    const origDir = lastSlash >= 0 ? origPath.slice(0, lastSlash + 1) : "";
    const newDir = lastSlash >= 0 ? newPath.slice(0, newPath.lastIndexOf("/") + 1) : "";
    return {
      id: uid(),
      originalPath: file.path,
      originalName: file.name,
      newPath,
      newName,
      conflict: false,
      changed: newName !== file.name || origDir !== newDir
    };
  });
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (items[i].newPath === items[j].newPath) {
        items[i].conflict = true;
        items[j].conflict = true;
      }
    }
  }
  return items;
}
function getCommonPrefix(paths) {
  if (paths.length === 0) return "";
  const firstSlash = paths[0].indexOf("/");
  if (firstSlash < 0) return "";
  const candidate = paths[0].slice(0, firstSlash + 1);
  return paths.every((p) => p.startsWith(candidate)) ? candidate : "";
}

// shared/tools/file-renamer.ts
function isFileWithPath(value) {
  if (value === null || typeof value !== "object") return false;
  const record = value;
  return typeof record.name === "string" && typeof record.path === "string";
}
function parseFileRenamer(raw, _ctx) {
  const rawFiles = raw.files;
  if (!Array.isArray(rawFiles) || rawFiles.length === 0) {
    return toolFail("emptyInput", "tools.emptyInput");
  }
  const files = [];
  for (const item of rawFiles) {
    if (!isFileWithPath(item)) return toolFail("invalidInput", "tools.invalidInput");
    files.push({ name: item.name, path: item.path });
  }
  const rawRules = raw.rules;
  const rules = Array.isArray(rawRules) ? rawRules : [];
  return toolOk({
    files,
    rules,
    renameFolder: raw.renameFolder === true,
    newFolderName: typeof raw.newFolderName === "string" ? raw.newFolderName : ""
  });
}
function runFileRenamer(input, _ctx) {
  const items = applyRules(input.files, input.rules, input.renameFolder, input.newFolderName);
  let changed = 0;
  let conflicts = 0;
  for (const item of items) {
    if (item.newName !== item.originalName) changed++;
    if (item.conflict) conflicts++;
  }
  return toolOk({ items, changed, conflicts });
}
function renderFileRenamer(out, _ctx) {
  return out.items.map((item) => `${item.originalName}	->	${item.newName}${item.conflict ? "	(conflict)" : ""}`).join("\n");
}
var fileRenamerTool = {
  id: "file-renamer",
  tier: "T1",
  capabilities: [],
  inputs: [
    { name: "files", kind: "file", required: true, labelKey: "tools.files" },
    { name: "rules", kind: "textarea", required: false, labelKey: "tools.rules" },
    { name: "renameFolder", kind: "boolean", required: false, labelKey: "tools.renameFolder", default: false },
    { name: "newFolderName", kind: "text", required: false, labelKey: "tools.newFolderName" }
  ],
  parse: parseFileRenamer,
  run: runFileRenamer,
  render: renderFileRenamer
};

// shared/tools/registry.ts
var TOOL_REGISTRY = {
  "json-formatter": jsonFormatterTool,
  base64: base64Tool,
  "url-encode": urlEncodeTool,
  "regex-tester": regexTesterTool,
  "jwt-decoder": jwtDecoderTool,
  "uuid-generator": uuidGeneratorTool,
  "html-preview": htmlPreviewTool,
  "html-entities": htmlEntitiesTool,
  "css-minifier": cssMinifierTool,
  "number-base": numberBaseTool,
  "yaml-json": yamlJsonTool,
  "json-to-csv": jsonToCsvTool,
  "word-counter": wordCounterTool,
  "markdown-preview": markdownPreviewTool,
  "case-converter": caseConverterTool,
  "text-diff": textDiffTool,
  "lorem-ipsum": loremIpsumTool,
  "text-to-slug": textToSlugTool,
  "list-sorter": listSorterTool,
  "password-generator": passwordGeneratorTool,
  qrcode: qrCodeTool,
  "color-picker": colorPickerTool,
  "image-to-base64": imageToBase64Tool,
  "image-converter": imageConverterTool,
  "image-editor": imageEditorTool,
  calculator: calculatorTool,
  "ip-lookup": ipLookupTool,
  "dns-lookup": dnsLookupTool,
  "http-status-codes": httpStatusCodesTool,
  "user-agent-parser": userAgentParserTool,
  timestamp: timestampTool,
  "date-calculator": dateCalculatorTool,
  timer: timerTool,
  "emoji-picker": emojiPickerTool,
  "random-generator": randomGeneratorTool,
  "cron-builder": cronBuilderTool,
  "pdf-tool": pdfTool,
  "file-renamer": fileRenamerTool
};
function isToolId(value) {
  return TOOL_IDS.includes(value);
}
function getTool(id) {
  if (!isToolId(id)) return void 0;
  return TOOL_REGISTRY[id];
}
function listTools(filter = {}) {
  const { tier, capabilities, requiresAllCapabilities = false } = filter;
  return TOOL_IDS.map((id) => TOOL_REGISTRY[id]).filter((tool) => {
    if (tier && tool.tier !== tier) return false;
    if (capabilities && capabilities.length > 0) {
      if (requiresAllCapabilities) {
        if (!tool.capabilities.every((c) => capabilities.includes(c))) return false;
      } else if (!tool.capabilities.some((c) => capabilities.includes(c))) {
        return false;
      }
    }
    return true;
  });
}
function supportedTools(capabilities) {
  return TOOL_IDS.map((id) => TOOL_REGISTRY[id]).filter((tool) => {
    if (tool.tier === "T3") return false;
    return tool.capabilities.every((c) => capabilities.includes(c));
  });
}
async function runToolById(id, raw, ctx) {
  const tool = getTool(id);
  if (!tool) {
    return { ok: false, error: { code: "invalidInput", messageKey: "tools.toolNotFound" } };
  }
  const parsed = tool.parse(raw, ctx);
  if (!parsed.ok) return parsed;
  return tool.run(parsed.data, ctx);
}
async function renderToolById(id, raw, ctx) {
  const tool = getTool(id);
  if (!tool) {
    return { ok: false, error: { code: "invalidInput", messageKey: "tools.toolNotFound" } };
  }
  const parsed = tool.parse(raw, ctx);
  if (!parsed.ok) return parsed;
  const result = await tool.run(parsed.data, ctx);
  if (!result.ok) return result;
  return { ok: true, data: tool.render(result.data, ctx) };
}

// shared/types/platform.ts
var PLATFORMS = ["web", "weapp", "app", "desktop", "cli"];
var PROJECT_IDS = ["aaigc"];
var DEFAULT_PROJECT_ID = "aaigc";
function isPlatform(value) {
  return PLATFORMS.includes(value);
}
function isProjectId(value) {
  return PROJECT_IDS.includes(value);
}

// shared/data/tools.ts
var toolCategories = [
  { id: "ai", nameEn: "AI Tools", icon: "\u{1FA84}", order: 1 },
  { id: "dev", nameEn: "Developer Tools", icon: "\u{1F4BB}", order: 2 },
  { id: "text", nameEn: "Text Tools", icon: "\u270D\uFE0F", order: 3 },
  { id: "security", nameEn: "Security Tools", icon: "\u{1F6E1}\uFE0F", order: 4 },
  { id: "convert", nameEn: "Converters", icon: "\u{1F500}", order: 5 },
  { id: "image", nameEn: "Image Tools", icon: "\u{1F5BC}\uFE0F", order: 6 },
  { id: "math", nameEn: "Math Tools", icon: "\u{1F522}", order: 7 },
  { id: "network", nameEn: "Network Tools", icon: "\u{1F4E1}", order: 8 },
  { id: "time", nameEn: "Time Tools", icon: "\u{1F550}", order: 9 },
  { id: "other", nameEn: "Other Tools", icon: "\u{1F9E9}", order: 10 }
];
function categoriesWithTools(list = tools) {
  return toolCategories.filter((category) => list.some((tool) => tool.category === category.id));
}
var tools = [
  // ─── Developer Tools ───
  { id: "json-formatter", category: "dev", icon: "\u{1F4CB}", component: "JsonFormatter", createdAt: "2026-07-18" },
  { id: "base64", category: "dev", icon: "\u{1F510}", component: "Base64Codec", createdAt: "2026-07-18" },
  { id: "url-encode", category: "dev", icon: "\u{1F517}", component: "UrlEncoder", createdAt: "2026-07-18" },
  { id: "regex-tester", category: "dev", icon: "\u{1F50D}", component: "RegexTester", createdAt: "2026-07-18" },
  { id: "jwt-decoder", category: "dev", icon: "\u{1F6E1}\uFE0F", component: "JwtDecoder", createdAt: "2026-07-18" },
  { id: "uuid-generator", category: "dev", icon: "\u{1F194}", component: "UuidGenerator", createdAt: "2026-07-18" },
  { id: "html-preview", category: "dev", icon: "\u{1F5A5}\uFE0F", component: "HtmlPreview", createdAt: "2026-07-18" },
  { id: "html-entities", category: "dev", icon: "\u{1F523}", component: "HtmlEntities", createdAt: "2026-07-27" },
  { id: "css-minifier", category: "dev", icon: "\u2702\uFE0F", component: "CssMinifier", createdAt: "2026-07-19" },
  { id: "number-base", category: "dev", icon: "\u{1F522}", component: "NumberBaseConverter", createdAt: "2026-07-27" },
  { id: "yaml-json", category: "dev", icon: "\u{1F500}", component: "YamlJsonConverter", npmDeps: ["js-yaml"], createdAt: "2026-07-27" },
  { id: "json-to-csv", category: "dev", icon: "\u{1F4CA}", component: "JsonToCsv", createdAt: "2026-07-27" },
  // ─── Text Tools ───
  { id: "word-counter", category: "text", icon: "\u{1F4DD}", component: "WordCounter", createdAt: "2026-07-18" },
  { id: "markdown-preview", category: "text", icon: "\u{1F4C4}", component: "MarkdownPreview", npmDeps: ["react-markdown"], createdAt: "2026-07-18" },
  { id: "case-converter", category: "text", icon: "\u{1F524}", component: "CaseConverter", createdAt: "2026-07-18" },
  { id: "text-diff", category: "text", icon: "\u{1F4D1}", component: "TextDiff", npmDeps: ["diff"], createdAt: "2026-07-18" },
  { id: "lorem-ipsum", category: "text", icon: "\u{1F4DC}", component: "LoremIpsum", createdAt: "2026-07-18" },
  { id: "text-to-slug", category: "text", icon: "\u{1F3F7}\uFE0F", component: "TextToSlug", createdAt: "2026-07-19" },
  { id: "list-sorter", category: "text", icon: "\u{1F4CC}", component: "ListSorter", createdAt: "2026-07-19" },
  // ─── Security Tools ───
  { id: "password-generator", category: "security", icon: "\u{1F511}", component: "PasswordGenerator", createdAt: "2026-07-18" },
  // ─── Image Tools ───
  { id: "qrcode", category: "image", icon: "\u{1F4F2}", component: "QrCodeGenerator", npmDeps: ["qrcode"], createdAt: "2026-07-18" },
  { id: "color-picker", category: "image", icon: "\u{1F3AF}", component: "ColorPicker", createdAt: "2026-07-18" },
  { id: "image-to-base64", category: "image", icon: "\u{1F5BC}\uFE0F", component: "ImageToBase64", createdAt: "2026-07-18" },
  { id: "image-converter", category: "image", icon: "\u{1F504}", component: "ImageConverter", createdAt: "2026-07-31" },
  { id: "image-editor", category: "image", icon: "\u2702\uFE0F", component: "ImageEditor", createdAt: "2026-07-31" },
  // ─── Math Tools ───
  { id: "calculator", category: "math", icon: "\u{1F9EE}", component: "Calculator", createdAt: "2026-07-19" },
  // ─── Network Tools ───
  { id: "ip-lookup", category: "network", icon: "\u{1F4CD}", component: "IpLookup", createdAt: "2026-07-27" },
  { id: "dns-lookup", category: "network", icon: "\u{1F310}", component: "DnsLookup", createdAt: "2026-07-27" },
  { id: "http-status-codes", category: "network", icon: "\u2139\uFE0F", component: "HttpStatusCodes", createdAt: "2026-07-27" },
  { id: "user-agent-parser", category: "network", icon: "\u{1F5A5}\uFE0F", component: "UserAgentParser", createdAt: "2026-07-27" },
  // ─── Time Tools ───
  { id: "timestamp", category: "time", icon: "\u23F1\uFE0F", component: "TimestampConverter", createdAt: "2026-07-18" },
  { id: "date-calculator", category: "time", icon: "\u{1F4C5}", component: "DateCalculator", createdAt: "2026-07-18" },
  { id: "timer", category: "time", icon: "\u231B", component: "Timer", createdAt: "2026-07-30" },
  // ─── Other Tools ───
  { id: "emoji-picker", category: "other", icon: "\u{1F60A}", component: "EmojiPicker", createdAt: "2026-07-27" },
  { id: "random-generator", category: "other", icon: "\u{1F3B2}", component: "RandomGenerator", createdAt: "2026-07-27" },
  { id: "cron-builder", category: "other", icon: "\u23F3", component: "CronBuilder", createdAt: "2026-07-27" },
  { id: "pdf-tool", category: "other", icon: "\u{1F4C4}", component: "PdfTool", npmDeps: ["pdf-lib", "jszip"], createdAt: "2026-07-30" },
  { id: "file-renamer", category: "other", icon: "\u{1F3F7}\uFE0F", component: "FileRenamer", createdAt: "2026-07-31" }
];

// shared/data/products.ts
var urlMap = productUrlMap();
function build(id, icon, status) {
  const urls = urlMap[id] ?? {};
  return {
    id,
    icon,
    status,
    url: urls.url ?? "",
    previewUrl: urls.previewUrl ?? "",
    productionUrl: urls.productionUrl ?? ""
  };
}
var products = [
  build("cookmate", "\u{1F373}", "live"),
  build("aihub", "\u{1F916}", "wip"),
  build("short-drama", "\u{1F3AC}", "wip"),
  build("resume-optimizer", "\u{1F4DD}", "wip"),
  build("copycraft", "\u270D\uFE0F", "wip"),
  build("contentforge", "\u{1F3D7}\uFE0F", "wip"),
  build("postforge", "\u{1F4EC}", "wip"),
  build("maestro", "\u{1F3B5}", "wip"),
  build("ai-portfolio-studio", "\u{1F3A8}", "wip"),
  build("ai-toolbox", "\u{1F9F0}", "wip"),
  build("content-ai-site", "\u{1F310}", "wip")
];

// shared/constants/theme.ts
var THEME_COLOR_NAMES = [
  "bg",
  "surface",
  "accent",
  "accentLight",
  "text",
  "textSecondary"
];
var THEME_CSS_VARIABLES = {
  bg: "--color-bg",
  surface: "--color-surface",
  accent: "--color-accent",
  accentLight: "--color-accent-light",
  text: "--color-text",
  textSecondary: "--color-text-secondary"
};
var LIGHT_THEME_TOKENS = {
  bg: "#fffaeb",
  surface: "#fff0c2",
  accent: "#fa520f",
  accentLight: "#ffa110",
  text: "#1f1f1f",
  textSecondary: "#767d88"
};
var THEME_MODES = ["light", "dark", "system"];
var DEFAULT_THEME_MODE = "system";
var THEME_ANSI = {
  bg: 230,
  surface: 223,
  accent: 202,
  accentLight: 214,
  text: 235,
  textSecondary: 243
};

// shared/constants/error-codes.ts
var LEGACY_API_ERROR_CODES = [
  "notFound",
  "notFoundDesc",
  "backHome",
  "verifyFailed",
  "sendFailed",
  "passwordTooShort",
  "registerFailed",
  "accountLocked",
  "attemptsRemaining",
  "codeRecentlySent",
  "rateLimited",
  "invalidEmail",
  "realEmail",
  "emailNotRegistered",
  "emailRegistered",
  "agreeTermsRequired",
  "loginRequired",
  "forbidden",
  "tooManyRequests",
  "invalidJson",
  "missingToolId",
  "invalidType",
  "invalidProvider",
  "cannotUnlinkEmail",
  "notSet",
  "mustKeepOneMethod",
  "missingDomain",
  "invalidDnsType",
  "domainTooLong",
  "invalidDomain",
  "dnsNoRecords",
  "currentPasswordWrong",
  "invalidParams",
  "ipLookupFailed",
  "invalidName",
  "nameTooLong",
  "invalidPhone",
  "userNotFound",
  "phoneAlreadyBound",
  "setPasswordFirst",
  "phoneBound",
  "bindFailed",
  "requestFailed",
  "verifyError",
  "tooManyAttempts",
  "nameRequired",
  "verifyEmailFirst",
  "passwordNeedsTypes",
  "passwordCommon",
  "passwordTooLong"
];
var MULTI_CLIENT_API_ERROR_CODES = [
  "tokenInvalid",
  "tokenExpired",
  "refreshTokenInvalid",
  "grantTypeUnsupported",
  "authorizationPending",
  "deviceCodeExpired",
  "deviceCodeNotFound",
  "deviceCodeConsumed",
  "weappLoginFailed",
  "syncPayloadInvalid",
  "toolNotFound",
  "toolUnsupportedOnPlatform",
  "invalidCredentials",
  "missingClientId",
  "invalidClientId",
  "missingRefreshToken",
  "missingDeviceCode",
  "missingUserCode",
  "emailRequired",
  "codeRequired",
  "passwordRequired",
  "networkFailed"
];
var API_ERROR_CODES = [
  ...LEGACY_API_ERROR_CODES,
  ...MULTI_CLIENT_API_ERROR_CODES
];
var TOOL_ERROR_CODES = [
  "invalidInput",
  "invalidJson",
  "invalidBase64",
  "invalidUrl",
  "invalidJwt",
  "invalidRegex",
  "invalidNumber",
  "invalidDate",
  "invalidTimestamp",
  "invalidHex",
  "invalidExpression",
  "outOfRange",
  "emptyInput",
  "unsupportedPlatform",
  "networkFailed"
];

// shared/js/entry.ts
function lookupMessage(bundle, path) {
  let cursor = bundle;
  for (const segment of path.split(".")) {
    if (cursor === null || typeof cursor !== "object") return void 0;
    cursor = cursor[segment];
  }
  return typeof cursor === "string" ? cursor : void 0;
}
function formatMessage(template, params) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) => {
    const value = params[name];
    return value === void 0 ? match : String(value);
  });
}
function createTranslator(bundle, fallback) {
  return (path, params) => {
    const template = lookupMessage(bundle, path) ?? (fallback ? lookupMessage(fallback, path) : void 0);
    if (template === void 0) return path;
    return formatMessage(template, params);
  };
}
export {
  CRON_FIELDS,
  DEFAULT_PROJECT_ID,
  DEFAULT_THEME_MODE,
  EMOJI_CATEGORIES,
  EMOJI_ENTRIES,
  HTTP_STATUS_CODES,
  IMAGE_MIME,
  LIGHT_THEME_TOKENS,
  LOSSLESS_FORMATS,
  MAX_IMAGE_BYTES,
  PLATFORMS,
  PROJECT_IDS,
  RandomSource,
  THEME_ANSI,
  THEME_COLOR_NAMES,
  THEME_CSS_VARIABLES,
  THEME_MODES,
  TOOL_ERROR_CODES,
  TOOL_REGISTRY,
  UNIT_GROUPS,
  VALID_DNS_TYPES,
  addCalendar,
  base64ToBytes,
  base64ToText,
  base64Tool,
  bytesToBase64,
  bytesToDataUrl,
  calculatorTool,
  caseConverterTool,
  categoriesWithTools,
  clampCrop,
  clampHours,
  clampInt,
  clampMinutes,
  clampSeconds,
  colorPickerTool,
  computeBinary,
  convertCase,
  convertUnit,
  createToolContext,
  createTranslator,
  cronBuilderTool,
  cssMinifierTool,
  dateCalculatorTool,
  daysInMonth,
  daysInMonthUtc,
  defaultRandomBytes,
  detectBrowser,
  detectDevice,
  detectOs,
  diffLines,
  dnsLookupTool,
  dumpYaml,
  emojiPickerTool,
  escapeCsvCell,
  escapeHtmlEntities,
  evaluateExpression,
  fetchPublicIp,
  fileRenamerTool,
  flattenObject,
  formatClock,
  formatCss,
  formatDateParts,
  formatMessage,
  formatStopwatch,
  formatUuidV4,
  formatZoned,
  getTool,
  guessMimeType,
  guessUsage,
  hexToRgb,
  htmlEntitiesTool,
  htmlPreviewTool,
  httpStatusCodesTool,
  imageConverterTool,
  imageEditorTool,
  imageToBase64Tool,
  ipLookupTool,
  isDangerousCron,
  isIpv4,
  isIpv6,
  isPlatform,
  isPrivateOrReserved,
  isProjectId,
  isToolId,
  isValidIp,
  jsonFormatterTool,
  jsonToCsvTool,
  jwtDecoderTool,
  listSorterTool,
  listTools,
  lookupMessage,
  loremIpsumTool,
  lowerCaseAscii,
  markdownPreviewTool,
  markdownToHtml,
  minifyCss,
  nextCronRuns,
  normalizeDomain,
  normalizeGeoResponse,
  normalizeHex,
  normalizeQuality,
  normalizeRotation,
  numberBaseTool,
  padNumber,
  parseField,
  parsePageRange,
  parseYaml,
  partsFromEpoch,
  passwordGeneratorTool,
  pdfOutputFileName,
  pdfTool,
  products,
  qrCodeTool,
  randomGeneratorTool,
  readBool,
  readEnum,
  readInt,
  readString,
  regexTesterTool,
  renderRegexTester,
  renderToolById,
  requireString,
  rgbToHex,
  rgbToHsl,
  runToolById,
  scaleDimensions,
  scaleToAbsolute,
  scoreStrength,
  splitLines,
  supportedTools,
  targetFileName,
  textDiffTool,
  textToBase64,
  textToSlugTool,
  timerTool,
  timestampTool,
  toCamelCase,
  toSlug,
  toSnakeCase,
  toTitleCase,
  tokenizeExpression,
  toolCategories,
  toolFail,
  toolOk,
  tools,
  unescapeHtmlEntities,
  upperCaseAscii,
  urlEncodeTool,
  userAgentParserTool,
  utf8Bytes,
  utf8Text,
  uuidGeneratorTool,
  wordCounterTool,
  yamlJsonTool,
  zoneOffsetMs,
  zonedParts,
  zonedWallClockToEpoch
};
