// 收藏同步纯逻辑单测（架构 §4.3：R-1 幂等 / R-2 单设备 LWW / R-3 跨设备 LWW / R-4 无墓碑）

import { describe, expect, it } from 'vitest'
import type { FavoriteItemRecord, FavoriteMutation, FavoriteSnapshot } from 'shared/types/api'
import { favoriteSet } from 'shared/api/favorites'
import {
  applyMutations,
  compactQueue,
  favoriteKey,
  filterStaleMutations,
  hasFavorite,
  mergeFavorites,
  sortMutations,
} from 'shared/utils/favorite-sync'

function item(toolId: string, type = 'tool', createdAt = '2025-01-01T00:00:00.000Z'): FavoriteItemRecord {
  return { id: `${type}:${toolId}`, toolId, type, createdAt }
}

function op(
  opId: string,
  action: 'add' | 'remove',
  toolId: string,
  clientTs: string,
  type = 'tool',
): FavoriteMutation {
  return { opId, action, toolId, type, clientTs }
}

describe('favoriteKey', () => {
  it('combines type and toolId', () => {
    expect(favoriteKey('json-formatter', 'tool')).toBe('tool:json-formatter')
    expect(favoriteKey('aaigc', 'product')).toBe('product:aaigc')
  })
})

describe('sortMutations', () => {
  it('orders by clientTs then opId (R-2)', () => {
    const ordered = sortMutations([
      op('b', 'add', 'x', '2025-01-02T00:00:00.000Z'),
      op('a', 'add', 'x', '2025-01-01T00:00:00.000Z'),
      op('c', 'remove', 'x', '2025-01-02T00:00:00.000Z'),
    ])
    expect(ordered.map((entry) => entry.opId)).toEqual(['a', 'b', 'c'])
  })

  it('breaks ties on opId so replay is deterministic', () => {
    const ordered = sortMutations([
      op('op-2', 'add', 'x', '2025-01-01T00:00:00.000Z'),
      op('op-1', 'add', 'x', '2025-01-01T00:00:00.000Z'),
    ])
    expect(ordered.map((entry) => entry.opId)).toEqual(['op-1', 'op-2'])
  })

  it('does not mutate the input array', () => {
    const input = [op('b', 'add', 'x', '2025-01-02T00:00:00.000Z'), op('a', 'add', 'x', '2025-01-01T00:00:00.000Z')]
    sortMutations(input)
    expect(input[0]?.opId).toBe('b')
  })
})

describe('filterStaleMutations', () => {
  it('keeps everything when there is no checkpoint', () => {
    const ops = [op('a', 'add', 'x', '2025-01-01T00:00:00.000Z')]
    expect(filterStaleMutations(ops)).toEqual({ fresh: ops, skippedOpIds: [] })
  })

  it('drops ops at or before lastSyncedAt (R-4)', () => {
    const ops = [
      op('old', 'add', 'x', '2025-01-01T00:00:00.000Z'),
      op('same', 'add', 'y', '2025-01-02T00:00:00.000Z'),
      op('new', 'add', 'z', '2025-01-03T00:00:00.000Z'),
    ]
    const result = filterStaleMutations(ops, '2025-01-02T00:00:00.000Z')
    expect(result.fresh.map((entry) => entry.opId)).toEqual(['new'])
    expect(result.skippedOpIds).toEqual(['old', 'same'])
  })
})

describe('applyMutations', () => {
  it('adds an item (upsert) and is idempotent for repeated adds (R-1)', () => {
    const first = applyMutations([], [op('a1', 'add', 'x', '2025-01-01T00:00:00.000Z')], {
      serverTime: '2025-02-01T00:00:00.000Z',
    })
    expect(first.favorites).toEqual([item('x', 'tool', '2025-02-01T00:00:00.000Z')])
    expect(first.appliedOpIds).toEqual(['a1'])

    const second = applyMutations(
      first.favorites,
      [op('a1', 'add', 'x', '2025-01-01T00:00:00.000Z'), op('a2', 'add', 'x', '2025-01-02T00:00:00.000Z')],
      { serverTime: '2025-02-02T00:00:00.000Z' },
    )
    expect(second.favorites).toHaveLength(1)
    expect(second.favorites[0]?.createdAt).toBe('2025-02-01T00:00:00.000Z')
    expect(second.appliedOpIds).toEqual(['a1', 'a2'])
  })

  it('removes an item and stays successful when it is already absent (R-1)', () => {
    const result = applyMutations([item('x')], [op('r1', 'remove', 'x', '2025-01-05T00:00:00.000Z')], {
      serverTime: '2025-02-01T00:00:00.000Z',
    })
    expect(result.favorites).toEqual([])
    const again = applyMutations([], [op('r1', 'remove', 'x', '2025-01-05T00:00:00.000Z')], {
      serverTime: '2025-02-01T00:00:00.000Z',
    })
    expect(again.favorites).toEqual([])
    expect(again.appliedOpIds).toEqual(['r1'])
  })

  it('replays the queue in clientTs order (R-2 单设备 LWW)', () => {
    const result = applyMutations(
      [],
      [op('remove-later', 'remove', 'x', '2025-01-09T00:00:00.000Z'), op('add-first', 'add', 'x', '2025-01-01T00:00:00.000Z')],
      { serverTime: '2025-02-01T00:00:00.000Z' },
    )
    expect(result.appliedOpIds).toEqual(['add-first', 'remove-later'])
    expect(result.favorites).toEqual([])
  })

  it('ignores stale ops so an old add cannot resurrect a removed item (R-4)', () => {
    const result = applyMutations([], [op('old-add', 'add', 'x', '2025-01-01T00:00:00.000Z')], {
      lastSyncedAt: '2025-01-05T00:00:00.000Z',
      serverTime: '2025-02-01T00:00:00.000Z',
    })
    expect(result.favorites).toEqual([])
    expect(result.skippedOpIds).toEqual(['old-add'])
    expect(result.appliedOpIds).toEqual([])
  })

  it('keeps the server snapshot when a later remove already won (R-3 跨设备 LWW)', () => {
    const result = applyMutations([], [op('a', 'add', 'x', '2025-01-01T00:00:00.000Z')], {
      lastSyncedAt: '2025-01-02T00:00:00.000Z',
      serverTime: '2025-02-01T00:00:00.000Z',
    })
    expect(result.favorites).toEqual([])
  })

  it('sorts the output by createdAt descending', () => {
    const result = applyMutations(
      [],
      [op('a', 'add', 'early', '2025-01-01T00:00:00.000Z'), op('b', 'add', 'late', '2025-01-09T00:00:00.000Z')],
      { serverTime: '2025-02-01T00:00:00.000Z' },
    )
    expect(result.favorites.map((entry) => entry.toolId)).toEqual(['early', 'late'])
  })

  it('uses the injected id factory when provided', () => {
    const result = applyMutations([], [op('a', 'add', 'x', '2025-01-01T00:00:00.000Z')], {
      serverTime: '2025-02-01T00:00:00.000Z',
      makeId: (toolId, type) => `db-${type}-${toolId}`,
    })
    expect(result.favorites[0]?.id).toBe('db-tool-x')
    expect(result.serverTime).toBe('2025-02-01T00:00:00.000Z')
  })
})

describe('hasFavorite / favoriteSet', () => {
  const snapshot: FavoriteSnapshot = {
    favorites: [item('x'), item('p', 'product')],
    serverTime: '2025-02-01T00:00:00.000Z',
  }

  it('detects membership by toolId and type', () => {
    expect(hasFavorite(snapshot, 'x', 'tool')).toBe(true)
    expect(hasFavorite(snapshot, 'x', 'product')).toBe(false)
    expect(hasFavorite(snapshot, 'p', 'product')).toBe(true)
    expect(hasFavorite(snapshot, 'missing', 'tool')).toBe(false)
  })

  it('builds a key set for O(1) lookups', () => {
    const set = favoriteSet(snapshot)
    expect(set.has('tool:x')).toBe(true)
    expect(set.has('product:p')).toBe(true)
    expect(set.size).toBe(2)
  })
})

describe('mergeFavorites', () => {
  const snapshot: FavoriteSnapshot = {
    favorites: [item('x')],
    serverTime: '2025-02-01T00:00:00.000Z',
  }

  it('returns the snapshot unchanged when the queue is empty', () => {
    expect(mergeFavorites(snapshot, [])).toBe(snapshot)
  })

  it('overlays pending ops on top of the server snapshot', () => {
    const merged = mergeFavorites(snapshot, [op('a', 'add', 'y', '2025-02-02T00:00:00.000Z')])
    expect(merged.favorites.map((entry) => entry.toolId).sort()).toEqual(['x', 'y'])
    expect(merged.serverTime).toBe('2025-02-01T00:00:00.000Z')
  })

  it('drops pending ops that are already covered by the checkpoint', () => {
    const merged = mergeFavorites(snapshot, [op('a', 'add', 'y', '2025-01-01T00:00:00.000Z')], '2025-02-01T00:00:00.000Z')
    expect(merged.favorites.map((entry) => entry.toolId)).toEqual(['x'])
  })
})

describe('compactQueue', () => {
  it('keeps only the last op per key', () => {
    const compacted = compactQueue([
      op('a1', 'add', 'x', '2025-01-01T00:00:00.000Z'),
      op('a2', 'remove', 'x', '2025-01-02T00:00:00.000Z'),
      op('b1', 'add', 'y', '2025-01-03T00:00:00.000Z'),
    ])
    expect(compacted.map((entry) => entry.opId)).toEqual(['a2', 'b1'])
  })

  it('never loses distinct keys and stays sorted', () => {
    const compacted = compactQueue([
      op('b1', 'add', 'y', '2025-01-03T00:00:00.000Z'),
      op('a1', 'add', 'x', '2025-01-01T00:00:00.000Z'),
      op('b2', 'remove', 'y', '2025-01-04T00:00:00.000Z'),
    ])
    expect(compacted.map((entry) => entry.opId)).toEqual(['a1', 'b2'])
  })
})
