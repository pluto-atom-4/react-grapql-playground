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
  });

  describe('Error State Styling', () => {
    it('should display error message when error exists and touched', () => {
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
  });
});
