# AAIGC 工具分类调研报告

## 调研站点概况

| 站点 | 状态 | 分类数 | 工具总数 | 特点 |
|------|------|--------|----------|------|
| [10015.io](https://10015.io/tools) | ✅ 成功 | 7 大类 | ~78 | 主题分类+搜索，无安全/加密独立分类 |
| [browserling.com](https://www.browserling.com/tools) | ❌ 503 | — | — | 暂时无法访问 |
| [tool.lu](https://tool.lu/) | ❌ 502 | — | — | 暂时无法访问 |
| [lddgo.net](https://www.lddgo.net/) | ✅ 成功 | 10 大类 | ~416 | 中文工具站，分类细致，含坐标/图表等专业分类 |
| [it-tools.tech](https://it-tools.tech/) | ✅ 成功 | 8 个区段（无正式分类） | ~110 | 开源，按功能区段展示，无严格分类体系 |

---

## 一、详细分类结构

### 1. 10015.io (7 大分类)

| 分类 | 说明 |
|------|------|
| Text Tools | 文本处理（大小写转换、Lorem Ipsum、字数统计等） |
| Image Tools | 图片处理（裁剪、滤镜、缩放、SVG转PNG等） |
| CSS Tools | CSS 工具（选择器、格式化等） |
| Coding Tools | 编码/开发工具（Base64、JWT、正则、HTML预览等） |
| Color Tools | 颜色工具（取色器、调色板等） |
| Social Media Tools | 社交媒体工具（OG图生成等） |
| Miscellaneous Tools | 杂项（密码生成器、二维码、Chmod计算器等） |

**关键发现：**
- **无"安全/加密"独立分类** — 加密工具分散在 Coding Tools 和 Miscellaneous Tools
- **无"转换器"独立分类** — 转换器按领域分散在各分类中
- **密码生成器** → Miscellaneous Tools
- **Base64** → Coding Tools
- 分类粒度较粗，大部分工具按"使用场景"归类

### 2. lddgo.net 在线工具大全 (10 大分类)

| 分类ID | 分类名 | 工具数 | 说明 |
|--------|--------|--------|------|
| 1 | 字符 | 93 | 正则测试、UUID、JSON格式化、密码生成器、Markdown、SQL格式化等 |
| 2 | 转换 | 39 | Base64、进制转换、时间戳、单位换算、YAML/JSON互转、颜色转换等 |
| 3 | 加密 | 47 | MD5、SHA、AES、DES、RSA、JWT、HMAC、URL编码、密码强度检测、哈希计算等 |
| 4 | 网络 | 18 | WebSocket测试、IP查询、DNS、Whois、MQTT、HTTP状态码、MAC地址等 |
| 5 | 更多 | 81 | 文档查询、汇率、身份证、Cron表达式、日期计算、房贷计算、成语等 |
| 6 | 图表 | 16 | 折线图、饼图、柱状图、雷达图、Mermaid图、词云图等 |
| 7 | 数学 | 27 | 阶乘、斐波那契、质因数分解、分数计算、面积、矩阵、百分比等 |
| 8 | 坐标 | 23 | 经纬度转换、坐标转换、WGS84/CGCS2000、Geohash等专业GIS工具 |
| 9 | 图片 | 49 | SVG编辑器、图片压缩、二维码、OCR、抠图、格式转换、加水印等 |
| 10 | 文件 | 23 | ZIP压缩解压、PDF拆分合并、PDF转图片、文件重命名、字幕格式转换等 |

**关键发现：**
- **加密/安全/编码** → **独立"加密"分类** (classID=3)，包含 47 个工具，涵盖所有编码/加密/哈希
- **转换器** → **独立"转换"分类** (classID=2)，包含 39 个工具
- **密码生成器** → **"字符"分类** (classID=1)，不在"加密"分类下
- 分类命名使用中文，偏功能导向（字符/转换/加密/网络/数学/图片/文件）
- 子分类通过"更多"下的二级菜单实现

### 3. it-tools.tech (8 个区段，无正式分类)

| 区段 | 工具示例 | 工具数 |
|------|----------|--------|
| Crypto | Token生成、Hash、Bcrypt、UUID、加密/解密、HMAC、RSA、密码强度分析 | ~10 |
| Converter | 时间戳转换、进制转换、Base64、颜色转换、大小写转换、YAML/JSON互转等 | ~20 |
| Web | URL编码、HTML实体、JWT解析、OTP、MIME、User-Agent、HTTP状态码等 | ~15 |
| Images & Videos | 二维码、WiFi二维码、SVG占位图、相机录制 | ~5 |
| Development | Git速查表、随机端口、Crontab、JSON格式化、SQL格式化、Chmod、正则测试等 | ~15 |
| Network | IPv4子网计算、MAC地址查询、IPv6生成 | ~6 |
| Math | 数学计算器、ETA计算器、百分比计算器、温度转换、基准测试 | ~6 |
| Text | Lorem Ipsum、文本统计、Emoji选择、文本对比、ASCII艺术字 | ~10 |

**关键发现：**
- **无正式分类体系** — 页面按功能区段分组展示，区段名即大标题
- **加密/安全/编码** → "Crypto" 区段
- **转换器** → "Converter" 区段
- **密码生成器** → 无独立密码生成器，但"Password strength analyser"在 Crypto 区段
- 分类命名偏开发者、英文、技术导向

---

## 二、重点关注问题分析

### Q1: 分类数量（一般几个大类？）

| 站点 | 分类数 |
|------|--------|
| 10015.io | 7 |
| lddgo.net | 10（含子分类） |
| it-tools.tech | 8 区段 |
| **行业共识** | **5~10 个大类** 是合理范围 |

**建议：AAIGC 目前 7 个分类，数量合理。**

### Q2: 分类命名标准

| 站点 | 命名风格 |
|------|----------|
| 10015.io | 名词 + "Tools"（Text Tools, Image Tools, Coding Tools） |
| lddgo.net | 单字/双字功能名词（字符/转换/加密/网络/数学） |
| it-tools.tech | 领域名词（Crypto, Web, Development, Network, Math, Text） |

**建议：采用"双字中文 + 英文名"双语命名，保持一致性。**

### Q3: 每个分类通常包含多少工具？

| 站点 | 分类工具数范围 |
|------|----------------|
| 10015.io | 5~20 个/分类 |
| lddgo.net | 16~93 个/分类，平均 ~42 |
| it-tools.tech | 5~20 个/区段 |

**建议：AAIGC 目前 26 个工具，每个分类 1~8 个工具。"Security Tools" 只有 1 个工具（password-generator）明显偏少，应考虑合并。**

### Q4: 加密/安全/编码类工具放在哪个分类下？

| 站点 | 位置 |
|------|------|
| 10015.io | 分散在 Coding Tools 和 Miscellaneous Tools |
| lddgo.net | **独立"加密"分类**，包含编码/加密/哈希/签名等 |
| it-tools.tech | **独立"Crypto"区段** |

**建议：AAIGC 目前将 base64、url-encode、jwt-decoder 放在 Developer Tools，password-generator 单独 Security Tools。建议合并为 "编码与安全"（Codec & Security）分类，或者将编码类归入 Developer Tools，只保留 Security Tools 给真正安全相关工具。**

### Q5: "转换器"是独立分类还是放在其他分类下？

| 站点 | 做法 |
|------|------|
| 10015.io | **不独立** — 转换器按领域分散在各分类 |
| lddgo.net | **独立"转换"分类**，包含 39 个工具 |
| it-tools.tech | **独立"Converter"区段** |

**建议：AAIGC 目前有独立 Converters 分类（3 个工具），可以参考 lddgo.net 和 it-tools.tech 的做法，**保留独立转换器分类**，但可以扩大其范围。同时 number-base（进制转换）当前在 Math Tools 下，其实也是转换器，应考虑迁移。**

### Q6: 密码生成器放在哪个分类？

| 站点 | 位置 |
|------|------|
| 10015.io | Miscellaneous Tools |
| lddgo.net | 字符分类（不是加密分类） |
| it-tools.tech | 无独立密码生成器，密码强度分析在 Crypto |

**建议：AAIGC 目前 password-generator 在独立的 Security Tools 分类（只有1个工具）。建议合并到：**
- **方案A**：移入 Developer Tools（与编码工具放在一起），删除 Security Tools 分类
- **方案B**：与编码工具合并为"编码与安全"分类，密码生成器放在其中

---

## 三、AAIGC 当前分类问题诊断

### 当前分类（7 类，26 个工具）

```
Developer Tools (8) — json-formatter, regex-tester, base64, url-encode, jwt-decoder, uuid-generator, html-preview, css-minifier
Text Tools (7) — markdown-preview, word-counter, text-diff, case-converter, lorem-ipsum, text-to-slug, list-sorter
Security Tools (1) — password-generator
Time Tools (2) — timestamp, date-calculator
Image Tools (3) — qrcode, color-picker, image-to-base64
Math Tools (2) — number-base, calculator
Converters (3) — yaml-json, html-entities, json-to-csv
```

### 主要问题

1. **Security Tools 只有 1 个工具** — 单独一个分类明显浪费，且 password-generator 与 base64/url-encode/jwt-decoder 更相关
2. **Converters 只有 3 个工具** — 但 yaml-json 和 json-to-csv 是数据格式转换，html-entities 是编码转换，与 base64/jwt-decoder 有重叠
3. **number-base（进制转换）在 Math Tools** — 但进制转换是"转换器"属性，与 Converters 分类更匹配
4. **image-to-base64 在 Image Tools** — 但 Base64 编解码同时又放在 Developer Tools，同一概念分散两处
5. **分类间边界模糊** — base64 是"编码"还是"转换"？html-entities 是"转换"还是"编码"？jwt-decoder 是"开发"还是"安全"？

---

## 四、分类优化方案

### 方案 A：精简合并（推荐 ★★★★★）

合并为 **5 个分类**，消除冗余分类，工具归属更清晰：

| 新分类 | 包含工具 | 工具数 | 说明 |
|--------|----------|--------|------|
| **Developer Tools** 🛠️ | json-formatter, regex-tester, base64, url-encode, jwt-decoder, uuid-generator, html-preview, css-minifier, **password-generator** | **9** | 合并原 Security Tools 进来，密码生成器与编码工具同属"开发者日常" |
| **Text Tools** 📝 | markdown-preview, word-counter, text-diff, case-converter, lorem-ipsum, text-to-slug, list-sorter | **7** | 不变 |
| **Converters** 🔄 | yaml-json, html-entities, json-to-csv, **number-base**, **timestamp**, **image-to-base64** | **6** | 合并进制转换、时间戳转换、图片转Base64进来 |
| **Image Tools** 🎨 | qrcode, color-picker | **2** | 移出 image-to-base64（归 Converters），规模缩小，但未来可扩展 |
| **Math & Time Tools** ⏱️ | calculator, **date-calculator** | **2** | 合并 Math 和 Time 为一个分类，日期计算器保留 |

**分类变化：** 7 → 5，删除 Security Tools、Time Tools、Math Tools 三个小分类

### 方案 B：保留 7 类但重新分配（推荐 ★★★★）

保持 7 个分类，但优化工具归属：

| 新分类 | 调整 |
|--------|------|
| **Developer Tools** 🛠️ | 保留 json-formatter, regex-tester, base64, url-encode, jwt-decoder, uuid-generator, html-preview, css-minifier |
| **Text Tools** 📝 | 不变 |
| **Security Tools** 🔒 | 新增：password-generator + 未来可扩展（密码强度检测、哈希生成器等） |
| **Time Tools** ⏰ | 不变 |
| **Image Tools** 🎨 | 移出 image-to-base64 |
| **Math Tools** 🧮 | 移出 number-base 到 Converters，新增 date-calculator（从 Time Tools 移入，因为日期计算本质是数学运算） |
| **Converters** 🔄 | 新增：number-base, timestamp, image-to-base64 |

### 方案 C：参照 lddgo.net 的中文分类（推荐 ★★★）

面向中文用户，参照 lddgo.net 分类方式：

| 新分类 | 包含工具 |
|--------|----------|
| **开发工具** 🛠️ | json-formatter, regex-tester, html-preview, css-minifier, uuid-generator |
| **编码转换** 🔐 | base64, url-encode, jwt-decoder, html-entities, password-generator, image-to-base64 |
| **文本工具** 📝 | markdown-preview, word-counter, text-diff, case-converter, lorem-ipsum, text-to-slug, list-sorter |
| **格式转换** 🔄 | yaml-json, json-to-csv, number-base |
| **时间工具** ⏰ | timestamp, date-calculator |
| **图像工具** 🎨 | qrcode, color-picker |
| **数学工具** 🧮 | calculator |

---

## 五、最终推荐

### 推荐方案 A（精简为 5 类）

**理由：**
1. AAIGC 目前只有 26 个工具，用 7 个分类过于分散，5 类更聚焦
2. 行业调研显示 5~8 个分类是主流
3. 消除"单工具分类"（Security Tools 只有 1 个工具）
4. 工具归属更清晰：base64 同时是"编码"和"转换"，放在 Converters 可以统一
5. 未来规划新工具时，5 类有足够扩展空间

### 实施建议

1. **修改 `data/tools.ts`** — 更新工具分类归属
2. **修改 `shared/types/index.ts`** — 更新 `ToolCategoryId` 类型
3. **修改 `shared/messages/*.json`** — 更新分类名称翻译
4. **修改 `apps/web/`** — 更新 UI 组件中的分类引用

### 关于加密/安全/编码类工具的定位

- 当前 AAIGC 的编码工具（base64, url-encode, jwt-decoder）放在 Developer Tools 是合理的
- 密码生成器移入 Developer Tools 后，与 UUID 生成器、JWT 解码器等"生成/解析"类工具放一起
- 未来如果增加密码强度检测、哈希生成、AES 加密等工具，可以再考虑恢复 Security Tools 分类
- 转换器独立分类保留，但扩大范围包含进制转换、时间戳转换等