import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createToast, dismissToast, ToastContainer, useToast, clearAllToasts } from '@/components/toast-notification';

describe('Toast Notification System', () => {
  beforeEach(() => {
    clearAllToasts();
  });

  describe('createToast', () => {
    it('should create unique toast IDs', () => {
      const id1 = createToast('Message 1');
      const id2 = createToast('Message 2');
      expect(id1).not.toBe(id2);
    });

    it('should accept toast type and duration', () => {
      const id = createToast('Test', 'error', 5000);
      expect(typeof id).toBe('string');
    });
  });

  describe('dismissToast', () => {
    it('should not throw on dismiss', () => {
      const id = createToast('Test');
      expect(() => dismissToast(id)).not.toThrow();
    });
  });

  describe('ToastContainer', () => {
    it('should render toast with message', async () => {
      render(<ToastContainer />);
      createToast('Test message');

      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeDefined();
      });
    });

    it('should render success toast with checkmark', async () => {
      render(<ToastContainer />);
      createToast('Success!', 'success');

      await waitFor(() => {
        expect(screen.getByText('✓')).toBeDefined();
      });
    });

    it('should render error toast with X', async () => {
      render(<ToastContainer />);
      createToast('Error!', 'error');

      await waitFor(() => {
        expect(screen.getByText('✕')).toBeDefined();
      });
    });

    it('should render warning icon', async () => {
      render(<ToastContainer />);
      createToast('Warning!', 'warning');

      await waitFor(() => {
        expect(screen.getByText('⚠')).toBeDefined();
      });
    });

    it('should render info icon', async () => {
      render(<ToastContainer />);
      createToast('Info!', 'info');

      await waitFor(() => {
        expect(screen.getByText('ℹ')).toBeDefined();
      });
    });

    it('should have close button', async () => {
      render(<ToastContainer />);
      createToast('Test');

      await waitFor(() => {
        const btn = screen.getByLabelText('Close notification');
        expect(btn.textContent).toBe('×');
      });
    });

    it('should dismiss when close clicked', async () => {
      const user = userEvent.setup();
      render(<ToastContainer />);
      createToast('Test');

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeDefined();
      });

      const btn = screen.getByLabelText('Close notification');
      await user.click(btn);

      await waitFor(
        () => {
          expect(screen.queryByRole('alert')).toBeNull();
        },
        { timeout: 1000 }
      );
    });
  });

  describe('useToast', () => {
    it('should have success, error, warning, info methods', () => {
      type ToastMethods = ReturnType<typeof useToast>;
      let toast: ToastMethods | undefined;

      function Component(): React.ReactElement | null {
        toast = useToast();
        return null;
      }

      render(<Component />);
      expect(typeof toast?.success).toBe('function');
      expect(typeof toast?.error).toBe('function');
      expect(typeof toast?.warning).toBe('function');
      expect(typeof toast?.info).toBe('function');
    });

    it('success should create success toast', async () => {
      function Component(): React.ReactElement {
        const toast = useToast();
        return <button onClick={() => toast.success('Success!')}>Test</button>;
      }

      render(
        <>
          <Component />
          <ToastContainer />
        </>
      );

      await userEvent.click(screen.getByRole('button'));
      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeDefined();
      });
    });

    it('error should create error toast', async () => {
      function Component(): React.ReactElement {
        const toast = useToast();
        return <button onClick={() => toast.error('Error!')}>Test</button>;
      }

      render(
        <>
          <Component />
          <ToastContainer />
        </>
      );

      await userEvent.click(screen.getByRole('button'));
      await waitFor(() => {
        expect(screen.getByText('Error!')).toBeDefined();
      });
    });
  });
});
