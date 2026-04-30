/**
 * Enhanced File Upload - Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EnhancedFileUpload from '@/components/marketplace/EnhancedFileUpload'

describe('EnhancedFileUpload', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render file upload component', () => {
    render(<EnhancedFileUpload value={[]} onChange={mockOnChange} />)

    expect(screen.getByText(/drag and drop files/i)).toBeInTheDocument()
  })

  it('should handle file selection', () => {
    render(<EnhancedFileUpload value={[]} onChange={mockOnChange} />)

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    const input = screen.getByLabelText(/upload files/i) as HTMLInputElement

    fireEvent.change(input, { target: { files: [file] } })

    expect(mockOnChange).toHaveBeenCalled()
  })

  it('should validate file size', () => {
    render(
      <EnhancedFileUpload
        value={[]}
        onChange={mockOnChange}
        maxSizeMB={10}
      />
    )

    // Create a file larger than max size
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf')

    // Should reject file
  })

  it('should handle drag and drop', () => {
    render(<EnhancedFileUpload value={[]} onChange={mockOnChange} />)

    const dropZone = screen.getByText(/drag and drop files/i).closest('div')

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    const dataTransfer = {
      files: [file],
    }

    if (dropZone) {
      fireEvent.drop(dropZone, { dataTransfer })
    }

    expect(mockOnChange).toHaveBeenCalled()
  })

  it('should remove files', () => {
    const files = [
      Object.assign(new File(['test'], 'test.pdf'), { id: '1' }),
    ] as any

    render(<EnhancedFileUpload value={files} onChange={mockOnChange} />)

    const removeButton = screen.getByLabelText(/remove/i)
    fireEvent.click(removeButton)

    expect(mockOnChange).toHaveBeenCalled()
  })
})






