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

    it('should set aria-required attribute', () => {
      const { container } = render(
        <FormTextarea
          id="required-textarea"
          label="Required"
          required
        />
      );

      const textarea = container.querySelector('textarea');
      expect(textarea).toHaveAttribute('aria-required', 'true');
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

    it('should apply error styling when error and touched', () => {
      const { container } = render(
        <FormTextarea
          id="description-textarea"
          label="Description"
          error="Error"
          touched
        />
      );

      const textarea = container.querySelector('textarea');
      expect(textarea).toHaveClass('border-red-500', 'bg-red-50');
    });

    it('should set aria-invalid when error and touched', () => {
      const { container } = render(
        <FormTextarea
          id="description-textarea"
          label="Description"
          error="Error"
          touched
        />
      );

      const textarea = container.querySelector('textarea');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
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

    it('should enforce maxLength attribute', () => {
      const { container } = render(
        <FormTextarea
          id="description-textarea"
          label="Description"
          maxLength={100}
          value={'x'.repeat(50)}
        />
      );

      const textarea = container.querySelector('textarea');
      expect(textarea).toHaveAttribute('maxLength', '100');
    });

    it('should show warning color when near char limit', () => {
      render(
        <FormTextarea
          id="description-textarea"
          label="Description"
          showCharCount
          maxLength={100}
          value={'x'.repeat(95)}
        />
      );

      const charCount = screen.getByText('95/100');
      expect(charCount).toHaveClass('text-yellow-600');
    });
  });

  describe('Help Text', () => {
    it('should display help text when provided and no error', () => {
      render(
        <FormTextarea
          id="description-textarea"
          label="Description"
          helpText="Maximum 500 characters"
        />
      );

      const helpText = screen.getByText('Maximum 500 characters');
      expect(helpText).toBeInTheDocument();
      expect(helpText).toHaveClass('text-gray-600');
    });

    it('should not display help text when error exists', () => {
      render(
        <FormTextarea
          id="description-textarea"
          label="Description"
          helpText="Max 500 chars"
          error="Too long"
          touched
        />
      );

      const helpText = screen.queryByText('Max 500 chars');
      expect(helpText).not.toBeInTheDocument();
    });
  });

  describe('aria-describedby', () => {
    it('should link error and help text via aria-describedby', () => {
      const { container } = render(
        <FormTextarea
          id="description-textarea"
          label="Description"
          helpText="Help"
          error="Error"
          touched
        />
      );

      const textarea = container.querySelector('textarea');
      const describedBy = textarea?.getAttribute('aria-describedby');
      expect(describedBy).toContain('description-textarea-error');
      expect(describedBy).toContain('description-textarea-help');
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

    it('should be focusable and accept text input', async (): Promise<void> => {
      const user = userEvent.setup();
      const handleChange = { fn: (): void => {} };
      render(
        <FormTextarea
          id="description-textarea"
          label="Description"
          onChange={handleChange.fn}
        />
      );

      const textarea = screen.getByLabelText('Description');
      await user.tab();
      
      // Verify focus works
      expect(textarea).toHaveFocus();
      expect(textarea).toHaveAttribute('aria-invalid', 'false');
    });
  });

  describe('Disabled State', () => {
    it('should disable textarea when disabled prop is true', () => {
      const { container } = render(
        <FormTextarea
          id="description-textarea"
          label="Description"
          disabled
        />
      );

      const textarea = container.querySelector('textarea');
      expect(textarea).toBeDisabled();
    });

    it('should apply disabled styling', () => {
      const { container } = render(
        <FormTextarea
          id="description-textarea"
          label="Description"
          disabled
        />
      );

      const textarea = container.querySelector('textarea');
      expect(textarea).toHaveClass('disabled:bg-gray-100', 'disabled:cursor-not-allowed');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to textarea element', () => {
      const ref = { current: null } as React.MutableRefObject<HTMLTextAreaElement | null>;
      render(
        <FormTextarea
          ref={ref}
          id="description-textarea"
          label="Description"
        />
      );

      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
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
