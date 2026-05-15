import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/Button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
    });

    it('renders with primary variant by default', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button', { name: /primary/i });
      expect(button).toHaveClass('bg-blue-600', 'text-white');
    });

    it('renders with secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button', { name: /secondary/i });
      expect(button).toHaveClass('bg-gray-200', 'text-gray-900');
    });

    it('renders with danger variant', () => {
      render(<Button variant="danger">Delete</Button>);
      const button = screen.getByRole('button', { name: /delete/i });
      expect(button).toHaveClass('bg-red-600', 'text-white');
    });

    it('renders with different sizes', () => {
      const { rerender } = render(<Button size="sm">Small</Button>);
      let button = screen.getByRole('button', { name: /small/i });
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');

      rerender(<Button size="md">Medium</Button>);
      button = screen.getByRole('button', { name: /medium/i });
      expect(button).toHaveClass('px-4', 'py-2', 'text-base');

      rerender(<Button size="lg">Large</Button>);
      button = screen.getByRole('button', { name: /large/i });
      expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
    });
  });

  describe('States', () => {
    it('shows disabled state', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button', { name: /disabled/i });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });

    it('shows loading state', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button', { name: /loading/i });
      expect(button).toBeDisabled();
      // Check for spinner icon
      const spinner = button.querySelector('svg.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('has transition classes for interactions', () => {
      render(<Button>Transition</Button>);
      const button = screen.getByRole('button', { name: /transition/i });
      expect(button).toHaveClass('transition-all', 'duration-200', 'ease-in-out');
    });

    it('has focus ring styles', () => {
      render(<Button>Focus</Button>);
      const button = screen.getByRole('button', { name: /focus/i });
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2');
    });

    it('has hover and active styles', () => {
      render(<Button>Hover Active</Button>);
      const button = screen.getByRole('button', { name: /hover active/i });
      expect(button).toHaveClass('hover:shadow-md', 'active:shadow-sm', 'active:scale-95');
    });
  });

  describe('Interactions', () => {
    it('handles click events', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click</Button>);
      const button = screen.getByRole('button', { name: /click/i });
      
      await userEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not trigger click when disabled', async () => {
      const handleClick = vi.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      const button = screen.getByRole('button', { name: /disabled/i });
      
      await userEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not trigger click when loading', async () => {
      const handleClick = vi.fn();
      render(<Button isLoading onClick={handleClick}>Loading</Button>);
      const button = screen.getByRole('button', { name: /loading/i });
      
      await userEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('can be focused and receive keyboard events', () => {
      render(<Button>Keyboard</Button>);
      const button = screen.getByRole('button', { name: /keyboard/i });
      
      button.focus();
      expect(button).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('has proper button semantics', () => {
      render(<Button>Accessible</Button>);
      const button = screen.getByRole('button', { name: /accessible/i });
      expect(button.tagName).toBe('BUTTON');
    });

    it('is keyboard navigable via Tab', async () => {
      render(
        <>
          <Button>First</Button>
          <Button>Second</Button>
        </>
      );
      
      const firstButton = screen.getByRole('button', { name: /first/i });
      const secondButton = screen.getByRole('button', { name: /second/i });
      
      firstButton.focus();
      expect(firstButton).toHaveFocus();
      
      await userEvent.tab();
      expect(secondButton).toHaveFocus();
    });

    it('supports custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button', { name: /custom/i });
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = vi.fn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      render(<Button ref={ref as any}>Ref Button</Button>);
      expect(ref).toHaveBeenCalled();
      const refValue = ref.mock.results[0]?.value as HTMLButtonElement;
      if (refValue && typeof refValue === 'object') {
        expect(refValue.tagName).toBe('BUTTON');
      }
    });
  });
});
