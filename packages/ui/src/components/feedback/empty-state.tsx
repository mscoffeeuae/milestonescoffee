import * as React from 'react';
import { cn } from '../../lib/utils.ts';

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Illustration slot — icon or graphic */
  icon?: React.ReactNode;
  /** Heading text */
  heading: string;
  /** Supporting description */
  description?: string;
  /** Call-to-action slot */
  action?: React.ReactNode;
}

/**
 * Empty state component — displayed when a list or section has no content.
 * Required for every data-driven view (see DESIGN_SYSTEM.md).
 */
export function EmptyState({
  icon,
  heading,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        'py-16 px-8 text-center',
        className,
      )}
      {...props}
    >
      {icon ? (
        <div
          aria-hidden="true"
          style={{ color: 'var(--color-text-muted)', fontSize: '3rem' }}
        >
          {icon}
        </div>
      ) : null}
      <h3
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.125rem',
          color: 'var(--color-text-primary)',
          margin: 0,
        }}
      >
        {heading}
      </h3>
      {description ? (
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0, maxWidth: '400px' }}>
          {description}
        </p>
      ) : null}
      {action ? <div style={{ marginTop: '8px' }}>{action}</div> : null}
    </div>
  );
}
