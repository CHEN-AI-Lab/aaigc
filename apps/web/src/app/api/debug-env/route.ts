import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID ? `配置了(${process.env.AUTH_GOOGLE_ID.length}字符)` : "未配置",
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET ? `配置了(${process.env.AUTH_GOOGLE_SECRET.length}字符)` : "未配置",
    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID ? `配置了(${process.env.AUTH_GITHUB_ID.length}字符)` : "未配置",
    AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET ? `配置了(${process.env.AUTH_GITHUB_SECRET.length}字符)` : "未配置",
    AUTH_SECRET: process.env.AUTH_SECRET ? `配置了(${process.env.AUTH_SECRET.length}字符)` : "未配置",
    AUTH_URL: process.env.AUTH_URL || "未配置",
    VERCEL_URL: process.env.VERCEL_URL || "未配置",
  })
}