-- Additive migration: 新增 RateLimit 表，替代内存 Map 限流。
-- Vercel 多实例共享同一份数据，解决 serverless 下内存限流失效问题。

CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowStart" BIGINT NOT NULL DEFAULT 0,
    "lockedUntil" BIGINT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);
