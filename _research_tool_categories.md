# 在线工具集合站分类结构调研报告

> 调研日期: 2026-07-27
> 目的: 为 AAIGC 重新设计分类结构提供行业参考

---

## 1. https://it-tools.tech/

**分类总数: 10 个**

| # | 分类名称 | 图标 | 典型工具举例 |
|---|---------|------|------------|
| 1 | Crypto | 🔐 | AES加密解密, RSA密钥生成, 哈希计算 |
| 2 | Converter | 🔄 | Base64编解码, 数字进制转换, 单位换算 |
| 3 | Web | 🌐 | URL编码解码, HTML实体编码, 颜色转换 |
| 4 | Images & Videos | 🖼️ | 图片格式转换, 视频处理, SVG编辑 |
| 5 | Text | 📝 | 文本比较(diff), 大小写转换, 字数统计 |
| 6 | Development | 🛠️ | JSON格式化, 正则测试, JWT解码, YAML/JSON互转 |
| 7 | Network | 🌍 | IP查询, 端口扫描, DNS查询 |
| 8 | Maths | 📐 | 计算器, 科学计算, 进制转换 |
| 9 | Data | 📊 | CSV/JSON互转, XML格式化 |
| 10 | Other | 📦 | 计时器, 随机数生成, 密码生成器 |

**特点:**
- 左侧导航栏按分类分组，带图标
- 分类命名简洁，面向开发者
- 首页展示所有分类，每个分类下展示前几个工具

---

## 2. https://10015.io/tools

**分类总数: 7 个**

| # | 分类名称 | 图标(SVG) | 典型工具举例 |
|---|---------|-----------|------------|
| 1 | Text Tools | text-tools.svg | 文字大小写转换, 字数统计, 文本排序 |
| 2 | Image Tools | image-tools.svg | 图片滤镜, 图片裁剪, 图片格式转换 |
| 3 | CSS Tools | css-tools.svg | CSS压缩, CSS美化, CSS选择器测试 |
| 4 | Coding Tools | coding-tools.svg | Base64编解码, HTML美化, 正则测试 |
| 5 | Color Tools | color-tools.svg | 颜色选择器, 十六进制/RGB转换, 调色板 |
| 6 | Social Media Tools | social-media-tools.svg | Instagram帖子生成器, Twitter推文生成器, 缩略图下载 |
| 7 | Miscellaneous Tools | miscellaneous-tool.svg | PDF合并/拆分, 密码生成器, 二维码生成器 |

**特点:**
- 首页直接用分类卡片展示，每个卡片有图标和描述
- 顶部分类下拉菜单带SVG图标（非常精致）
- 分类命名简洁，易于理解
- 有专门的 Social Media 分类（独特）

---

## 3. https://tool.lu/

**分类总数: 2 个主要分类（另有更多子分类在工具页面）**

首页导航显示的主要分类:

| # | 分类名称 | 包含工具类型 |
|---|---------|------------|
| 1 | 设计类 | 拼图、图片高清放大、图片压缩、格子纸等 |
| 2 | 阅读类 | 手持弹幕、取名大师等 |

工具页面 (`/tool/`) 显示的具体工具分类标签（从每个工具的标签上提取）:

从工具卡片中提取的常见分类标签还包括各种功能标签，但该站没有严格的左侧分类导航，而是使用搜索+标签系统。工具页面是一个扁平列表，每个工具可归类到多个标签。

**特点:**
- 没有严格的分类体系，主要靠搜索和标签
- 首页是 Bento 网格布局，展示热门工具
- 更多依赖搜索和推荐算法
- 顶部导航有"工具"（全部列表）、"文库"、"码库"、"软件"等非工具板块

---

## 4. https://www.browserling.com/tools/

**分类总数: 11 个**

| # | 分类名称 | 图标 | 描述 | 典型工具举例 |
|---|---------|------|------|------------|
| 1 | Web tools | web-tools.png | URL编码/解码, HTML转义, JSON美化/压缩 | URL Encode, HTML Escape, JSON Prettify |
| 2 | Conversion tools | conversion-tools.png | 各种数据/文件/编码/文本/数字格式转换 | XML↔JSON, CSV↔JSON, YAML↔JSON |
| 3 | Encryption tools | encryption-tools.png | 加密和解密文本和字符串 | AES, RC4, ROT13, 3DES |
| 4 | Hash tools | hash-tools.png | 计算密码学哈希值 | MD5, SHA1, SHA256, Adler32 |
| 5 | Password tools | password-tools.png | 生成密码 | MySQL密码, bcrypt, scrypt, 随机密码 |
| 6 | Text tools | text-tools.png | 修改/排序/转换/删除和过滤文本 | 大小写转换, 文本排序, 正则提取 |
| 7 | Randomization tools | randomization-tools.png | 生成随机数/字符串/UUID/日期/IP | 随机密码, 随机字符串, 随机UUID |
| 8 | Image tools | image-tools.png | 转换/裁剪/调整图片大小 | JPG↔PNG, GIF↔PNG, 图片格式转换 |
| 9 | Time and date tools | (自动) | 日期格式转换, 日期计算 | Unix时间戳, 日期加减, 时区转换 |
| 10 | Math tools | math-tools.png | 数学计算, 质数/斐波那契数生成 | 进制转换, 质数生成, 科学计算器 |
| 11 | Other tools | (自动) | 其他杂项工具 | 文本转ASCII, 莫尔斯编码, 各种编码 |

**特点:**
- 分类非常细致，有 11 个分类
- 每个分类有独立的图标和描述
- 点击分类卡片展开工具列表（手风琴式交互）
- 分类数量最多，覆盖面最广
- 专门拆分出 Encryption tools 和 Hash tools 两个独立分类

---

## 5. https://www.lddgo.net/

**分类总数: 10 个**

| # | 分类名称 | 中文名称 | classID | 典型工具举例 |
|---|---------|---------|---------|------------|
| 1 | 字符 | 字符 | 1 | 随机数生成器, JSON转Markdown表格, JSON键重命名 |
| 2 | 转换 | 转换 | 2 | 单位换算, Protocol Buffers编解码, BaseN编解码, MessagePack↔JSON |
| 3 | 加密 | 加密 | 3 | SSL证书生成, 证书格式转换, ChaCha20加密解密 |
| 4 | 网络 | 网络 | 4 | CIDR聚合, IP查询, 网络工具 |
| 5 | 更多 | 更多 | 5 | 秒表计时器, 倒计时器, 其他杂项 |
| 6 | 图表 | 图表 | 6 | 饼图生成, 图表工具 |
| 7 | 数学 | 数学 | 7 | 分解质因数, 三角函数计算器, 数字排序 |
| 8 | 坐标 | 坐标 | 8 | RTCM3数据解析, Geohash编解码, 经纬度转换 |
| 9 | 图片 | 图片 | 9 | 老照片修复, 图片处理 |
| 10 | 文件 | 文件 | 10 | 批量文件重命名, 文件处理工具 |

**特点:**
- 顶部导航栏显示主要分类
- 有"更多"作为下拉菜单，包含子分类
- 每个工具卡片上标注所属分类标签
- 首页显示"416个在线工具软件，122626627次使用"（数据驱动）

---

## 6. AAIGC 当前分类结构

**分类总数: 7 个，共 26 个工具**

| # | 分类ID | 分类名称 | 图标 | 工具数量 |
|---|--------|---------|------|---------|
| 1 | dev | Developer Tools | 🛠️ | 12 |
| 2 | text | Text Tools | 📝 | 7 |
| 3 | security | Security Tools | 🔒 | 1 |
| 4 | time | Time Tools | ⏰ | 2 |
| 5 | image | Image Tools | 🎨 | 3 |
| 6 | math | Math Tools | 🧮 | 1 |
| 7 | convert | Converters | 🔄 | 0 |

---

## 7. 对比分析：各站分类数量

| 网站 | 分类数 | 总工具数 |
|------|-------|---------|
| it-tools.tech | 10 | ~130+ |
| 10015.io | 7 | ~100+ |
| tool.lu | 2(标签体系) | ~200+ |
| browserling.com | 11 | ~300+ |
| lddgo.net | 10 | 416 |
| **AAIGC (当前)** | **7** | **26** |

---

## 8. AAIGC 分类建议

### 推荐分类数: 10 个

### 建议的分类结构:

| # | 分类ID | 中文名称 | 英文名称 | 图标 | 说明 |
|---|--------|---------|---------|------|------|
| 1 | dev | 开发工具 | Developer Tools | 🛠️ | JSON格式化, 正则测试, Base64, URL编码, JWT解码, UUID生成, HTML预览, CSS压缩, YAML/JSON, 代码美化等 |
| 2 | text | 文本工具 | Text Tools | 📝 | Markdown预览, 字数统计, 文本对比, 大小写转换, Lorem Ipsum, 文本转Slug, 列表排序 |
| 3 | security | 安全工具 | Security Tools | 🔒 | 密码生成器, 哈希计算, AES加密解密, 随机密码 |
| 4 | time | 时间工具 | Time Tools | ⏰ | 时间戳转换, 日期计算器, 时区转换 |
| 5 | image | 图片工具 | Image Tools | 🎨 | 二维码生成器, 颜色选择器, 图片转Base64, 图片压缩, 图片格式转换 |
| 6 | math | 数学工具 | Math Tools | 🧮 | 计算器, 进制转换, 质数生成, 科学计算 |
| 7 | convert | 转换工具 | Converters | 🔄 | JSON↔CSV, 单位换算, 编码转换, 格式转换 |
| 8 | network | 网络工具 | Network Tools | 🌐 | IP查询, DNS查询, 端口扫描, CIDR计算 |
| 9 | ai | AI工具 | AI Tools | 🤖 | AI聊天, 提示词生成器, AI图像生成, AI文本处理 |
| 10 | other | 其他工具 | Other Tools | 📦 | 二维码生成, 计时器, 倒计时, 随机数, PDF工具 |

### 分类标准原则:

1. **按用户使用场景划分** — 用户在什么场景下需要什么工具（如"开发"、"文本处理"、"安全"）
2. **按工具功能类型划分** — 同类功能的工具归为一类（如"转换类"、"数学类"）
3. **保持均衡** — 每个分类的工具数量大致均衡，避免某个分类过多或过少
4. **预留未来扩展** — 为 AI 工具、网络工具等预留分类空间
5. **命名清晰直观** — 用户一看就懂，不需要猜测
6. **参考行业标准** — 以上 5 个站的分类共同点决定了"标准分类"

### 关键变化:

1. **新增 AI Tools (AI工具)** — 这是当前工具站的最大趋势，10015.io 已开始融入 AI 工具
2. **新增 Network Tools (网络工具)** — 几乎所有同行都有这个分类
3. **新增 Other (其他)** — 放置无法归类的工具，避免"无家可归"
4. **合并 Security → 安全工具** — 从单一的"密码生成器"扩展为密码+加密+哈希
5. **Convert (转换器) 保留** — 专门用于格式转换类工具

### 与当前结构的映射:

```
当前: dev (12) → 保留为 Developer Tools
当前: text (7)  → 保留为 Text Tools
当前: security (1) → 扩展为 Security Tools (密码+加密+哈希)
当前: time (2)   → 保留为 Time Tools
当前: image (3)  → 保留为 Image Tools
当前: math (1)   → 保留为 Math Tools
当前: convert (0) → 保留为 Converters

新增: network → Network Tools
新增: ai     → AI Tools
新增: other  → Other Tools
```

### 哪些站的分类值得参考:

| 网站 | 最值得参考的点 |
|------|--------------|
| **it-tools.tech** | 分类命名简洁、开发者导向、左侧导航交互 |
| **10015.io** | 分类卡片设计、SVG图标、Social Media 分类思路 |
| **browserling.com** | 分类最全面、Encryption/Hash 拆分思路 |
| **lddgo.net** | 中文分类命名、大数量工具管理经验 |
| **tool.lu** | 搜索+标签替代分类的思路（适合工具数量极大时） |