import * as React from 'react';
import { cn } from '../../lib/utils.js';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Explicit accessible label — announce loading state to screen readers */
  'aria-label'?: string;
}

/**
 * Skeleton loading placeholder.
 *
 * Usage: replace content areas while data is loading.
 * Always pair with a container that has role="status" or aria-live for a11y.
 */
export function Skeleton({ className, 'aria-label': ariaLabel, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden={ariaLabel ? undefined : 'true'}
      aria-label={ariaLabel}
      className={cn(
        'animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-bg-muted)]',
        className,
      )}
      {...props}
    />
  );
}
