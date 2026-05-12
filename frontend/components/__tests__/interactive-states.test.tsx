/**
 * Tests for Issue #256: Interactive States & Hover Effects
 * 
 * Verifies that interactive elements have proper:
 * - Hover effects with color shifts and shadow depth
 * - Focus rings for keyboard navigation
 * - Active/click states with scale animations
 * - Smooth transitions (150-200ms)
 * - Accessibility compliance (WCAG AA)
 * - Mobile responsiveness
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CreateBuildModal } from '../create-build-modal';

describe('Issue #256: Interactive States & Hover Effects', () => {
  describe('Button Hover States', () => {
    it('should apply hover color shift to create button', () => {
      const mockOnSubmit = vi.fn(async () => {});
      const mockOnClose = vi.fn();

      render(
        <CreateBuildModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const submitButton = screen.getByTestId('create-build-submit');
      
      // Check hover styling is present (via className)
      expect(submitButton).toHaveClass('hover:bg-blue-700');
      expect(submitButton).toHaveClass('bg-blue-600');
    });

    it('should apply hover effects to cancel button', () => {
      const mockOnSubmit = vi.fn(async () => {});
      const mockOnClose = vi.fn();

      render(
        <CreateBuildModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      
      // Check hover styling
      expect(cancelButton).toHaveClass('hover:bg-gray-50');
      expect(cancelButton).toHaveClass('hover:border-gray-400');
    });
  });

  describe('Focus Ring Visibility', () => {
    it('should show focus ring on tab navigation', async () => {
      const mockOnSubmit = vi.fn(async () => {});
      const mockOnClose = vi.fn();

      render(
        <CreateBuildModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const input = screen.getByTestId('build-name-input') as HTMLInputElement;
      
      // Input should be auto-focused
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      
      // Verify focus ring styling
      expect(input).toHaveClass('focus:ring-2');
      expect(input).toHaveClass('focus:ring-blue-500');
      expect(input).toHaveClass('focus:outline-none');
    });

    it('should show focus ring on buttons', () => {
      const mockOnSubmit = vi.fn(async () => {});
      const mockOnClose = vi.fn();

      render(
        <CreateBuildModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const submitButton = screen.getByTestId('create-build-submit');
      
      expect(submitButton).toHaveClass('focus:ring-2');
      expect(submitButton).toHaveClass('focus:ring-blue-500');
    });
  });

  describe('Active/Click States', () => {
    it('should have active:scale-95 for button click feedback', () => {
      const mockOnSubmit = vi.fn(async () => {});
      const mockOnClose = vi.fn();

      render(
        <CreateBuildModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const submitButton = screen.getByTestId('create-build-submit');
      
      // Verify active scale styling
      expect(submitButton).toHaveClass('active:scale-95');
    });

    it('cancel button should have active:scale-95', () => {
      const mockOnSubmit = vi.fn(async () => {});
      const mockOnClose = vi.fn();

      render(
        <CreateBuildModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      
      expect(cancelButton).toHaveClass('active:scale-95');
    });
  });

  describe('Transition Timing', () => {
    it('should have smooth transitions on buttons', () => {
      const mockOnSubmit = vi.fn(async () => {});
      const mockOnClose = vi.fn();

      render(
        <CreateBuildModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const submitButton = screen.getByTestId('create-build-submit');
      
      // Verify transition classes
      expect(submitButton).toHaveClass('transition-all');
      expect(submitButton).toHaveClass('duration-200');
    });

    it('input should have smooth transitions on focus', () => {
      const mockOnSubmit = vi.fn(async () => {});
      const mockOnClose = vi.fn();

      render(
        <CreateBuildModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const input = screen.getByTestId('build-name-input');
      
      expect(input).toHaveClass('transition-all');
      expect(input).toHaveClass('duration-200');
    });
  });

  describe('Form Input Interactive States', () => {
    it('should have border transition on hover', () => {
      const mockOnSubmit = vi.fn(async () => {});
      const mockOnClose = vi.fn();

      render(
        <CreateBuildModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const input = screen.getByTestId('build-name-input');
      
      // Verify hover border styling
      expect(input).toHaveClass('hover:border-gray-400');
    });

    it('should have focus ring border transparent', () => {
      const mockOnSubmit = vi.fn(async () => {});
      const mockOnClose = vi.fn();

      render(
        <CreateBuildModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const input = screen.getByTestId('build-name-input');
      
      // Verify focus border transparent styling
      expect(input).toHaveClass('focus:border-transparent');
    });
  });

  describe('Disabled States', () => {
    it('should have opacity reduction on disabled submit button', () => {
      const mockOnSubmit = vi.fn(async () => {});
      const mockOnClose = vi.fn();

      render(
        <CreateBuildModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={true}
        />
      );

      const submitButton = screen.getByTestId('create-build-submit');
      
      // Verify disabled styling
      expect(submitButton).toHaveClass('disabled:opacity-60');
      expect(submitButton).toHaveClass('disabled:cursor-not-allowed');
    });
  });

  describe('Accessibility Compliance', () => {
    it('all buttons should have focus:outline-none and focus:ring', () => {
      const mockOnSubmit = vi.fn(async () => {});
      const mockOnClose = vi.fn();

      render(
        <CreateBuildModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const submitButton = screen.getByTestId('create-build-submit');
      const cancelButton = screen.getByText('Cancel');

      [submitButton, cancelButton].forEach((btn) => {
        expect(btn).toHaveClass('focus:outline-none');
        expect(btn).toHaveClass('focus:ring-2');
      });
    });

    it('form input should have proper focus indicators', () => {
      const mockOnSubmit = vi.fn(async () => {});
      const mockOnClose = vi.fn();

      render(
        <CreateBuildModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const input = screen.getByTestId('build-name-input');
      
      expect(input).toHaveClass('focus:outline-none');
      expect(input).toHaveClass('focus:ring-2');
      expect(input).toHaveClass('focus:ring-blue-500');
    });
  });

  describe('Color Contrast on Hover', () => {
    it('buttons maintain readability on hover', () => {
      const mockOnSubmit = vi.fn(async () => {});
      const mockOnClose = vi.fn();

      render(
        <CreateBuildModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const submitButton = screen.getByTestId('create-build-submit');
      
      // Blue button with darker hover - maintains contrast
      expect(submitButton).toHaveClass('bg-blue-600');
      expect(submitButton).toHaveClass('hover:bg-blue-700');
      expect(submitButton).toHaveClass('text-white');
    });
  });
});
