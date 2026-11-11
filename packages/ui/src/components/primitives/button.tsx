import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils.js';

const buttonVariants = cva(
  // Base — WCAG 2.2 AA: min 44×44px touch target, visible focus
  [
    'inline-flex items-center justify-center gap-2',
    'min-h-[44px] min-w-[44px]',
    'rounded-[var(--radius-md)]',
    'font-semibold text-sm leading-none',
    'transition-colors duration-[var(--duration-micro)]',
    'focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'select-none cursor-pointer',
    // Respect reduced motion
    'motion-reduce:transition-none',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'bg-[var(--color-brand-bronze)] text-[var(--color-brand-ivory)]',
          'hover:bg-[var(--color-interactive-hover)]',
          'active:bg-[var(--color-interactive-focus)]',
        ].join(' '),
        secondary: [
          'bg-transparent text-[var(--color-brand-espresso)]',
          'border border-[var(--color-border-strong)]',
          'hover:bg-[var(--color-bg-muted)]',
          'active:bg-[var(--color-border)]',
        ].join(' '),
        ghost: [
          'bg-transparent text-[var(--color-brand-espresso)]',
          'hover:bg-[var(--color-bg-muted)]',
          'active:bg-[var(--color-border)]',
        ].join(' '),
        destructive: [
          'bg-[var(--color-error)] text-white',
          'hover:opacity-90',
          'active:opacity-100',
        ].join(' '),
      },
      size: {
        sm: 'h-9 px-3 text-xs',
        md: 'h-11 px-5 text-sm',
        lg: 'h-14 px-8 text-base',
        icon: 'h-11 w-11 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as the child element's tag (Radix Slot pattern) */
  asChild?: boolean;
  /** Show a loading spinner and disable interaction */
  loading?: boolean;
}

/**
 * Button component.
 *
 * Variants: primary | secondary | ghost | destructive
 * Sizes: sm | md | lg | icon
 *
 * WCAG 2.2 AA: min 44×44 touch target, visible focus ring, disabled state.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled ?? loading}
        aria-busy={loading ? 'true' : undefined}
        {...props}
      >
        {loading ? (
          <>
            <span
              aria-hidden="true"
              style={{
                display: 'inline-block',
                width: '1em',
                height: '1em',
                border: '2px solid currentColor',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
              }}
            />
            <span className="sr-only">Loading</span>
          </>
        ) : null}
        {children}
      </Comp>
    );
  },
);

Button.displayName = 'Button';
