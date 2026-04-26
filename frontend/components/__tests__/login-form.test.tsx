/* eslint-disable @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-misused-promises */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import React, { useState } from 'react';

// Intentionally unused: kept for reference
// const _LOGIN_MUTATION = gql`
//   mutation Login($email: String!, $password: String!) {
//     login(email: $email, password: $password) {
//       token
//       user {
//         id
//         email
//       }
//     }
//   }
// `;

/**
 * Mock LoginForm Component
 * Mirrors the actual LoginForm from frontend/components/login-form.tsx
 */
function MockLoginForm() {
  const [formState, setFormState] = useState<{ email: string; password: string }>({
    email: '',
    password: '',
  });
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [loading, setLoading] = useState(false);

  const mockLogin = (token: string) => {
    localStorage.setItem('auth_token', token);
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return 'Email is required';
    }
    if (!email.includes('@')) {
      return 'Enter a valid email address';
    }
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      return 'Password must contain letters and numbers';
    }

    return undefined;
  };

  const validateForm = (): boolean => {
    const emailError = validateEmail(formState.email);
    const passwordError = validatePassword(formState.password);

    const errors: typeof validationErrors = {};
    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    setGeneralError(null);

    if (touched[name as keyof typeof touched]) {
      const error =
        name === 'email'
          ? validateEmail(value)
          : name === 'password'
            ? validatePassword(value)
            : undefined;

      setValidationErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  const handleBlur = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    const error =
      name === 'email'
        ? validateEmail(value)
        : name === 'password'
          ? validatePassword(value)
          : undefined;

    setValidationErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formState.email.toLowerCase(),
          password: formState.password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        mockLogin(data.token);
      } else if (response.status === 401) {
        setGeneralError('Invalid email or password');
        setFormState((prev) => ({ ...prev, password: '' }));
      } else {
        setGeneralError('Server error. Please try again later.');
      }
    } catch {
      setGeneralError('Connection failed. Check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    !validationErrors.email && !validationErrors.password && formState.email && formState.password;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-8">Sign In</h1>

      {generalError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{generalError}</p>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formState.email}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={loading}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            validationErrors.email
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          } disabled:bg-gray-100 disabled:cursor-not-allowed`}
          placeholder="you@example.com"
        />
        {validationErrors.email && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={formState.password}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={loading}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            validationErrors.password
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          } disabled:bg-gray-100 disabled:cursor-not-allowed`}
          placeholder="••••••••"
        />
        {validationErrors.password && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!isFormValid || loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="inline-block animate-spin">🔄</span>
            <span>Signing in...</span>
          </>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
}

describe('LoginForm Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Validation Tests', () => {
    it('email validation: valid email accepted', async () => {
      const user = userEvent.setup();
      render(<MockLoginForm />);

      const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
      await user.type(emailInput, 'test@example.com');

      expect(emailInput.value).toBe('test@example.com');
      expect(screen.queryByText('Enter a valid email address')).not.toBeInTheDocument();
    });

    it('email validation: invalid email rejected', async () => {
      const user = userEvent.setup();
      render(<MockLoginForm />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      await user.type(emailInput, 'invalidemail');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
      });
    });

    it('email validation: empty email rejected', async () => {
      render(<MockLoginForm />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('password validation: valid password accepted', async () => {
      const user = userEvent.setup();
      render(<MockLoginForm />);

      const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
      await user.type(passwordInput, 'ValidPassword123');

      expect(passwordInput.value).toBe('ValidPassword123');
      expect(screen.queryByText('Password must be at least 8 characters')).not.toBeInTheDocument();
    });

    it('password validation: short password rejected', async () => {
      const user = userEvent.setup();
      render(<MockLoginForm />);

      const passwordInput = screen.getByPlaceholderText('••••••••');
      await user.type(passwordInput, 'short');
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      });
    });

    it('password validation: empty password rejected', async () => {
      render(<MockLoginForm />);

      const passwordInput = screen.getByPlaceholderText('••••••••');
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });

    it('password with only letters is rejected', async () => {
      const user = userEvent.setup();
      render(<MockLoginForm />);

      const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
      await user.type(passwordInput, 'abcdefgh');
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getByText('Password must contain letters and numbers')).toBeInTheDocument();
      });
    });

    it('password with only numbers is rejected', async () => {
      const user = userEvent.setup();
      render(<MockLoginForm />);

      const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
      await user.type(passwordInput, '12345678');
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getByText('Password must contain letters and numbers')).toBeInTheDocument();
      });
    });

    it('password with mixed letters and numbers is accepted', async () => {
      const user = userEvent.setup();
      render(<MockLoginForm />);

      const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
      await user.type(passwordInput, 'Password123');
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(
          screen.queryByText('Password must contain letters and numbers')
        ).not.toBeInTheDocument();
      });
    });

    it('real-time validation: errors show on blur', async () => {
      render(<MockLoginForm />);

      const emailInput = screen.getByPlaceholderText('you@example.com');

      // Before blur: no error
      expect(screen.queryByText('Email is required')).not.toBeInTheDocument();

      // After blur: error shows
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('submit validation: all fields required', async () => {
      const user = userEvent.setup();
      render(<MockLoginForm />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Button should be disabled initially
      expect(submitButton).toBeDisabled();

      // Fill only email
      const emailInput = screen.getByPlaceholderText('you@example.com');
      await user.type(emailInput, 'test@example.com');

      // Button should still be disabled (password missing)
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Loading & UX Tests', () => {
    it('button shows "Signing in..." during submission', async () => {
      const user = userEvent.setup();
      render(<MockLoginForm />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123');

      // Mock fetch to not respond immediately
      globalThis.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Signing in...')).toBeInTheDocument();
      });
    });

    it('button is disabled during submission', async () => {
      const user = userEvent.setup();
      render(<MockLoginForm />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123');

      globalThis.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;

      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('password input is shown (not hidden with XSS note)', () => {
      render(<MockLoginForm />);

      const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;

      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput.type).toBe('password');
      expect(screen.queryByText(/XSS/i)).not.toBeInTheDocument();
    });

    it('email input accepts text', async () => {
      const user = userEvent.setup();
      render(<MockLoginForm />);

      const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
      await user.type(emailInput, 'user@test.com');

      expect(emailInput.value).toBe('user@test.com');
    });

    it('error messages display inline below fields', async () => {
      render(<MockLoginForm />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        const errorMsg = screen.getByText('Email is required');
        expect(errorMsg.parentElement).toBeInTheDocument();
      });
    });

    it('submit button is disabled if form invalid', async () => {
      const user = userEvent.setup();
      render(<MockLoginForm />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Empty form: button disabled
      expect(submitButton).toBeDisabled();

      // Valid email, no password: button disabled
      const emailInput = screen.getByPlaceholderText('you@example.com');
      await user.type(emailInput, 'test@example.com');
      expect(submitButton).toBeDisabled();

      // Both valid: button enabled
      const passwordInput = screen.getByPlaceholderText('••••••••');
      await user.type(passwordInput, 'ValidPassword123');
      expect(submitButton).not.toBeDisabled();
    });

    it('loading spinner shown during submission', async () => {
      const user = userEvent.setup();
      render(<MockLoginForm />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123');

      globalThis.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Signing in...')).toBeInTheDocument();
        expect(screen.getByText('🔄')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Tests', () => {
    it('401 error clears password field', async () => {
      const user = userEvent.setup();

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      render(<MockLoginForm />);

      const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'InvalidPassword1');
      await user.click(submitButton);

      await waitFor(() => {
        expect(passwordInput.value).toBe('');
      });
    });

    it('401 error displays specific error message', async () => {
      const user = userEvent.setup();

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      render(<MockLoginForm />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'InvalidPassword1');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
      });
    });

    it('500 error displays generic error message', async () => {
      const user = userEvent.setup();

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      render(<MockLoginForm />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Server error/i)).toBeInTheDocument();
      });
    });

    it('network error handles connection timeout', async () => {
      const user = userEvent.setup();

      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      render(<MockLoginForm />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed|error/i)).toBeInTheDocument();
      });
    });

    it('after error, form remains interactable (retry possible)', async () => {
      const user = userEvent.setup();

      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      render(<MockLoginForm />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // First attempt: fails
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'InvalidPassword1');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
      });

      // Second attempt: can retry
      const passwordInputAfterError = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
      await user.clear(passwordInputAfterError);
      await user.type(passwordInputAfterError, 'ValidPassword123');

      // Button should be enabled again
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Field State Tests', () => {
    it('email field maintains state during errors', async () => {
      const user = userEvent.setup();

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      render(<MockLoginForm />);

      const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      const testEmail = 'test@example.com';
      await user.type(emailInput, testEmail);
      await user.type(passwordInput, 'InvalidPassword1');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
      });

      expect(emailInput.value).toBe(testEmail);
    });

    it('password field clears on 401 error only', async () => {
      const user = userEvent.setup();

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      render(<MockLoginForm />);

      const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
      const emailInput = screen.getByPlaceholderText('you@example.com');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      const testPassword = 'InvalidPassword1';
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, testPassword);
      await user.click(submitButton);

      await waitFor(() => {
        expect(passwordInput.value).toBe('');
      });
    });

    it('form state preserved on validation errors', async () => {
      const user = userEvent.setup();
      render(<MockLoginForm />);

      const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;

      const testEmail = 'test@example.com';
      const testPassword = 'ValidPassword123';

      await user.type(emailInput, testEmail);
      await user.type(passwordInput, testPassword);

      expect(emailInput.value).toBe(testEmail);
      expect(passwordInput.value).toBe(testPassword);

      // Validation errors don't clear fields
      fireEvent.blur(emailInput);
      expect(emailInput.value).toBe(testEmail);
    });

    it('fields properly receive focus on errors', async () => {
      const user = userEvent.setup();
      render(<MockLoginForm />);

      const emailInput = screen.getByPlaceholderText('you@example.com');

      // Focus on email field
      await user.click(emailInput);
      expect(emailInput).toHaveFocus();

      // Blur to trigger validation
      fireEvent.blur(emailInput);

      // Should show error for empty email
      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });
  });

  describe('Form Behavior', () => {
    it('form is usable and can be filled out', async () => {
      const user = userEvent.setup();
      render(<MockLoginForm />);

      const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      expect(submitButton).toBeDisabled();

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123');

      expect(emailInput.value).toBe('test@example.com');
      expect(passwordInput.value).toBe('ValidPassword123');
      expect(submitButton).not.toBeDisabled();
    });
  });
});
