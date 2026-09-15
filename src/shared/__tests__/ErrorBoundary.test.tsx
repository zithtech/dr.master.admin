import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

function Explode(): never {
  throw new Error('kaboom');
}

describe('ErrorBoundary', () => {
  // React logs caught render errors to console.error by design. Silencing it
  // keeps the test output readable; without this every run prints a stack
  // trace that looks like a failure.
  // `vi.restoreAllMocks()` rather than holding the spy in a typed variable:
  // `ReturnType<typeof vi.spyOn>` resolves to an `any`-shaped generic, and
  // calling `.mockRestore()` on it trips @typescript-eslint/no-unsafe-call.
  beforeAll(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>all good</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText('all good')).toBeInTheDocument();
    expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument();
  });

  it('renders the fallback when a child throws', () => {
    render(
      <ErrorBoundary>
        <Explode />
      </ErrorBoundary>,
    );

    expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
    // role="alert" is what makes a screen reader announce the crash.
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('recovers when the user clicks "Try again" and the cause is gone', async () => {
    const user = userEvent.setup();

    function Flaky() {
      const [shouldThrow, setShouldThrow] = useState(true);
      return (
        <>
          <button type="button" onClick={() => setShouldThrow(false)}>
            fix it
          </button>
          <ErrorBoundary>{shouldThrow ? <Explode /> : <p>recovered</p>}</ErrorBoundary>
        </>
      );
    }

    render(<Flaky />);
    expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();

    // Remove the cause, then reset the boundary.
    await user.click(screen.getByRole('button', { name: /fix it/i }));
    await user.click(screen.getByRole('button', { name: /try again/i }));

    expect(screen.getByText('recovered')).toBeInTheDocument();
    expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument();
  });

  it('uses a custom fallback when one is supplied', () => {
    render(
      <ErrorBoundary fallback={(error) => <p>custom: {error.message}</p>}>
        <Explode />
      </ErrorBoundary>,
    );

    expect(screen.getByText('custom: kaboom')).toBeInTheDocument();
  });
});
