import { describe, it, expect } from 'vitest'
import {
  applyRules,
  type RenameRule,
  type FileWithPath,
} from '../../shared/utils/fileRename'

const mockFiles: FileWithPath[] = [
  { name: 'IMG_1234.jpg', path: 'photos/IMG_1234.jpg' },
  { name: 'IMG_5678.jpg', path: 'photos/IMG_5678.jpg' },
  { name: 'note.txt', path: 'photos/note.txt' },
  { name: 'Screenshot 2024-01-15 at 10.30.00.png', path: 'photos/Screenshot 2024-01-15 at 10.30.00.png' },
]

describe('fileRename', () => {
  describe('findReplace', () => {
    it('replaces a substring in all filenames', () => {
      const rules: RenameRule[] = [{ type: 'findReplace', find: 'IMG_', replace: 'photo_' }]
      const result = applyRules(mockFiles.slice(0, 2), rules)
      expect(result[0].newName).toBe('photo_1234.jpg')
      expect(result[1].newName).toBe('photo_5678.jpg')
      expect(result[0].changed).toBe(true)
    })

    it('leaves unchanged when no match', () => {
      const rules: RenameRule[] = [{ type: 'findReplace', find: 'ZZZ', replace: 'X' }]
      const result = applyRules([mockFiles[2]], rules)
      expect(result[0].newName).toBe('note.txt')
      expect(result[0].changed).toBe(false)
    })
  })

  describe('prefix', () => {
    it('adds prefix to all filenames', () => {
      const rules: RenameRule[] = [{ type: 'prefix', text: '2024_' }]
      const result = applyRules([mockFiles[0]], rules)
      expect(result[0].newName).toBe('2024_IMG_1234.jpg')
    })
  })

  describe('suffix', () => {
    it('adds suffix before extension', () => {
      const rules: RenameRule[] = [{ type: 'suffix', text: '_final' }]
      const result = applyRules([mockFiles[0]], rules)
      expect(result[0].newName).toBe('IMG_1234_final.jpg')
    })
  })

  describe('numbering', () => {
    it('adds sequential numbers as prefix', () => {
      const rules: RenameRule[] = [{ type: 'numbering', start: 1, digits: 3, position: 'prefix' }]
      const result = applyRules(mockFiles.slice(0, 3), rules)
      expect(result[0].newName).toBe('001IMG_1234.jpg')
      expect(result[1].newName).toBe('002IMG_5678.jpg')
      expect(result[2].newName).toBe('003note.txt')
    })

    it('adds sequential numbers as suffix', () => {
      const rules: RenameRule[] = [{ type: 'numbering', start: 0, digits: 2, position: 'suffix' }]
      const result = applyRules(mockFiles.slice(0, 2), rules)
      expect(result[0].newName).toBe('IMG_123400.jpg')
      expect(result[1].newName).toBe('IMG_567801.jpg')
    })

    it('replaces original name when replaceOriginal is true', () => {
      const rules: RenameRule[] = [{ type: 'numbering', start: 1, digits: 3, position: 'prefix', replaceOriginal: true }]
      const result = applyRules(mockFiles.slice(0, 3), rules)
      expect(result[0].newName).toBe('001.jpg')
      expect(result[1].newName).toBe('002.jpg')
      expect(result[2].newName).toBe('003.txt')
    })
  })

  describe('deleteBefore', () => {
    it('keeps everything from the matched text onwards', () => {
      const rules: RenameRule[] = [{ type: 'deleteBefore', text: '2024' }]
      const result = applyRules([{ name: 'IMG_20240101.jpg', path: 'IMG_20240101.jpg' }], rules)
      expect(result[0].newName).toBe('20240101.jpg')
    })

    it('leaves unchanged when text not found', () => {
      const rules: RenameRule[] = [{ type: 'deleteBefore', text: 'ZZZ' }]
      const result = applyRules([mockFiles[0]], rules)
      expect(result[0].newName).toBe('IMG_1234.jpg')
      expect(result[0].changed).toBe(false)
    })
  })

  describe('deleteAfter', () => {
    it('keeps everything up to and including the matched text', () => {
      const rules: RenameRule[] = [{ type: 'deleteAfter', text: '2024' }]
      const result = applyRules([{ name: 'IMG_20240101.jpg', path: 'IMG_20240101.jpg' }], rules)
      expect(result[0].newName).toBe('IMG_2024.jpg')
    })

    it('leaves unchanged when text not found', () => {
      const rules: RenameRule[] = [{ type: 'deleteAfter', text: 'ZZZ' }]
      const result = applyRules([mockFiles[0]], rules)
      expect(result[0].newName).toBe('IMG_1234.jpg')
      expect(result[0].changed).toBe(false)
    })
  })

  describe('case', () => {
    it('converts to uppercase', () => {
      const rules: RenameRule[] = [{ type: 'case', mode: 'upper' }]
      const result = applyRules([{ name: 'hello.jpg', path: 'hello.jpg' }], rules)
      expect(result[0].newName).toBe('HELLO.jpg')
    })

    it('converts to lowercase', () => {
      const rules: RenameRule[] = [{ type: 'case', mode: 'lower' }]
      const result = applyRules([mockFiles[3]], rules)
      expect(result[0].newName).toBe('screenshot 2024-01-15 at 10.30.00.png')
    })
  })

  describe('clean', () => {
    it('removes spaces', () => {
      const rules: RenameRule[] = [{ type: 'clean', removeSpaces: true, removeSpecialChars: false, spaceReplacement: '' }]
      const result = applyRules([mockFiles[3]], rules)
      expect(result[0].newName).toBe('Screenshot2024-01-15at10.30.00.png')
    })

    it('replaces spaces with underscore', () => {
      const rules: RenameRule[] = [{ type: 'clean', removeSpaces: true, removeSpecialChars: false, spaceReplacement: '_' }]
      const result = applyRules([mockFiles[3]], rules)
      expect(result[0].newName).toBe('Screenshot_2024-01-15_at_10.30.00.png')
    })

    it('removes special characters', () => {
      const rules: RenameRule[] = [{ type: 'clean', removeSpaces: false, removeSpecialChars: true, spaceReplacement: '' }]
      const result = applyRules([mockFiles[3]], rules)
      // Periods are removed from base name (special chars removed)
      expect(result[0].newName).toBe('Screenshot 2024-01-15 at 103000.png')
    })
  })

  describe('regex', () => {
    it('replaces pattern with regex', () => {
      const rules: RenameRule[] = [{ type: 'regex', pattern: '\\d{4}', replacement: 'YYYY' }]
      const result = applyRules([mockFiles[0]], rules)
      expect(result[0].newName).toBe('IMG_YYYY.jpg')
    })

    it('handles invalid regex gracefully', () => {
      const rules: RenameRule[] = [{ type: 'regex', pattern: '[invalid', replacement: 'x' }]
      const result = applyRules([mockFiles[0]], rules)
      expect(result[0].newName).toBe('IMG_1234.jpg') // unchanged
    })
  })

  describe('keepNumber', () => {
    it('extracts first number and prepends it', () => {
      const rules: RenameRule[] = [{ type: 'keepNumber', digits: 4, position: 'prefix' }]
      const result = applyRules([mockFiles[0]], rules)
      expect(result[0].newName).toBe('1234IMG_1234.jpg')
    })
  })

  describe('multiple rules in sequence', () => {
    it('applies rules in order: findReplace then numbering', () => {
      const rules: RenameRule[] = [
        { type: 'findReplace', find: 'IMG_', replace: 'photo' },
        { type: 'numbering', start: 1, digits: 2, position: 'suffix' },
      ]
      const result = applyRules(mockFiles.slice(0, 2), rules)
      expect(result[0].newName).toBe('photo123401.jpg')
      expect(result[1].newName).toBe('photo567802.jpg')
    })

    it('applies rules in order: clean then prefix', () => {
      const rules: RenameRule[] = [
        { type: 'clean', removeSpaces: true, removeSpecialChars: true, spaceReplacement: '_' },
        { type: 'prefix', text: 'ss_' },
      ]
      const result = applyRules([mockFiles[3]], rules)
      expect(result[0].newName).toBe('ss_Screenshot_2024-01-15_at_103000.png')
    })
  })

  describe('conflict detection', () => {
    it('marks conflicting paths', () => {
      // Two files that would end up with the same name
      const files: FileWithPath[] = [
        { name: 'a.jpg', path: 'folder/a.jpg' },
        { name: 'b.jpg', path: 'folder/b.jpg' },
      ]
      const rules: RenameRule[] = [{ type: 'findReplace', find: 'a', replace: 'x' }, { type: 'findReplace', find: 'b', replace: 'x' }]
      const result = applyRules(files, rules)
      expect(result[0].conflict).toBe(true)
      expect(result[1].conflict).toBe(true)
    })

    it('no conflict when names are unique', () => {
      const result = applyRules(mockFiles.slice(0, 2), [])
      expect(result[0].conflict).toBe(false)
      expect(result[1].conflict).toBe(false)
    })
  })

  describe('path preservation', () => {
    it('preserves directory structure', () => {
      const files: FileWithPath[] = [
        { name: 'a.jpg', path: 'photos/2024/a.jpg' },
        { name: 'b.jpg', path: 'photos/2024/b.jpg' },
      ]
      const rules: RenameRule[] = [{ type: 'prefix', text: 'img_' }]
      const result = applyRules(files, rules)
      expect(result[0].newPath).toBe('photos/2024/img_a.jpg')
      expect(result[1].newPath).toBe('photos/2024/img_b.jpg')
    })
  })

  describe('numberFolders', () => {
    it('numbers first-level subfolders sequentially', () => {
      const result = applyRules([mockFiles[0]], [])
      expect(result[0].newName).toBe('IMG_1234.jpg')
      expect(result[0].changed).toBe(false)
    })

    it('handles dotfiles', () => {
      const files: FileWithPath[] = [{ name: '.gitignore', path: '.gitignore' }]
      const rules: RenameRule[] = [{ type: 'prefix', text: 'bak_' }]
      const result = applyRules(files, rules)
      expect(result[0].newName).toBe('bak_.gitignore')
    })

    it('handles filenames with multiple dots', () => {
      const files: FileWithPath[] = [{ name: 'archive.tar.gz', path: 'archive.tar.gz' }]
      const rules: RenameRule[] = [{ type: 'prefix', text: 'old_' }]
      const result = applyRules(files, rules)
      expect(result[0].newName).toBe('old_archive.tar.gz')
    })
  })

  describe('numberFolders', () => {
    it('numbers first-level subfolders sequentially', () => {
      const files: FileWithPath[] = [
        { name: '1.jpg', path: 'root/vacation/1.jpg' },
        { name: '2.jpg', path: 'root/vacation/2.jpg' },
        { name: 'doc.pdf', path: 'root/work/doc.pdf' },
        { name: 'note.txt', path: 'root/study/note.txt' },
      ]
      const rules: RenameRule[] = [{ type: 'numberFolders', start: 1, digits: 2 }]
      const result = applyRules(files, rules)
      expect(result[0].newPath).toBe('root/02/1.jpg')
      expect(result[1].newPath).toBe('root/02/2.jpg')
      expect(result[2].newPath).toBe('root/03/doc.pdf')
      expect(result[3].newPath).toBe('root/01/note.txt')
    })

    it('does nothing when files have no subfolder', () => {
      const files: FileWithPath[] = [
        { name: 'a.jpg', path: 'a.jpg' },
      ]
      const rules: RenameRule[] = [{ type: 'numberFolders', start: 1, digits: 2 }]
      const result = applyRules(files, rules)
      expect(result[0].newPath).toBe('a.jpg')
    })
  })

  describe('folderMode', () => {
    it('applies findReplace to first-level subfolder', () => {
      const files: FileWithPath[] = [
        { name: '1.jpg', path: 'root/vacation/1.jpg' },
      ]
      const rules: RenameRule[] = [{ type: 'findReplace', find: 'vacation', replace: 'holiday', folderMode: true }]
      const result = applyRules(files, rules)
      expect(result[0].newPath).toBe('root/holiday/1.jpg')
      expect(result[0].newName).toBe('1.jpg')
    })

    it('applies prefix to first-level subfolder', () => {
      const files: FileWithPath[] = [
        { name: '1.jpg', path: 'root/vacation/1.jpg' },
      ]
      const rules: RenameRule[] = [{ type: 'prefix', text: 'my_', folderMode: true }]
      const result = applyRules(files, rules)
      expect(result[0].newPath).toBe('root/my_vacation/1.jpg')
    })

    it('applies case to first-level subfolder', () => {
      const files: FileWithPath[] = [
        { name: '1.jpg', path: 'root/Vacation/1.jpg' },
      ]
      const rules: RenameRule[] = [{ type: 'case', mode: 'lower', folderMode: true }]
      const result = applyRules(files, rules)
      expect(result[0].newPath).toBe('root/vacation/1.jpg')
    })

    it('applies deleteBefore to first-level subfolder', () => {
      const files: FileWithPath[] = [
        { name: '1.jpg', path: 'root/my_vacation/1.jpg' },
      ]
      const rules: RenameRule[] = [{ type: 'deleteBefore', text: 'vacation', folderMode: true }]
      const result = applyRules(files, rules)
      expect(result[0].newPath).toBe('root/vacation/1.jpg')
    })

    it('applies deleteAfter to first-level subfolder', () => {
      const files: FileWithPath[] = [
        { name: '1.jpg', path: 'root/vacation_2024/1.jpg' },
      ]
      const rules: RenameRule[] = [{ type: 'deleteAfter', text: 'vacation', folderMode: true }]
      const result = applyRules(files, rules)
      expect(result[0].newPath).toBe('root/vacation/1.jpg')
    })

    it('does not affect filenames when folderMode is on', () => {
      const files: FileWithPath[] = [
        { name: 'IMG_001.jpg', path: 'root/vacation/IMG_001.jpg' },
      ]
      const rules: RenameRule[] = [{ type: 'prefix', text: 'new_', folderMode: true }]
      const result = applyRules(files, rules)
      expect(result[0].newName).toBe('IMG_001.jpg')
    })

    it('only affects first-level subfolder not nested ones', () => {
      const files: FileWithPath[] = [
        { name: '1.jpg', path: 'root/vacation/sub/1.jpg' },
      ]
      const rules: RenameRule[] = [{ type: 'prefix', text: 'X', folderMode: true }]
      const result = applyRules(files, rules)
      expect(result[0].newPath).toBe('root/Xvacation/sub/1.jpg')
    })
  })

  describe('folderLevel', () => {
    it('level 0 renames root folder', () => {
      const files: FileWithPath[] = [
        { name: '1.jpg', path: 'root/vacation/1.jpg' },
      ]
      const rules: RenameRule[] = [{ type: 'findReplace', find: 'root', replace: 'base', folderMode: true, folderLevel: 0 }]
      const result = applyRules(files, rules)
      expect(result[0].newPath).toBe('base/vacation/1.jpg')
    })

    it('level 2 renames second-level subfolder', () => {
      const files: FileWithPath[] = [
        { name: '1.jpg', path: 'root/a/b/1.jpg' },
      ]
      const rules: RenameRule[] = [{ type: 'findReplace', find: 'b', replace: 'B', folderMode: true, folderLevel: 2 }]
      const result = applyRules(files, rules)
      expect(result[0].newPath).toBe('root/a/B/1.jpg')
    })

    it('does nothing when level exceeds path depth', () => {
      const files: FileWithPath[] = [
        { name: '1.jpg', path: 'root/a/1.jpg' },
      ]
      const rules: RenameRule[] = [{ type: 'findReplace', find: 'a', replace: 'A', folderMode: true, folderLevel: 3 }]
      const result = applyRules(files, rules)
      expect(result[0].newPath).toBe('root/a/1.jpg')
    })
  })
})