/**
 * FileUploader component tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUploader } from '../FileUploader';

describe('FileUploader Component', () => {
  const mockConfig = {
    acceptedTypes: ['application/pdf', 'image/jpeg'],
    maxSizeMB: 50,
    maxFiles: 5,
    onSuccess: vi.fn(),
    onError: vi.fn(),
    onProgress: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render upload area with label', () => {
      render(<FileUploader config={mockConfig} label="Upload Report" />);
      expect(screen.getByText('Upload Report')).toBeInTheDocument();
    });

    it('should render with default label', () => {
      render(<FileUploader config={mockConfig} />);
      expect(screen.getByText('Upload File')).toBeInTheDocument();
    });

    it('should have drag-drop text', () => {
      render(<FileUploader config={mockConfig} />);
      expect(screen.getByText(/Drag and drop or click/i)).toBeInTheDocument();
    });

    it('should render file input', () => {
      render(<FileUploader config={mockConfig} />);
      const input = screen.getByRole('button', { name: 'Upload File' }).querySelector('input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'file');
    });

    it('should disable component when disabled prop is true', () => {
      render(<FileUploader config={mockConfig} disabled />);
      const input = screen.getByRole('button').querySelector('input');
      expect(input).toBeDisabled();
    });

    it('should have test ID', () => {
      render(<FileUploader config={mockConfig} testId="custom-uploader" />);
      expect(screen.getByTestId('custom-uploader')).toBeInTheDocument();
    });
  });

  describe('File Validation', () => {
    it('should show error for invalid file type', async () => {
      render(<FileUploader config={mockConfig} />);
      
      const input = screen.getByRole('button').querySelector('input') as HTMLInputElement;
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/File type.*not allowed/i)).toBeInTheDocument();
      });

      expect(mockConfig.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'INVALID_TYPE',
        })
      );
    });

    it('should show error for oversized file', async () => {
      const largeContent = new Uint8Array(60 * 1024 * 1024);
      render(<FileUploader config={mockConfig} />);
      
      const input = screen.getByRole('button').querySelector('input') as HTMLInputElement;
      const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
      
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/exceeds.*limit/i)).toBeInTheDocument();
      });

      expect(mockConfig.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'FILE_TOO_LARGE',
        })
      );
    });

    it('should show error when too many files', async () => {
      render(<FileUploader config={mockConfig} />);
      
      const input = screen.getByRole('button').querySelector('input') as HTMLInputElement;
      const files = Array(10)
        .fill(null)
        .map((_, i) =>
          new File(['content'], `test${i}.pdf`, { type: 'application/pdf' })
        );
      
      fireEvent.change(input, { target: { files } });

      await waitFor(() => {
        expect(screen.getByText(/Maximum.*files allowed/i)).toBeInTheDocument();
      });

      expect(mockConfig.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'TOO_MANY_FILES',
        })
      );
    });
  });

  describe('UI States', () => {
    it('should show error message in error state', async () => {
      const { rerender } = render(<FileUploader config={mockConfig} />);
      
      const input = screen.getByRole('button').querySelector('input') as HTMLInputElement;
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('should have drag-active styling when dragging', async () => {
      render(<FileUploader config={mockConfig} />);
      
      const dropZone = screen.getByRole('button');
      
      fireEvent.dragEnter(dropZone);
      
      await waitFor(() => {
        expect(dropZone).toHaveClass('border-blue-500');
        expect(dropZone).toHaveClass('bg-blue-50');
      });
    });

    it('should remove drag-active styling when leaving', async () => {
      render(<FileUploader config={mockConfig} />);
      
      const dropZone = screen.getByRole('button');
      
      fireEvent.dragEnter(dropZone);
      fireEvent.dragLeave(dropZone);
      
      await waitFor(() => {
        expect(dropZone).not.toHaveClass('border-blue-500');
      });
    });
  });

  describe('Preview', () => {
    it('should show preview by default', () => {
      render(<FileUploader config={mockConfig} showPreview />);
      expect(screen.getByText(/uploaded files:/i)).toBeInTheDocument();
    });

    it('should hide preview when showPreview is false', () => {
      render(<FileUploader config={mockConfig} showPreview={false} />);
      expect(screen.queryByText(/uploaded files:/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have ARIA label', () => {
      render(<FileUploader config={mockConfig} label="Test Upload" />);
      const input = screen.getByRole('button', { name: 'Test Upload' });
      expect(input).toBeInTheDocument();
    });

    it('should have role button on drop zone', () => {
      render(<FileUploader config={mockConfig} />);
      const dropZone = screen.getByRole('button');
      expect(dropZone).toHaveAttribute('role', 'button');
    });

    it('should have disabled state in ARIA', () => {
      render(<FileUploader config={mockConfig} disabled />);
      const dropZone = screen.getByRole('button');
      expect(dropZone).toHaveAttribute('aria-disabled', 'true');
    });

    it('should have error alert role', async () => {
      render(<FileUploader config={mockConfig} />);
      
      const input = screen.getByRole('button').querySelector('input') as HTMLInputElement;
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('Integration', () => {
    it('should accept valid file and show success message', async () => {
      // Mock the upload endpoint
      global.XMLHttpRequest = vi.fn(() => ({
        upload: { addEventListener: vi.fn() },
        open: vi.fn(),
        send: vi.fn(function () {
          this.status = 200;
          this.responseText = JSON.stringify({
            fileId: 'test-123',
            fileName: 'test.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
            fileUrl: '/files/test-123',
            uploadedAt: new Date().toISOString(),
          });
          this.onload?.();
        }),
        addEventListener: vi.fn(),
        abort: vi.fn(),
      })) as any;

      render(<FileUploader config={mockConfig} />);
      
      const input = screen.getByRole('button').querySelector('input') as HTMLInputElement;
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/upload successful/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });
});
