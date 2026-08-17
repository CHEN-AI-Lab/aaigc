import { WORKER_URL } from '../constants'

function getEnv(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_VERCEL_ENV) {
    return process.env.NEXT_PUBLIC_VERCEL_ENV
  }
  return 'production'
}
const env = getEnv()

export async function fetchRanking(project: string, limit = 20, start?: string, end?: string): Promise<{ id: string; count: number }[]> {
  let url = `${WORKER_URL}/ranking?project=${project}&limit=${limit}&env=${env}`
  if (start && end) url += `&start=${start}&end=${end}`
  const res = await fetch(url)
  const data = (await res.json()) as { id: string; count: number }[]
  return Array.isArray(data) ? data : []
}