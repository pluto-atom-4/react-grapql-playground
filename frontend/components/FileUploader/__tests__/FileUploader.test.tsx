/**
 * FileUploader component tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
    it('should show error for invalid file type', () => {
      render(<FileUploader config={mockConfig} />);

      const input = screen.getByRole('button').querySelector('input') as HTMLInputElement;
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      fireEvent.change(input, { target: { files: [file] } });

      // Check for error message
      const errorElement = screen.queryByText(/File type.*not allowed/i);
      expect(errorElement).toBeInTheDocument();
    });

    it('should show error for oversized file', () => {
      render(<FileUploader config={mockConfig} />);

      const input = screen.getByRole('button').querySelector('input') as HTMLInputElement;
      const largeContent = new Uint8Array(60 * 1024 * 1024);
      const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });

      fireEvent.change(input, { target: { files: [file] } });

      const errorElement = screen.queryByText(/exceeds.*limit/i);
      expect(errorElement).toBeInTheDocument();
    });

    it('should show error when too many files', () => {
      render(<FileUploader config={mockConfig} />);

      const input = screen.getByRole('button').querySelector('input') as HTMLInputElement;
      const files = Array(10)
        .fill(null)
        .map((_, i) =>
          new File(['content'], `test${i}.pdf`, { type: 'application/pdf' })
        );

      fireEvent.change(input, { target: { files } });

      const errorElement = screen.queryByText(/Maximum.*files allowed/i);
      expect(errorElement).toBeInTheDocument();
    });
  });

  describe('UI States', () => {
    it('should render upload area', () => {
      render(<FileUploader config={mockConfig} />);
      const dropZone = screen.getByRole('button');
      expect(dropZone).toBeInTheDocument();
    });

    it('should have upload icon SVG', () => {
      render(<FileUploader config={mockConfig} />);
      const svg = screen.getByRole('img', { hidden: true });
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Preview', () => {
    it('should not show uploaded files initially', () => {
      render(<FileUploader config={mockConfig} showPreview />);
      expect(screen.queryByText(/uploaded files:/i)).not.toBeInTheDocument();
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

    it('should have disabled state in ARIA when disabled', () => {
      render(<FileUploader config={mockConfig} disabled />);
      const dropZone = screen.getByRole('button');
      expect(dropZone).toHaveAttribute('aria-disabled', 'true');
    });

    it('should have error alert role when error occurs', () => {
      render(<FileUploader config={mockConfig} />);

      const input = screen.getByRole('button').querySelector('input') as HTMLInputElement;
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      fireEvent.change(input, { target: { files: [file] } });

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
