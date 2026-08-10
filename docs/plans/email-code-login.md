# AAIGC 邮箱验证码登录 + 隐私同意留存

> 状态：进行中

## 改动清单

### 1. 数据库：User 表加 `termsAgreedAt`
- 记录用户同意隐私政策的时间
- 注册时保存时间戳

### 2. 注册 API：保存 privacy 同意记录
- `register/route.ts` 加 `termsAgreedAt: new Date()`

### 3. 邮箱验证码登录（send-verification 加 purpose=login）
- 登录时发验证码，**未注册用户禁止发验证码**（先查库，未注册直接返回 emailNotRegistered）
- 已注册用户 → 发验证码

### 4. 登录页加邮箱验证码登录 tab
- 输入邮箱 → 发验证码 → 输入验证码 → 登录
- 与密码登录、第三方登录并列

### 5. 翻译 key 补充
- 邮箱验证码登录相关的 key