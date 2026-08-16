# 51 Warnings 修复计划 + 测试补充

> 最后更新：2026-08-12
> 目标：将 51 个 warnings 全部清掉 + 补充缺失的测试

## 测试覆盖现状

| 文件 | 修改内容 | 是否有测试 | 需要新测试 |
|------|---------|:-:|:-:|
| AccountClient.tsx | 纯类型改动（`as any` → 精确类型） | ❌ | 不需要（运行时不变） |
| Calculator.tsx | 加 deps + 类型化 | ✅ `Calculator.test.tsx` | 不需要 |
| DateCalculator.tsx | 加 deps | ❌ | **需要** |
| DnsLookup.tsx | 纯类型改动（`any[]` → 接口） | ❌ | 不需要（运行时不变） |
| FileRenamer.tsx | 纯类型改动（加注释） | ❌（有 `fileRename.test.ts` 覆盖 utils） | 不需要（运行时不变） |
| ImageConverter.tsx | 加 deps + 改解构 | ❌ | **需要** |
| IpLookup.tsx | 加 deps | ❌ | **需要** |
| JsonToCsv.tsx | 加 deps | ❌ | **需要** |

---

## 修改顺序

### 第一组：exhaustive-deps（9 个）

#### 1.1 Calculator.tsx:737
- 修改：`[startYear, startMonth]` → `[startYear, startMonth, startDay]`
- 测试：已有 `Calculator.test.tsx`，不需要新增

#### 1.2 DateCalculator.tsx:121, 138, 148
- 修改：3 个 `useCallback` 依赖数组加 `t`
- 测试：新增 `tests/unit/components/DateCalculator.test.tsx`

#### 1.3 FileRenamer.tsx:266
- 修改：`handleDrop` 的 `useCallback` 加 `handleFolderDrop`
- 测试：不需要（运行时不变）

#### 1.4 FileRenamer.tsx:442
- 修改：`handleExecute` 的 `useCallback` 加 `directRename` 和 `zipDownload`
- 测试：不需要（运行时不变）

#### 1.5 ImageConverter.tsx:185
- 修改：加 `showToast` 到依赖数组
- 测试：新增 `tests/unit/components/ImageConverter.test.tsx`

#### 1.6 IpLookup.tsx:23
- 修改：加 `err` 到依赖数组
- 测试：新增 `tests/unit/components/IpLookup.test.tsx`

#### 1.7 JsonToCsv.tsx:101
- 修改：加 `flatten` 到依赖数组
- 测试：新增 `tests/unit/components/JsonToCsv.test.tsx`

---

### 第二组：no-explicit-any（41 个）

#### 2.1 AccountClient.tsx:101
- 修改：`(session.user as any)?.role` → `(session.user as { role?: string })?.role`
- 测试：不需要（纯类型改动，运行时不变）

#### 2.2 Calculator.tsx:963-1066（9 个）
- 修改：定义 `MortgageResult` 接口，`(result as any)` → `(result as MortgageResult)`
- 测试：已有 `Calculator.test.tsx`，不需要新增

#### 2.3 DnsLookup.tsx:14
- 修改：定义 `DnsRecord` 接口，`useState<any[] | null>` → `useState<DnsRecord[] | null>`
- 测试：不需要（纯类型改动，运行时不变）

#### 2.4 FileRenamer.tsx:206-759（30 个）
- 修复合计 30 处：
  - `(window as any).xxx`（4 处）：浏览器实验性 API，加 `eslint-disable-next-line` 注释
  - `(rule as any).xxx`（26 处）：动态属性访问，加 `eslint-disable-next-line` 注释
- 测试：不需要（纯加注释，运行时不变）

---

### 第三组：no-unused-vars（1 个）

#### 3.1 ImageConverter.tsx:64
- 修改：`const [error, setError] = useState('')` → `const [, setError] = useState('')`
- 测试：新增 `ImageConverter.test.tsx`（与 1.5 合并）

---

### 第四组：新增测试（4 个新文件）

#### 4.1 DateCalculator.test.tsx
- 渲染测试：验证组件能正常渲染，不报错
- 功能测试：验证日期计算基本功能

#### 4.2 ImageConverter.test.tsx
- 渲染测试：验证组件能正常渲染，不报错
- 验证 `setError` 被正常调用

#### 4.3 IpLookup.test.tsx
- 渲染测试：验证组件能正常渲染，不报错
- 验证 locale 被正确传递

#### 4.4 JsonToCsv.test.tsx
- 渲染测试：验证组件能正常渲染，不报错
- 验证 JSON 转换功能

---

### 第五组：验证

#### 5.1 跑 lint → 0 errors 0 warnings
#### 5.2 跑 typecheck → 通过
#### 5.3 跑 test → 全部通过
#### 5.4 跑 build → 通过
#### 5.5 跑 check.sh → 全部通过

---

## 执行清单

```
[ ] 1.1 Calculator.tsx:737 — 加 startDay deps
[ ] 1.2 DateCalculator.tsx:121,138,148 — 加 t deps
[ ] 1.3 FileRenamer.tsx:266 — 加 handleFolderDrop deps
[ ] 1.4 FileRenamer.tsx:442 — 加 directRename/zipDownload deps
[ ] 1.5 ImageConverter.tsx:185 — 加 showToast deps
[ ] 1.6 IpLookup.tsx:23 — 加 err deps
[ ] 1.7 JsonToCsv.tsx:101 — 加 flatten deps
[ ] 2.1 AccountClient.tsx:101 — 精确类型替代 as any
[ ] 2.2 Calculator.tsx:963-1066 — 定义 MortgageResult 接口
[ ] 2.3 DnsLookup.tsx:14 — 定义 DnsRecord 接口
[ ] 2.4 FileRenamer.tsx:206-759 — 30 处加 disable 注释
[ ] 3.1 ImageConverter.tsx:64 — error → [, setError]
[ ] 4.1 新增 DateCalculator.test.tsx
[ ] 4.2 新增 ImageConverter.test.tsx
[ ] 4.3 新增 IpLookup.test.tsx
[ ] 4.4 新增 JsonToCsv.test.tsx
[ ] 5.1 lint 0 errors 0 warnings
[ ] 5.2 typecheck 通过
[ ] 5.3 test 全部通过
[ ] 5.4 build 通过
[ ] 5.5 check.sh 全部通过
```