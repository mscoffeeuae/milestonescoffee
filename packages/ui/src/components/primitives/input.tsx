import * as React from 'react';
import { cn } from '../../lib/utils.js';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Validation error message — displayed below the input */
  error?: string;
}

/**
 * Input component.
 *
 * WCAG 2.2 AA: label association via htmlFor (required by callers),
 * error state communicated via aria-invalid + aria-describedby,
 * min-height 44px for touch targets.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, id, ...props }, ref) => {
    const errorId = error && id ? `${id}-error` : undefined;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={errorId}
          className={cn(
            'block w-full rounded-[var(--radius-md)]',
            'min-h-[44px] px-3 py-2',
            'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]',
            'border border-[var(--color-border)]',
            'text-sm placeholder:text-[var(--color-text-muted)]',
            'transition-colors duration-[var(--duration-micro)]',
            'focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-0',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-[var(--color-error)] focus-visible:outline-[var(--color-error)]',
            className,
          )}
          {...props}
        />
        {error && errorId ? (
          <span
            id={errorId}
            role="alert"
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-error)',
              paddingInlineStart: '4px',
            }}
          >
            {error}
          </span>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
