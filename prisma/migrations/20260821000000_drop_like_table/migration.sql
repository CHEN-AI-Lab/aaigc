-- DropTable
-- 重构移除 Like 功能时数据库已手动删过该表，此处确保迁移历史与库结构一致（幂等）
DROP TABLE IF EXISTS "Like";
