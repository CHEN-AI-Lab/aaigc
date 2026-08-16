import { WORKER_URL } from '../constants'

function getEnv(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_VERCEL_ENV) {
    return process.env.NEXT_PUBLIC_VERCEL_ENV
  }
  return 'production'
}
const env = getEnv()

export async function fetchStats(project: string) {
  const res = await fetch(`${WORKER_URL}/stats?project=${project}&env=${env}`)
  return res.json() as Promise<{ totalVisits: number; totalPageviews: number; totalUV: number }>
}

export async function fetchDaily(project: string, days = 30, start?: string, end?: string) {
  let url = `${WORKER_URL}/daily?project=${project}&env=${env}`
  if (start && end) { url += `&start=${start}&end=${end}` } else { url += `&days=${days}` }
  const res = await fetch(url)
  return res.json() as Promise<{ date: string; visits: number }[]>
}

export async function fetchRanking(project: string, limit = 20, start?: string, end?: string): Promise<{ id: string; count: number }[]> {
  let url = `${WORKER_URL}/ranking?project=${project}&limit=${limit}&env=${env}`
  if (start && end) url += `&start=${start}&end=${end}`
  const res = await fetch(url)
  const data = (await res.json()) as { id: string; count: number }[]
  return Array.isArray(data) ? data : []
}

export async function fetchOnline(project: string) {
  const res = await fetch(`${WORKER_URL}/online?project=${project}&env=${env}`)
  return res.json() as Promise<{ online: number }>
}

export async function fetchPages(project: string, limit = 20, start?: string, end?: string) {
  let url = `${WORKER_URL}/pages?project=${project}&limit=${limit}&env=${env}`
  if (start && end) url += `&start=${start}&end=${end}`
  const res = await fetch(url)
  return res.json() as Promise<{ page: string; visits: number }[]>
}

export async function fetchCountries(project: string, days = 7, start?: string, end?: string) {
  let url = `${WORKER_URL}/countries?project=${project}&days=${days}&env=${env}`
  if (start && end) url += `&start=${start}&end=${end}`
  const res = await fetch(url)
  return res.json() as Promise<{ country: string; visits: number }[]>
}

export async function fetchReferrer(project: string, limit = 20, start?: string, end?: string) {
  let url = `${WORKER_URL}/referrer?project=${project}&limit=${limit}&env=${env}`
  if (start && end) url += `&start=${start}&end=${end}`
  const res = await fetch(url)
  return res.json() as Promise<{ source: string; visits: number }[]>
}