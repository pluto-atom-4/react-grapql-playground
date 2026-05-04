import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '@/components/error-boundary';
import '@testing-library/jest-dom';

// Suppress console errors during tests for cleaner output
vi.spyOn(console, 'error').mockImplementation(() => {});

// Component that throws during render
const ThrowError = ({ shouldThrow = true, message = 'Test error message' }) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div>Component Rendered Successfully</div>;
};

// Component that throws conditionally for reset testing
let shouldThrowRef = { value: true };
const ConditionalThrow = () => {
  if (shouldThrowRef.value) {
    throw new Error('Conditional error');
  }
  return <div>Conditional Component Recovered</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    shouldThrowRef.value = true;
  });

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Child Component</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Child Component')).toBeInTheDocument();
  });

  it('should catch errors and display fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should display reset button in fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const button = screen.getByRole('button', { name: /try again/i });
    expect(button).toBeInTheDocument();
  });

  it('should reset error state when reset button is clicked', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>
    );

    // Initial error state
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Change the conditional to not throw
    shouldThrowRef.value = false;

    // Click reset button
    const button = screen.getByRole('button', { name: /try again/i });
    await user.click(button);

    // Rerender to allow recovery
    rerender(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>
    );

    // Should now show recovered component
    expect(screen.getByText('Conditional Component Recovered')).toBeInTheDocument();
  });

  it('should support custom fallback UI', () => {
    const customFallback = (error: Error, reset: () => void) => (
      <div>
        <h2>Custom Error UI</h2>
        <p>{error.message}</p>
        <button onClick={reset}>Custom Reset</button>
      </div>
    );

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError message="Custom error" />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    expect(screen.getByText('Custom error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /custom reset/i })).toBeInTheDocument();
  });

  it('should catch errors from deeply nested components', () => {
    const NestedComponent = () => (
      <div>
        <div>
          <ThrowError message="Nested error" />
        </div>
      </div>
    );

    render(
      <ErrorBoundary>
        <NestedComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Nested error')).toBeInTheDocument();
  });

  it('should preserve error message in state after catch', () => {
    const errorMessage = 'Specific error message';

    render(
      <ErrorBoundary>
        <ThrowError message={errorMessage} />
      </ErrorBoundary>
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should catch errors from multiple component types', () => {
    const ChildComponent = ({ shouldFail }: { shouldFail: boolean }) => {
      if (shouldFail) throw new Error('Child component error');
      return <div>Child success</div>;
    };

    render(
      <ErrorBoundary>
        <ChildComponent shouldFail={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should render default fallback when custom fallback is undefined', () => {
    render(
      <ErrorBoundary fallback={undefined}>
        <ThrowError message="Default fallback test" />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Default fallback test')).toBeInTheDocument();
  });

  it('should make reset button keyboard accessible', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const button = screen.getByRole('button', { name: /try again/i });
    expect(button).toHaveAttribute('type', 'button');
  });

  it('should display reset button with correct class', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const button = screen.getByRole('button', { name: /try again/i });
    expect(button).toHaveClass('error-boundary-reset-btn');
  });

  it('should prevent error propagation to parent boundary', () => {
    const OuterComponent = ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    );

    render(
      <OuterComponent>
        <ErrorBoundary fallback={() => <div>Inner Error</div>}>
          <ThrowError message="Inner error" />
        </ErrorBoundary>
      </OuterComponent>
    );

    expect(screen.getByText('Inner Error')).toBeInTheDocument();
  });
});
