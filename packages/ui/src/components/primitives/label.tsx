import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '../../lib/utils.js';

export interface LabelProps extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  required?: boolean;
}

/**
 * Label component — associates with form controls via htmlFor.
 * Shows a required indicator (*) when required=true.
 */
export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, required, children, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      'block text-sm font-medium text-[var(--color-text-primary)]',
      'leading-none peer-disabled:opacity-50',
      className,
    )}
    {...props}
  >
    {children}
    {required ? (
      <span aria-hidden="true" style={{ color: 'var(--color-error)', marginInlineStart: '4px' }}>
        *
      </span>
    ) : null}
  </LabelPrimitive.Root>
));

Label.displayName = LabelPrimitive.Root.displayName;
