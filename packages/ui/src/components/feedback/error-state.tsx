import * as React from 'react';
import { cn } from '../../lib/utils.ts';

interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  heading?: string;
  description?: string;
  /** Retry callback */
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * Error state — displayed when a data fetch or action fails.
 * Required for every data-driven view (see DESIGN_SYSTEM.md).
 */
export function ErrorState({
  heading = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  onRetry,
  retryLabel = 'Try again',
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        'py-16 px-8 text-center',
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" style={{ fontSize: '2.5rem' }}>⚠️</span>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem', color: 'var(--color-text-primary)', margin: 0 }}>
        {heading}
      </h3>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0, maxWidth: '400px' }}>
        {description}
      </p>
      {onRetry ? (
        <button
          onClick={onRetry}
          style={{
            marginTop: '8px',
            padding: '0.5rem 1.25rem',
            background: 'var(--color-brand-bronze)',
            color: 'var(--color-brand-ivory)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            minHeight: '44px',
          }}
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
