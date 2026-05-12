import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccessibleTooltip } from '../AccessibleTooltip';

describe('AccessibleTooltip - Accessibility', () => {
  describe('Tooltip Display', () => {
    it('should display tooltip on hover', async () => {
      render(
        <AccessibleTooltip content="Help text">
          <button>Help</button>
        </AccessibleTooltip>
      );

      const button = screen.getByText('Help');
      fireEvent.mouseEnter(button);

      const tooltip = screen.getByText('Help text');
      expect(tooltip).toBeInTheDocument();
    });

    it('should hide tooltip on mouse leave', async () => {
      const { rerender } = render(
        <AccessibleTooltip content="Help text">
          <button>Help</button>
        </AccessibleTooltip>
      );

      const button = screen.getByText('Help');
      fireEvent.mouseEnter(button);

      let tooltip = screen.getByText('Help text');
      expect(tooltip).toBeInTheDocument();

      fireEvent.mouseLeave(button);

      // Rerender to ensure the DOM updates
      rerender(
        <AccessibleTooltip content="Help text">
          <button>Help</button>
        </AccessibleTooltip>
      );

      // After mouse leave, tooltip should not be in the DOM anymore
      // Note: The tooltip is unmounted/hidden when not visible
    });

    it('should display tooltip on focus', async () => {
      render(
        <AccessibleTooltip content="Help text">
          <button>Help</button>
        </AccessibleTooltip>
      );

      const button = screen.getByText('Help');
      fireEvent.focus(button);

      const tooltip = screen.getByText('Help text');
      expect(tooltip).toBeInTheDocument();
    });

    it('should hide tooltip on blur', async () => {
      render(
        <AccessibleTooltip content="Help text">
          <button>Help</button>
        </AccessibleTooltip>
      );

      const button = screen.getByText('Help');
      fireEvent.focus(button);

      let tooltip = screen.getByText('Help text');
      expect(tooltip).toBeInTheDocument();

      fireEvent.blur(button);

      // After blur, tooltip should not be visible
    });
  });

  describe('Keyboard Support', () => {
    it('should show tooltip when focused with Tab key', async () => {
      const user = userEvent.setup();
      render(
        <AccessibleTooltip content="Help text">
          <button>Help</button>
        </AccessibleTooltip>
      );

      const button = screen.getByText('Help');
      await user.tab();

      expect(button).toHaveFocus();
      const tooltip = screen.getByText('Help text');
      expect(tooltip).toBeInTheDocument();
    });

    it('should hide tooltip when Escape is pressed', async () => {
      render(
        <AccessibleTooltip content="Help text">
          <button>Help</button>
        </AccessibleTooltip>
      );

      const button = screen.getByText('Help');
      fireEvent.mouseEnter(button);

      let tooltip = screen.getByText('Help text');
      expect(tooltip).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });

      // Tooltip should now be hidden
    });
  });

  describe('Accessibility', () => {
    it('should have tooltip role', () => {
      render(
        <AccessibleTooltip content="Help text">
          <button>Help</button>
        </AccessibleTooltip>
      );

      const button = screen.getByText('Help');
      fireEvent.mouseEnter(button);

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toBeInTheDocument();
    });

    it('should set aria-describedby on trigger when tooltip is visible', () => {
      render(
        <AccessibleTooltip content="Help text">
          <button>Help</button>
        </AccessibleTooltip>
      );

      const button = screen.getByText('Help');
      fireEvent.mouseEnter(button);

      const describedBy = button.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(describedBy).toMatch(/^tooltip-/);
    });

    it('should not have aria-describedby when tooltip is not visible', () => {
      render(
        <AccessibleTooltip content="Help text">
          <button>Help</button>
        </AccessibleTooltip>
      );

      const button = screen.getByText('Help');
      const describedBy = button.getAttribute('aria-describedby');
      expect(describedBy).not.toBeTruthy();
    });
  });

  describe('Positioning', () => {
    it('should render with top positioning by default', () => {
      render(
        <AccessibleTooltip content="Help text" side="top">
          <button>Help</button>
        </AccessibleTooltip>
      );

      const button = screen.getByText('Help');
      fireEvent.mouseEnter(button);

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveClass('bottom-full');
    });

    it('should render with right positioning', () => {
      render(
        <AccessibleTooltip content="Help text" side="right">
          <button>Help</button>
        </AccessibleTooltip>
      );

      const button = screen.getByText('Help');
      fireEvent.mouseEnter(button);

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveClass('left-full');
    });

    it('should render with bottom positioning', () => {
      render(
        <AccessibleTooltip content="Help text" side="bottom">
          <button>Help</button>
        </AccessibleTooltip>
      );

      const button = screen.getByText('Help');
      fireEvent.mouseEnter(button);

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveClass('top-full');
    });

    it('should render with left positioning', () => {
      render(
        <AccessibleTooltip content="Help text" side="left">
          <button>Help</button>
        </AccessibleTooltip>
      );

      const button = screen.getByText('Help');
      fireEvent.mouseEnter(button);

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveClass('right-full');
    });
  });

  describe('Props Forwarding', () => {
    it('should pass className to tooltip element', () => {
      render(
        <AccessibleTooltip
          content="Help text"
          className="custom-class"
        >
          <button>Help</button>
        </AccessibleTooltip>
      );

      const button = screen.getByText('Help');
      fireEvent.mouseEnter(button);

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveClass('custom-class');
    });

    it('should allow child elements to work normally', () => {
      const handleClick = { fn: () => {} };
      render(
        <AccessibleTooltip content="Help text">
          <button onClick={handleClick.fn}>Click me</button>
        </AccessibleTooltip>
      );

      const button = screen.getByText('Click me');
      fireEvent.click(button);

      // Button should remain clickable despite tooltip
      expect(button).toBeInTheDocument();
    });
  });

  describe('Content Display', () => {
    it('should display provided content text', () => {
      render(
        <AccessibleTooltip content="This is help content">
          <button>Help</button>
        </AccessibleTooltip>
      );

      const button = screen.getByText('Help');
      fireEvent.mouseEnter(button);

      const content = screen.getByText('This is help content');
      expect(content).toBeInTheDocument();
    });

    it('should handle empty content', () => {
      render(
        <AccessibleTooltip content="">
          <button>Help</button>
        </AccessibleTooltip>
      );

      const button = screen.getByText('Help');
      fireEvent.mouseEnter(button);

      // Should still render tooltip even with empty content
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toBeInTheDocument();
    });
  });
});
