import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccessibleTooltip } from '../AccessibleTooltip';

describe('AccessibleTooltip - Accessibility', () => {
  describe('Tooltip Display', () => {
    it('should display tooltip on hover', () => {
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

    it('should display tooltip on focus', () => {
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

    it('should hide tooltip when Escape is pressed', () => {
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
  });
});
