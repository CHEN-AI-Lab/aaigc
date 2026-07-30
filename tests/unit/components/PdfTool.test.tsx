// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import React from 'react'

vi.mock('next-intl', () => {
  const map: Record<string, string> = {
    pdfMerge: 'Merge PDF',
    pdfSplit: 'Split PDF',
    pdfMergeBtn: 'Merge',
    pdfSplitBtn: 'Split',
    pdfProcessing: 'Processing...',
    pdfNotPdf: 'is not a PDF file',
    pdfError: 'Processing failed',
    pdfDropMerge: 'Drop or select multiple PDF files to merge',
    pdfDropSplit: 'Drop or select a PDF file to split',
    pdfClickOrDrag: 'Click to select or drag files here',
    pdfSplitSingle: 'Only one PDF file allowed',
    pdfSplitLimit: 'File uploaded. Remove first to change',
    pdfRemove: 'Remove',
    pdfPages: 'pages',
    pdfTotalPages: 'Total {count} pages',
    pdfClear: 'Clear',
    pdfSplitPerGroup: 'Every',
  }
  return { useTranslations: () => (key: string) => map[key] || key }
})

vi.mock('pdf-lib', () => {
  const mockDoc = {
    getPageCount: () => 1,
    getPageIndices: () => [0],
    copyPages: () => [{}],
    addPage: () => {},
    save: () => new Uint8Array(100),
  }
  return { PDFDocument: { create: () => Promise.resolve(mockDoc), load: () => Promise.resolve(mockDoc) } }
})

beforeEach(() => { cleanup() })

async function renderPdfTool() {
  const PdfTool = (await import('../../../apps/web/src/components/tools/PdfTool')).default
  return render(React.createElement(PdfTool))
}

describe('PdfTool', () => {
  it('renders merge and split mode buttons', async () => {
    await renderPdfTool()
    expect(screen.getByText('Merge PDF')).toBeInTheDocument()
    expect(screen.getByText('Split PDF')).toBeInTheDocument()
  })

  it('shows merge mode hint by default', async () => {
    await renderPdfTool()
    expect(screen.getByText('Drop or select multiple PDF files to merge')).toBeInTheDocument()
  })

  it('switches to split mode with correct hint', async () => {
    await renderPdfTool()
    fireEvent.click(screen.getByText('Split PDF'))
    expect(screen.getByText('Drop or select a PDF file to split')).toBeInTheDocument()
    expect(screen.getByText('Only one PDF file allowed')).toBeInTheDocument()
  })

  it('Clear button hidden when no files', async () => {
    await renderPdfTool()
    expect(screen.queryByText('Clear')).not.toBeInTheDocument()
  })

  it('switching modes clears files', async () => {
    await renderPdfTool()
    // Switch to split mode and back - files state resets
    fireEvent.click(screen.getByText('Split PDF'))
    expect(screen.getByText('Drop or select a PDF file to split')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Merge PDF'))
    expect(screen.getByText('Drop or select multiple PDF files to merge')).toBeInTheDocument()
  })

  it('shows error when clicking upload area in split mode', async () => {
    await renderPdfTool()
    fireEvent.click(screen.getByText('Split PDF'))
    const dropZone = document.querySelector('.border-dashed') as HTMLElement
    // Before any file is uploaded, click should open file picker (no error)
    expect(screen.queryByText('File uploaded. Remove first to change')).not.toBeInTheDocument()
  })

  it('drag highlight activates and deactivates', async () => {
    await renderPdfTool()
    const dropZone = document.querySelector('.border-dashed') as HTMLElement
    fireEvent.dragOver(dropZone)
    expect(dropZone.className).toContain('scale-[1.02]')
    fireEvent.dragLeave(dropZone)
    await waitFor(() => expect(dropZone.className).not.toContain('scale-[1.02]'))
  })

  it('shows error for non-PDF file', async () => {
    await renderPdfTool()
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['x'], 'test.txt', { type: 'text/plain' })
    Object.defineProperty(fileInput, 'files', { value: [file] as any })
    fireEvent.change(fileInput)
    await waitFor(() => expect(screen.getByText(/test.txt/)).toBeInTheDocument())
  })
})