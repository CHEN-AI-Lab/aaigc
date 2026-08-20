# AAIGC 登录注册页面优化

> 参考 CookMate 的模式，优化 AAIGC 的登录注册体验

## 改动清单

| # | 改动 | 说明 |
|---|------|------|
| 1 | 新建 PasswordInput 组件 | 密码输入框带 show/hide 切换按钮 |
| 2 | 新建 check-password API | 登录前检查账号是否存在、是否设置了密码 |
| 3 | 登录页加已登录提示 | 已登录用户显示用户名+仪表盘/退出 |
| 4 | 登录页错误提示区分类型 | error/success/info 三种颜色 |
| 5 | 密码输入改为 PasswordInput | 登录页和注册页的密码框都换 |
| 6 | 登录前先 check-password | 调用 check-password API 预检查 |
| 7 | 注册页密码改为选填 | 密码非必填，降低注册门槛 |
| 8 | 注册页条款同意 fallback | 去掉硬编码英文回退 |
| 9 | 翻译 key 补充 | 如有缺失的 key 补充