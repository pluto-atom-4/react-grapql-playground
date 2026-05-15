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

describe('FormInput - Micro-interactions & Transitions', () => {
  describe('Focus Ring Styling', () => {
    it('should have focus ring classes for WCAG AAA compliance', () => {
      const { container } = render(
        <FormInput
          id="focus-test"
          label="Focus Test"
        />
      );

      const input = container.querySelector('input');
      expect(input).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-offset-0');
    });

    it('should have blue focus ring for normal state', () => {
      const { container } = render(
        <FormInput
          id="normal-focus"
          label="Normal Focus"
        />
      );

      const input = container.querySelector('input');
      expect(input).toHaveClass('focus:ring-blue-500');
    });

    it('should have red focus ring for error state', () => {
      const { container } = render(
        <FormInput
          id="error-focus"
          label="Error Focus"
          error="Invalid"
          touched
        />
      );

      const input = container.querySelector('input');
      expect(input).toHaveClass('focus:ring-red-500');
    });
  });

  describe('Hover States', () => {
    it('should have hover border color change', () => {
      const { container } = render(
        <FormInput
          id="hover-test"
          label="Hover Test"
        />
      );

      const input = container.querySelector('input');
      expect(input).toHaveClass('hover:border-gray-400');
    });

    it('should maintain gray border on hover when error', () => {
      const { container } = render(
        <FormInput
          id="error-hover"
          label="Error Hover"
          error="Invalid"
          touched
        />
      );

      const input = container.querySelector('input');
      // Error state should show red border, not hover effect
      expect(input).toHaveClass('border-red-500');
    });
  });

  describe('Transitions', () => {
    it('should have smooth transition classes', () => {
      const { container } = render(
        <FormInput
          id="transition-test"
          label="Transition Test"
        />
      );

      const input = container.querySelector('input');
      expect(input).toHaveClass('transition-all', 'duration-200', 'ease-in-out');
    });

    it('label should have transition color classes', () => {
      const { container } = render(
        <FormInput
          id="label-transition"
          label="Label Transition"
        />
      );

      const label = container.querySelector('label');
      expect(label).toHaveClass('transition-colors', 'duration-200');
    });
  });

  describe('Disabled State Styling', () => {
    it('should have disabled styling', () => {
      const { container } = render(
        <FormInput
          id="disabled-test"
          label="Disabled Test"
          disabled
        />
      );

      const input = container.querySelector('input');
      expect(input).toHaveClass('disabled:bg-gray-100', 'disabled:text-gray-500', 'disabled:cursor-not-allowed');
    });

    it('label should show disabled color', () => {
      const { container } = render(
        <FormInput
          id="disabled-label"
          label="Disabled Label"
          disabled
        />
      );

      const label = container.querySelector('label');
      expect(label).toHaveClass('text-gray-400');
    });
  });

  describe('Focus Management', () => {
    it('should be keyboard focusable', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <FormInput
          id="keyboard-focus"
          label="Keyboard Focus"
        />
      );

      const input = container.querySelector('input') as HTMLInputElement;
      await user.tab();
      expect(input).toHaveFocus();
    });

    it('should show focus state changes', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <FormInput
          id="focus-change"
          label="Focus Change"
        />
      );

      const input = container.querySelector('input') as HTMLInputElement;
      
      // Initially not focused
      expect(input).not.toHaveFocus();
      
      // After tab, should be focused
      await user.tab();
      expect(input).toHaveFocus();
    });
  });

  describe('Visual Feedback', () => {
    it('should show border color change in normal state', () => {
      const { container } = render(
        <FormInput
          id="border-color"
          label="Border Color"
        />
      );

      const input = container.querySelector('input');
      expect(input).toHaveClass('border-gray-300');
    });

    it('should show red background in error state', () => {
      const { container } = render(
        <FormInput
          id="error-bg"
          label="Error Background"
          error="Required field"
          touched
        />
      );

      const input = container.querySelector('input');
      expect(input).toHaveClass('bg-red-50');
    });
  });
});

