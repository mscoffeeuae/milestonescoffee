/**
 * @milestones/ui — Shared component library
 *
 * Dependency boundary: web and admin apps may import from here.
 * api and worker must NOT import UI components.
 *
 * All components target WCAG 2.2 AA accessibility.
 */

// Utilities
export { cn } from './lib/utils';

// Primitives
export { Button } from './components/primitives/button';
export type { ButtonProps } from './components/primitives/button';

export { Input } from './components/primitives/input';
export type { InputProps } from './components/primitives/input';

export { Label } from './components/primitives/label';
export type { LabelProps } from './components/primitives/label';

// Feedback
export { Skeleton } from './components/feedback/skeleton';
export { EmptyState } from './components/feedback/empty-state';
export { ErrorState } from './components/feedback/error-state';
