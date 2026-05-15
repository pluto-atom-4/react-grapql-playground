import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/Button';
import { FormInput } from '@/components/FormComponents/FormInput';
import { Tabs } from '@/components/Tabs';

describe('Interactive States - Integration Tests', () => {
  describe('Focus Ring Consistency Across Components', () => {
    it('Button has focus ring on Tab', async () => {
      const user = userEvent.setup();
      const { container: _container } = render(<Button>Focus Button</Button>);
      
      const button = screen.getByRole('button', { name: /focus button/i });
      
      // Tab to the button
      await user.tab();
      
      // Button should have focus
      expect(button).toHaveFocus();
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2');
    });

    it('FormInput has focus ring on Tab', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <FormInput id="test-input" label="Test Input" />
      );
      
      const input = container.querySelector('input') as HTMLInputElement;
      
      // Tab to the input
      await user.tab();
      
      // Input should have focus
      expect(input).toHaveFocus();
      expect(input).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-offset-0');
    });

    it('Tab component buttons have focus ring', async () => {
      const user = userEvent.setup();
      render(
        <Tabs
          tabs={[
            { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
            { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div> },
          ]}
        />
      );
      
      const tab1Button = screen.getByRole('tab', { name: /tab 1/i });
      
      // Tab to the first tab button
      await user.tab();
      
      // Should be focused
      expect(tab1Button).toHaveFocus();
      expect(tab1Button).toHaveClass('focus:outline-none', 'focus:ring-2');
    });
  });

  describe('Hover State Consistency', () => {
    it('Button shows hover state styling', () => {
      const { container } = render(<Button variant="primary">Hover Button</Button>);
      
      const button = container.querySelector('button');
      expect(button).toHaveClass('hover:shadow-md', 'active:scale-95');
    });

    it('FormInput shows hover border change', () => {
      const { container } = render(
        <FormInput id="hover-input" label="Hover Input" />
      );
      
      const input = container.querySelector('input');
      expect(input).toHaveClass('hover:border-gray-400');
    });
  });

  describe('Transition Animation Consistency', () => {
    it('Button has 200ms transitions', () => {
      const { container } = render(<Button>Transition Button</Button>);
      
      const button = container.querySelector('button');
      expect(button).toHaveClass('transition-all', 'duration-200', 'ease-in-out');
    });

    it('FormInput has 200ms transitions', () => {
      const { container } = render(
        <FormInput id="transition-input" label="Transition Input" />
      );
      
      const input = container.querySelector('input');
      expect(input).toHaveClass('transition-all', 'duration-200', 'ease-in-out');
    });

    it('FormInput label has 200ms color transitions', () => {
      const { container } = render(
        <FormInput id="label-transition" label="Label Transition" />
      );
      
      const label = container.querySelector('label');
      expect(label).toHaveClass('transition-colors', 'duration-200');
    });

    it('Tab panels have 200ms opacity transitions', () => {
      const { container } = render(
        <Tabs
          tabs={[
            { id: 'panel1', label: 'Panel 1', content: <div>Content 1</div> },
            { id: 'panel2', label: 'Panel 2', content: <div>Content 2</div> },
          ]}
        />
      );
      
      const tabPanel = container.querySelector('[role="tabpanel"]');
      expect(tabPanel).toHaveClass('transition-all', 'duration-200', 'ease-in-out');
    });
  });

  describe('Keyboard Navigation Flow', () => {
    it('can tab through multiple interactive elements', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <>
          <Button>Button 1</Button>
          <FormInput id="input1" label="Input 1" />
          <Button>Button 2</Button>
        </>
      );
      
      const button1 = screen.getByRole('button', { name: /button 1/i });
      const input1 = container.querySelector('input') as HTMLInputElement;
      const button2 = screen.getByRole('button', { name: /button 2/i });
      
      // Tab through all elements
      await user.tab();
      expect(button1).toHaveFocus();
      
      await user.tab();
      expect(input1).toHaveFocus();
      
      await user.tab();
      expect(button2).toHaveFocus();
    });

    it('maintains focus visibility during keyboard navigation', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <>
          <Button>Focus Test</Button>
          <FormInput id="focus-test" label="Focus Test" />
        </>
      );
      
      const button = screen.getByRole('button', { name: /focus test/i });
      const input = container.querySelector('input') as HTMLInputElement;
      
      // Tab to button
      await user.tab();
      expect(button).toHaveFocus();
      
      // Tab to input
      await user.tab();
      expect(input).toHaveFocus();
      
      // Both should have focus ring classes
      expect(button).toHaveClass('focus:ring-2');
      expect(input).toHaveClass('focus:ring-2');
    });
  });

  describe('Error State Styling', () => {
    it('FormInput error state has red focus ring', () => {
      const { container } = render(
        <FormInput
          id="error-input"
          label="Error Input"
          error="Invalid value"
          touched
        />
      );
      
      const input = container.querySelector('input');
      expect(input).toHaveClass('focus:ring-red-500', 'border-red-500');
    });

    it('FormInput normal state has blue focus ring', () => {
      const { container } = render(
        <FormInput id="normal-input" label="Normal Input" />
      );
      
      const input = container.querySelector('input');
      expect(input).toHaveClass('focus:ring-blue-500');
    });
  });

  describe('Disabled State Consistency', () => {
    it('disabled Button has disabled styling', () => {
      const { container } = render(<Button disabled>Disabled Button</Button>);
      
      const button = container.querySelector('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });

    it('disabled FormInput has disabled styling', () => {
      const { container } = render(
        <FormInput id="disabled-input" label="Disabled Input" disabled />
      );
      
      const input = container.querySelector('input');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('disabled:bg-gray-100', 'disabled:cursor-not-allowed');
    });
  });

  describe('Loading State Behavior', () => {
    it('Button shows loading state with spinner', () => {
      const { container } = render(<Button isLoading>Loading</Button>);
      
      const button = container.querySelector('button');
      const spinner = button?.querySelector('svg.animate-spin');
      
      expect(button).toBeDisabled();
      expect(spinner).toBeInTheDocument();
    });

    it('Button maintains hover classes while loading', () => {
      const { container } = render(<Button isLoading>Loading</Button>);
      
      const button = container.querySelector('button');
      expect(button).toHaveClass('hover:shadow-md');
    });
  });

  describe('Visual Feedback Timing', () => {
    it('all interactive elements use 200ms transition duration', () => {
      const { container } = render(
        <>
          <Button>Timing Button</Button>
          <FormInput id="timing-input" label="Timing Input" />
        </>
      );
      
      const button = container.querySelector('button');
      const input = container.querySelector('input');
      
      // All should have duration-200
      expect(button).toHaveClass('duration-200');
      expect(input).toHaveClass('duration-200');
    });

    it('all interactive elements use smooth easing', () => {
      const { container } = render(
        <>
          <Button>Easing Button</Button>
          <FormInput id="easing-input" label="Easing Input" />
        </>
      );
      
      const button = container.querySelector('button');
      const input = container.querySelector('input');
      
      // Button should have ease-in-out
      expect(button).toHaveClass('ease-in-out');
      // Input should have ease-in-out
      expect(input).toHaveClass('ease-in-out');
    });
  });

  describe('Accessibility with Micro-interactions', () => {
    it('screen reader can identify focused elements with focus rings', async () => {
      const user = userEvent.setup();
      const { container: _container } = render(
        <Button aria-label="Accessible button">Action</Button>
      );
      
      const button = screen.getByLabelText('Accessible button');
      
      // Tab to focus
      await user.tab();
      expect(button).toHaveFocus();
      
      // Button should have focus ring class
      expect(button).toHaveClass('focus:ring-2');
    });

    it('all interactive elements maintain ARIA attributes with focus states', () => {
      const { container } = render(
        <FormInput
          id="aria-test"
          label="ARIA Test"
          required
          error="Required field"
          touched
        />
      );
      
      const input = container.querySelector('input') as HTMLInputElement;
      
      // Should maintain ARIA attributes despite error state
      expect(input).toHaveAttribute('aria-required', 'true');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      // Should also have focus ring
      expect(input).toHaveClass('focus:ring-2');
    });
  });
});
