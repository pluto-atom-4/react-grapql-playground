import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormTextarea } from '../FormTextarea';

describe('FormTextarea - Accessibility', () => {
  describe('Label & htmlFor Association', () => {
    it('should have proper label with htmlFor attribute', () => {
      render(
        <FormTextarea
          id="description-textarea"
          label="Description"
        />
      );

      const label = screen.getByText('Description');
      expect(label).toHaveAttribute('for', 'description-textarea');
    });
  });

  describe('Required Field Indicator', () => {
    it('should display required indicator when required prop is true', () => {
      render(
        <FormTextarea
          id="required-textarea"
          label="Required Field"
          required
        />
      );

      const requiredIndicator = screen.getByLabelText('required');
      expect(requiredIndicator).toHaveClass('text-red-600');
    });
  });

  describe('Error State', () => {
    it('should display error message when error exists and touched', () => {
      render(
        <FormTextarea
          id="description-textarea"
          label="Description"
          error="Description is required"
          touched
        />
      );

      const errorMessage = screen.getByText('Description is required');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  describe('Character Count', () => {
    it('should display character count when showCharCount is true', () => {
      render(
        <FormTextarea
          id="description-textarea"
          label="Description"
          showCharCount
          maxLength={500}
          value="Hello"
        />
      );

      const charCount = screen.getByText('5/500');
      expect(charCount).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be focusable with Tab key', async () => {
      const user = userEvent.setup();
      render(
        <FormTextarea
          id="description-textarea"
          label="Description"
        />
      );

      const textarea = screen.getByLabelText('Description');
      await user.tab();
      expect(textarea).toHaveFocus();
    });
  });

  describe('Screen Reader Support', () => {
    it('should announce error message as alert', () => {
      render(
        <FormTextarea
          id="description-textarea"
          label="Description"
          error="Error"
          touched
        />
      );

      const errorDiv = screen.getByRole('alert');
      expect(errorDiv).toBeInTheDocument();
    });
  });
});
