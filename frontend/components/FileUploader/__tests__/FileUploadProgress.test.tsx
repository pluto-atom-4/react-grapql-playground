/**
 * FileUploadProgress component tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FileUploadProgress } from '../FileUploadProgress';

describe('FileUploadProgress Component', () => {
  const mockProgress = {
    loaded: 512000,
    total: 1024000,
    percentage: 50,
  };

  it('should render progress bar', () => {
    render(<FileUploadProgress progress={mockProgress} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('should set progress bar width based on percentage', () => {
    render(<FileUploadProgress progress={mockProgress} />);
    const progressFill = screen.getByRole('progressbar').querySelector('div');
    expect(progressFill).toHaveStyle({ width: '50%' });
  });

  it('should display percentage', () => {
    render(<FileUploadProgress progress={mockProgress} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should display formatted bytes', () => {
    render(<FileUploadProgress progress={mockProgress} />);
    // 512KB / 1MB format
    expect(screen.getByText(/500\.0 KB \/ 1000\.0 KB/)).toBeInTheDocument();
  });

  it('should have correct ARIA attributes', () => {
    render(<FileUploadProgress progress={mockProgress} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('should display test ID', () => {
    render(<FileUploadProgress progress={mockProgress} testId="custom-progress" />);
    expect(screen.getByTestId('custom-progress')).toBeInTheDocument();
  });

  it('should use default test ID when not provided', () => {
    render(<FileUploadProgress progress={mockProgress} />);
    expect(screen.getByTestId('file-upload-progress')).toBeInTheDocument();
  });

  it('should calculate and display upload speed', () => {
    const startTime = Date.now() - 1000; // 1 second ago
    render(<FileUploadProgress progress={mockProgress} startTime={startTime} />);
    // Should show Mbps calculation
    expect(screen.getByText(/Mbps/)).toBeInTheDocument();
  });

  it('should calculate and display ETA', () => {
    const startTime = Date.now() - 1000; // 1 second ago
    render(<FileUploadProgress progress={mockProgress} startTime={startTime} />);
    // Should show ETA
    expect(screen.getByText(/ETA:/)).toBeInTheDocument();
  });

  it('should handle 0% progress', () => {
    render(
      <FileUploadProgress
        progress={{ loaded: 0, total: 1024000, percentage: 0 }}
      />
    );
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should handle 100% progress', () => {
    render(
      <FileUploadProgress
        progress={{ loaded: 1024000, total: 1024000, percentage: 100 }}
      />
    );
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should cap progress bar at 100%', () => {
    render(
      <FileUploadProgress
        progress={{ loaded: 2048000, total: 1024000, percentage: 150 }}
      />
    );
    const progressFill = screen.getByRole('progressbar').querySelector('div');
    expect(progressFill).toHaveStyle({ width: '100%' });
  });

  it('should format large file sizes correctly', () => {
    render(
      <FileUploadProgress
        progress={{
          loaded: 536870912, // 512 MB
          total: 1073741824, // 1 GB
          percentage: 50,
        }}
      />
    );
    expect(screen.getByText(/512\.0 MB \/ 1000\.0 MB/)).toBeInTheDocument();
  });
});
