// Type declarations for File System Access API (Chrome/Edge)
// https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API

interface FileSystemHandle {
  kind: 'file' | 'directory'
  name: string
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
  values(): AsyncIterableIterator<FileSystemHandle>
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>
}

interface FileSystemFileHandle extends FileSystemHandle {
  getFile(): Promise<File>
  createWritable(): Promise<FileSystemWritableFileStream>
  getParent?(): Promise<FileSystemDirectoryHandle>
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: BufferSource | Blob | string): Promise<void>
  close(): Promise<void>
}

interface Window {
  showDirectoryPicker?(): Promise<FileSystemDirectoryHandle>
  showSaveFilePicker?(options?: unknown): Promise<FileSystemFileHandle>
}

interface File {
  webkitRelativePath?: string
}
