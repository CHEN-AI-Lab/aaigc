import { describe, it, expect } from 'vitest'
import { applyRules, type FileWithPath, type RenameRule } from '../../shared/utils/fileRename'

const files: FileWithPath[] = [
  { name: 'IMG_1234.jpg', path: 'photos/IMG_1234.jpg' },
  { name: 'IMG_5678.jpg', path: 'photos/IMG_5678.jpg' },
  { name: 'note.txt', path: 'docs/note.txt' },
]

describe('fileRename applyRules', () => {
  it('returns preview items for all files unchanged when no rules', () => {
    const result = applyRules(files, [])
    expect(result).toHaveLength(3)
    for (const item of result) {
      expect(item.newName).toBe(item.originalName)
      expect(item.changed).toBe(false)
      expect(item.conflict).toBe(false)
    }
  })

  it('applies prefix rule', () => {
    const result = applyRules(files, [{ type: 'prefix', text: '2026-' } as RenameRule])
    expect(result[0].newName).toBe('2026-IMG_1234.jpg')
    expect(result[0].changed).toBe(true)
  })

  it('applies find-replace rule', () => {
    const result = applyRules(files, [{ type: 'findReplace', find: 'IMG_', replace: 'Photo_' } as RenameRule])
    expect(result[0].newName).toBe('Photo_1234.jpg')
  })

  it('applies suffix rule to base name, keeping extension', () => {
    const result = applyRules(files, [{ type: 'suffix', text: '_v2' } as RenameRule])
    expect(result[0].newName).toBe('IMG_1234_v2.jpg')
  })

  it('applies case rule lower', () => {
    const result = applyRules(files, [{ type: 'case', mode: 'lower' } as RenameRule])
    expect(result[0].newName).toBe('img_1234.jpg')
  })

  it('keeps dotfiles without extension intact', () => {
    const result = applyRules([{ name: '.gitignore', path: '.gitignore' }], [{ type: 'prefix', text: 'x_' } as RenameRule])
    expect(result[0].newName).toBe('x_.gitignore')
  })

  it('detects conflicts when two files map to the same new name', () => {
    // 'a b.txt' with clean(removeSpaces) → 'ab.txt' collides with 'ab.txt' (unchanged)
    const dupFiles: FileWithPath[] = [
      { name: 'a b.txt', path: 'docs/a b.txt' },
      { name: 'ab.txt', path: 'docs/ab.txt' },
    ]
    const result = applyRules(dupFiles, [{ type: 'clean', removeSpaces: true, removeSpecialChars: false, spaceReplacement: '' } as RenameRule])
    expect(result[0].newName).toBe('ab.txt')
    expect(result[1].newName).toBe('ab.txt')
    expect(result[0].conflict).toBe(true)
    expect(result[1].conflict).toBe(true)
  })
})