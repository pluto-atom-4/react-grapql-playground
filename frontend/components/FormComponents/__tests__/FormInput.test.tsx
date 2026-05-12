import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormInput } from '../FormInput';

describe('FormInput - Accessibility', () => {
  describe('Label & htmlFor Association', () => {
    it('should have proper label with htmlFor attribute', () => {
      render(
        <FormInput
          id="email-input"
          label="Email Address"
        />
      );

      const label = screen.getByText('Email Address');
      expect(label).toHaveAttribute('for', 'email-input');
    });

    it('should associate input with label by id', () => {
      const { container } = render(
        <FormInput
          id="test-input"
          label="Test Field"
        />
      );

      const input = container.querySelector('input#test-input');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Required Field Indicator', () => {
    it('should display required indicator when required prop is true', () => {
      render(
        <FormInput
          id="required-field"
          label="Required Field"
          required
        />
      );

      const requiredIndicator = screen.getByLabelText('required');
      expect(requiredIndicator).toHaveClass('text-red-600');
      expect(requiredIndicator).toHaveTextContent('*');
    });

    it('should set aria-required attribute', () => {
      const { container } = render(
        <FormInput
          id="required-input"
          label="Required"
          required
        />
      );

      const input = container.querySelector('input');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('should not display required indicator when not required', () => {
      render(
        <FormInput
          id="optional-field"
          label="Optional Field"
          required={false}
        />
      );

      const requiredIndicator = screen.queryByLabelText('required');
      expect(requiredIndicator).not.toBeInTheDocument();
    });
  });

  describe('Error State Styling', () => {
    it('should display error message with icon when error exists and touched', () => {
      render(
        <FormInput
          id="email-input"
          label="Email"
          error="Invalid email format"
          touched
        />
      );

      const errorMessage = screen.getByText('Invalid email format');
      expect(errorMessage).toBeInTheDocument();
    });

    it('should apply red border when error and touched', () => {
      const { container } = render(
        <FormInput
          id="email-input"
          label="Email"
          error="Invalid email"
          touched
        />
      );

      const input = container.querySelector('input');
      expect(input).toHaveClass('border-red-500', 'bg-red-50');
    });

    it('should not display error when not touched', () => {
      render(
        <FormInput
          id="email-input"
          label="Email"
          error="Invalid email"
          touched={false}
        />
      );

      const errorMessage = screen.queryByText('Invalid email');
      expect(errorMessage).not.toBeInTheDocument();
    });

    it('should set aria-invalid when error and touched', () => {
      const { container } = render(
        <FormInput
          id="email-input"
          label="Email"
          error="Invalid"
          touched
        />
      );

      const input = container.querySelector('input');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should set aria-invalid to false when no error', () => {
      const { container } = render(
        <FormInput
          id="email-input"
          label="Email"
          touched
        />
      );

      const input = container.querySelector('input');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });
  });

  describe('Help Text', () => {
    it('should display help text when provided and no error', () => {
      render(
        <FormInput
          id="password-input"
          label="Password"
          helpText="Minimum 8 characters"
        />
      );

      const helpText = screen.getByText('Minimum 8 characters');
      expect(helpText).toBeInTheDocument();
      expect(helpText).toHaveClass('text-gray-600');
    });

    it('should not display help text when error exists', () => {
      render(
        <FormInput
          id="password-input"
          label="Password"
          helpText="Minimum 8 characters"
          error="Password too short"
          touched
        />
      );

      const helpText = screen.queryByText('Minimum 8 characters');
      expect(helpText).not.toBeInTheDocument();
    });

    it('should include help text in aria-describedby', () => {
      const { container } = render(
        <FormInput
          id="password-input"
          label="Password"
          helpText="Min 8 chars"
        />
      );

      const input = container.querySelector('input');
      const describedBy = input?.getAttribute('aria-describedby');
      expect(describedBy).toContain('password-input-help');
    });
  });

  describe('aria-describedby', () => {
    it('should link error message via aria-describedby', () => {
      const { container } = render(
        <FormInput
          id="email-input"
          label="Email"
          error="Invalid email"
          touched
        />
      );

      const input = container.querySelector('input');
      const describedBy = input?.getAttribute('aria-describedby');
      expect(describedBy).toContain('email-input-error');
    });

    it('should include multiple aria-describedby values', () => {
      const { container } = render(
        <FormInput
          id="email-input"
          label="Email"
          helpText="Enter valid email"
          error="Invalid"
          touched
        />
      );

      const input = container.querySelector('input');
      const describedBy = input?.getAttribute('aria-describedby');
      expect(describedBy).toContain('email-input-error');
      expect(describedBy).toContain('email-input-help');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be focusable with Tab key', async () => {
      const user = userEvent.setup();
      render(
        <FormInput
          id="email-input"
          label="Email"
        />
      );

      const input = screen.getByLabelText('Email');
      await user.tab();
      expect(input).toHaveFocus();
    });

    it('should show focus ring when focused', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <FormInput
          id="email-input"
          label="Email"
        />
      );

      const input = container.querySelector('input');
      await user.tab();
      
      expect(input).toHaveFocus();
      expect(input).toHaveClass('focus:ring-2');
    });

    it('should accept input when focused', async () => {
      const user = userEvent.setup();
      render(
        <FormInput
          id="email-input"
          label="Email"
        />
      );

      const input = screen.getByLabelText('Email');
      await user.tab();
      await user.keyboard('test@example.com');

      expect(input).toHaveValue('test@example.com');
    });
  });

  describe('Disabled State', () => {
    it('should disable input when disabled prop is true', () => {
      const { container } = render(
        <FormInput
          id="email-input"
          label="Email"
          disabled
        />
      );

      const input = container.querySelector('input');
      expect(input).toBeDisabled();
    });

    it('should apply disabled styling', () => {
      const { container } = render(
        <FormInput
          id="email-input"
          label="Email"
          disabled
        />
      );

      const input = container.querySelector('input');
      expect(input).toHaveClass('disabled:bg-gray-100', 'disabled:cursor-not-allowed');
    });

    it('should apply disabled label styling', () => {
      render(
        <FormInput
          id="email-input"
          label="Email"
          disabled
        />
      );

      const label = screen.getByText('Email');
      expect(label).toHaveClass('text-gray-400');
    });
  });

  describe('Screen Reader Support', () => {
    it('should announce error message as alert', () => {
      render(
        <FormInput
          id="email-input"
          label="Email"
          error="Invalid email"
          touched
        />
      );

      const errorDiv = screen.getByRole('alert');
      expect(errorDiv).toBeInTheDocument();
    });

    it('should have proper role attributes', () => {
      render(
        <FormInput
          id="email-input"
          label="Email"
          error="Invalid"
          touched
        />
      );

      const errorDiv = screen.getByRole('alert');
      expect(errorDiv).toHaveAttribute('role', 'alert');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to input element', () => {
      const ref = { current: null } as React.MutableRefObject<HTMLInputElement | null>;
      render(
        <FormInput
          ref={ref}
          id="email-input"
          label="Email"
        />
      );

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });
});
