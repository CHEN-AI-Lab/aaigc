// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor, cleanup } from '@testing-library/react'
import React from 'react'

afterEach(cleanup)

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const table: Record<string, string> = {
      favorite: 'Favorite',
      favorited: 'Favorited',
      favoriteSuccess: 'Added to favorites',
      unfavoriteSuccess: 'Removed from favorites',
      loginRequired: 'Please log in to save favorites',
      myFavorites: 'My Favorites',
      noFavorites: 'No favorites yet',
    }
    return table[key] || key
  },
}))

// Mock next-auth
vi.mock('@/auth-client', () => ({
  useSession: vi.fn(),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

// Mock @/i18n/navigation
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href }, children),
}))

import { useSession } from '../../../apps/web/src/auth-client'
import { FavoritesProvider, useFavorites } from '../../../apps/web/src/components/FavoritesProvider'

// Helper: render with provider
function renderWithProvider(ui: React.ReactElement) {
  return render(React.createElement(FavoritesProvider, null, ui))
}

// Test component that uses the hook
function TestConsumer() {
  const { isFavorited, toggleFavorite, favorites, loading } = useFavorites()
  return React.createElement('div', null,
    React.createElement('span', { 'data-testid': 'loading' }, String(loading)),
    React.createElement('span', { 'data-testid': 'count' }, String(favorites.length)),
    React.createElement('button', {
      'data-testid': 'check',
      onClick: () => { isFavorited('json-formatter', 'tool') },
    }, 'Check'),
    React.createElement('button', {
      'data-testid': 'toggle',
      onClick: () => toggleFavorite('json-formatter', 'tool'),
    }, 'Toggle'),
  )
}

describe('useFavorites', () => {
  it('should throw when used outside FavoritesProvider', () => {
    expect(() => render(React.createElement(TestConsumer))).toThrow(
      'useFavorites must be used within <FavoritesProvider>'
    )
  })

  it('should return empty favorites when not logged in', () => {
    vi.mocked(useSession).mockReturnValue({ data: null, status: 'unauthenticated' } as any)
    renderWithProvider(React.createElement(TestConsumer))
    expect(screen.getByTestId('count').textContent).toBe('0')
  })

  it('should fetch favorites when logged in', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: '1', name: 'Test' } },
      status: 'authenticated',
    } as any)

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        favorites: [
          { id: '1', toolId: 'json-formatter', type: 'tool', createdAt: '2026-08-01T00:00:00Z' },
          { id: '2', toolId: 'cookmate', type: 'product', createdAt: '2026-08-02T00:00:00Z' },
        ],
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    renderWithProvider(React.createElement(TestConsumer))

    // Wait for fetch to complete
    await waitFor(() => {
      expect(screen.getByTestId('count').textContent).toBe('2')
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/favorites')

    vi.unstubAllGlobals()
  })

  it('should toggle favorite via API', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: '1', name: 'Test' } },
      status: 'authenticated',
    } as any)

    // First fetch returns empty
    const fetchGet = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ favorites: [] }),
    })

    // POST toggle returns favorited
    const fetchPost = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ isFavorited: true }),
    })

    // First call = GET, second call = POST
    const mockFetch = vi.fn((url, opts) => {
      if (opts?.method === 'POST') return fetchPost()
      return fetchGet()
    })
    vi.stubGlobal('fetch', mockFetch)

    renderWithProvider(React.createElement(TestConsumer))

    // Wait for GET to complete
    await waitFor(() => {
      expect(screen.getByTestId('count').textContent).toBe('0')
    })

    // Click toggle
    await act(async () => {
      fireEvent.click(screen.getByTestId('toggle'))
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolId: 'json-formatter', type: 'tool' }),
    })

    // After toggle, favorites should be 1
    await waitFor(() => {
      expect(screen.getByTestId('count').textContent).toBe('1')
    })

    vi.unstubAllGlobals()
  })
})