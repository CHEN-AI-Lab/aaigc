-- DropTable
-- 重构移除 Like 功能时数据库已手动删过该表，此处确保迁移历史与库结构一致（幂等）
-- safety: ignore: 经人工确认（2026-08-21），Like 表在测试库与正式库均已不存在，此迁移为幂等空操作，不会删除任何数据
DROP TABLE IF EXISTS "Like";
