-- DropColumn
-- safety: ignore: 经人工确认（2026-09-02），avatarMode/avatarChar 字段为废弃功能残留，
-- 代码已全部清理（grep 确认无引用），字段无用户数据（avatarChar 全 NULL，avatarMode 仅默认值），安全删除。
ALTER TABLE "User" DROP COLUMN IF EXISTS "avatarMode";
ALTER TABLE "User" DROP COLUMN IF EXISTS "avatarChar";
