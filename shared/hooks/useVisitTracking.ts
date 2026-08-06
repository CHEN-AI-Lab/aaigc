'use client'

import { useEffect } from 'react'
import { WORKER_URL } from '../constants'

export function useVisitTracking(project: string, page?: string, tool?: string) {
  useEffect(() => {
    const payload = JSON.stringify({
      project,
      page: page || window.location.pathname,
      tool: tool || null,
      type: tool ? 'tool' : 'page',
    })

    navigator.sendBeacon(`${WORKER_URL}/track`, payload)
  }, [project, page, tool])
}

export async function fetchStats(project: string) {
  const res = await fetch(`${WORKER_URL}/stats?project=${project}`)
  return res.json() as Promise<{ totalVisits: number; todayVisits: number; todayUV: number }>
}

export async function fetchDaily(project: string, days = 30, start?: string, end?: string) {
  let url = `${WORKER_URL}/daily?project=${project}`
  if (start && end) {
    url += `&start=${start}&end=${end}`
  } else {
    url += `&days=${days}`
  }
  const res = await fetch(url)
  return res.json() as Promise<{ date: string; visits: number }[]>
}

export async function fetchRanking(project: string, limit = 20, start?: string, end?: string): Promise<{ id: string; count: number }[]> {
  let url = `${WORKER_URL}/ranking?project=${project}&limit=${limit}`
  if (start && end) url += `&start=${start}&end=${end}`
  const res = await fetch(url)
  const data = (await res.json()) as string[]
  const ranking: { id: string; count: number }[] = []
  for (let i = 0; i < data.length; i += 2) {
    ranking.push({ id: data[i], count: parseInt(data[i + 1]) || 0 })
  }
  return ranking
}

export async function fetchOnline(project: string) {
  const res = await fetch(`${WORKER_URL}/online?project=${project}`)
  return res.json() as Promise<{ online: number }>
}

export async function fetchPages(project: string, limit = 20, start?: string, end?: string) {
  let url = `${WORKER_URL}/pages?project=${project}&limit=${limit}`
  if (start && end) url += `&start=${start}&end=${end}`
  const res = await fetch(url)
  return res.json() as Promise<{ page: string; visits: number }[]>
}

export async function fetchCountries(project: string, days = 7, start?: string, end?: string) {
  let url = `${WORKER_URL}/countries?project=${project}&days=${days}`
  if (start && end) url += `&start=${start}&end=${end}`
  const res = await fetch(url)
  return res.json() as Promise<{ country: string; visits: number }[]>
}

export async function fetchReferrer(project: string, limit = 20, start?: string, end?: string) {
  let url = `${WORKER_URL}/referrer?project=${project}&limit=${limit}`
  if (start && end) url += `&start=${start}&end=${end}`
  const res = await fetch(url)
  return res.json() as Promise<{ source: string; visits: number }[]>
}