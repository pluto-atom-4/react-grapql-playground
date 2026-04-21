'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useMutation } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LOGIN_MUTATION } from '@/lib/graphql-queries';

interface ValidationErrors {
  email?: string;
  password?: string;
}

interface FormState {
  email: string;
  password: string;
}

export default function LoginForm() {
  const [formState, setFormState] = useState<FormState>({ email: '', password: '' });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const router = useRouter();
  const { login } = useAuth();

  const [loginMutation, { loading }] = useMutation<{
    login: { token: string; user: { id: string; email: string } };
  }>(LOGIN_MUTATION, {
    onCompleted: (data) => {
      const token = data?.login?.token;
      if (token) {
        login(token);
        router.push('/');
      }
    },
    onError: (error) => {
      const graphQLError = error as {
        message?: string;
        graphQLErrors?: Array<{ message?: string }>;
      };
      const message = graphQLError.message || graphQLError.graphQLErrors?.[0]?.message;

      if (message === 'Invalid email or password') {
        setGeneralError('Invalid email or password');
        setFormState((prev) => ({ ...prev, password: '' }));
      } else if (message?.includes('Server') || message?.includes('500')) {
        setGeneralError('Server error. Please try again later.');
      } else if (message?.includes('timeout') || message?.includes('network')) {
        setGeneralError('Connection failed. Check your internet and try again.');
      } else {
        setGeneralError(message || 'Login failed. Please try again.');
      }
    },
  });

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

    const errors: ValidationErrors = {};
    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
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

  const handleBlur = (e: ChangeEvent<HTMLInputElement>): void => {
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

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateForm()) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      try {
        // Create timeout promise that rejects after 30 seconds
        const controller = new AbortController();
        const timeoutId = globalThis.setTimeout(() => {
          controller.abort();
        }, 30000);

        try {
          await loginMutation({
            variables: {
              email: formState.email.toLowerCase(),
              password: formState.password,
            },
          });
        } finally {
          globalThis.clearTimeout(timeoutId);
        }
      } catch (error) {
        if (error instanceof Error) {
          setGeneralError(error.message);
        } else {
          setGeneralError('Login failed. Please try again.');
        }
      }
    })();
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
