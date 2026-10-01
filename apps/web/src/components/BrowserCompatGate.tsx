// File: apps/web/src/components/BrowserCompatGate.tsx
//
// Server Component — outputs a single inline <script>.
//
// Hard Rule 1.4：所有项目创建时必须内置旧浏览器全屏遮罩提示。
//   · Tailwind v4 产物含 @layer / @property / color-mix()，低内核浏览器
//     会把 @layer 整块丢弃 → 页面只剩纯文字。
//   · 该组件必须用纯内联 style，零 Tailwind 类名（出现 Tailwind 失效 =
//     提示自己也失效）。
//   · 必须用服务端组件 SSR 输出 <script>，执行早于 hydration，达标时
//     documentElement 零 DOM 变动，不闪。
//
// 检测思路（特性检测，禁止猜 UA）：
//   1. 先用最廉价的 CSS.supports("color", "color-mix(in srgb, ...)")
//      滤掉远古浏览器（无 color-mix = 远低于门槛）。
//   2. 通过 color-mix 的浏览器再过四道关：@layer 探针、oklch、
//      container-type: inline-size、:has() 选择器。
//   3. 不达标才显示遮罩；sessionStorage 记录已关闭状态（KEY 带项目
//      名防冲突），try-catch 防止 sessionStorage 抛错。

export type CompatNoticeTexts = {
  title: string
  desc: string
  reqTitle: string
  reqIOS: string
  reqAndroid: string
  reqDesktop: string
  howTitle: string
  how: string
  details: string
  dismiss: string
}

// 可选诊断页链接。空串则隐藏"查看详情"按钮。
const DIAGNOSTIC_PAGE = '/ipad-check.html'

function buildCompatScript(texts: CompatNoticeTexts): string {
  // 把文案作为 JSON 字面量嵌入；把 < 替换成 \u003c —— 语义上仍是 "<"，
  // 但 HTML parser 不会把它误认为 script 结束标签。
  const data = JSON.stringify(texts).replace(/</g, '\\u003c')

  return `(function () {
  var S = ${data};
  var KEY = "aaigc-compat-dismissed";

  function sup(prop, val) {
    try {
      if (!window.CSS || !CSS.supports) return false;
      return val === undefined ? !!CSS.supports(prop) : !!CSS.supports(prop, val);
    }
    catch (e) { return false; }
  }

  // @layer / @property 无法用 CSS.supports 直接询问 —— 用探针实读计算值。
  function probeLayers() {
    var style = document.createElement("style");
    style.textContent =
      "@layer cmprobe{#cm-layer-probe{--ok:yes}}" +
      '@property --cm-prop-probe{syntax:"<color>";inherits:false;initial-value:rgb(11,22,33)}';
    var layerEl = document.createElement("div");
    layerEl.id = "cm-layer-probe";
    var propEl = document.createElement("div");
    propEl.id = "cm-prop-probe";
    var root = document.documentElement;
    (document.head || root).appendChild(style);
    root.appendChild(layerEl);
    root.appendChild(propEl);
    var layerOK = false, propOK = false;
    try {
      layerOK = (getComputedStyle(layerEl).getPropertyValue("--ok") || "").replace(/\\s+/g, "") === "yes";
    } catch (e) {}
    try {
      propOK = (getComputedStyle(propEl).getPropertyValue("--cm-prop-probe") || "").indexOf("11") !== -1;
    } catch (e) {}
    if (style.parentNode) style.parentNode.removeChild(style);
    if (layerEl.parentNode) layerEl.parentNode.removeChild(layerEl);
    if (propEl.parentNode) propEl.parentNode.removeChild(propEl);
    return layerOK && propOK;
  }

  // 最便宜的一关先打：无 color-mix 直接判死。
  var ok = sup("color", "color-mix(in srgb, red 50%, blue 50%)");
  if (ok) {
    ok = probeLayers()
      && sup("color", "oklch(0.5 0.1 200)")
      && sup("container-type", "inline-size")
      && sup("selector(:has(a))");
  }
  if (ok) return;

  try { if (sessionStorage.getItem(KEY) === "1") return; } catch (e) {}

  function el(tag, css, text) {
    var e = document.createElement(tag);
    if (css) e.setAttribute("style", css);
    if (text != null) e.textContent = text;
    return e;
  }

  var FONT = "-apple-system,'PingFang SC','Helvetica Neue','Microsoft YaHei',sans-serif";

  var card = el("div",
    "background:#ffffff;border-radius:12px;padding:18px;max-width:330px;margin:20px auto;" +
    "font-size:14px;line-height:1.7;color:#1a1a1a;font-family:" + FONT + ";" +
    "text-align:left;box-shadow:0 6px 24px rgba(0,0,0,.28);");

  card.appendChild(el("p", "margin:0 0 10px;font-size:17px;font-weight:700;color:#c62828;", S.title));
  card.appendChild(el("p", "margin:0 0 14px;color:#333333;", S.desc));
  card.appendChild(el("p", "margin:0 0 6px;font-weight:700;", S.reqTitle));
  card.appendChild(el("p", "margin:0 0 4px;", S.reqIOS));
  card.appendChild(el("p", "margin:0 0 4px;", S.reqAndroid));
  card.appendChild(el("p", "margin:0 0 14px;", S.reqDesktop));
  card.appendChild(el("p", "margin:0 0 6px;font-weight:700;", S.howTitle));
  card.appendChild(el("p", "margin:0 0 16px;color:#333333;", S.how));

  var row = el("div", "text-align:right;");
  var detailLink = el("a",
    "display:inline-block;padding:9px 13px;border:2px solid #1a1a1a;border-radius:8px;" +
    "color:#1a1a1a;text-decoration:none;font-size:13px;", S.details);
  detailLink.setAttribute("href", "${DIAGNOSTIC_PAGE}");
  detailLink.setAttribute("target", "_blank");
  detailLink.setAttribute("rel", "noopener");
  var dismiss = el("button",
    "display:inline-block;padding:10px 14px;margin:0 0 0 8px;background:#1a1a1a;border:0;" +
    "border-radius:8px;color:#ffffff;font-size:13px;cursor:pointer;font-family:inherit;", S.dismiss);
  dismiss.type = "button";
  dismiss.onclick = function () {
    try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  };
  row.appendChild(detailLink);
  row.appendChild(dismiss);
  card.appendChild(row);

  var overlay = el("div",
    "position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,.62);" +
    "z-index:2147483647;padding:16px;overflow:auto;-webkit-overflow-scrolling:touch;");
  overlay.appendChild(card);

  // 挂到 documentElement：脚本可能在任意时机执行，最外层容器不依赖
  // body 存在，也不会打断 hydration。
  document.documentElement.appendChild(overlay);
})();`
}

export default function BrowserCompatGate({ texts }: { texts: CompatNoticeTexts }) {
  return <script dangerouslySetInnerHTML={{ __html: buildCompatScript(texts) }} />
}