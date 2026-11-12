/**
 * @milestones/ui — Shared component library
 *
 * Dependency boundary: web and admin apps may import from here.
 * api and worker must NOT import UI components.
 *
 * All components target WCAG 2.2 AA accessibility.
 */

// Utilities
export { cn } from './lib/utils.ts';

// Primitives
export { Button } from './components/primitives/button.ts';
export type { ButtonProps } from './components/primitives/button.ts';

export { Input } from './components/primitives/input.ts';
export type { InputProps } from './components/primitives/input.ts';

export { Label } from './components/primitives/label.ts';
export type { LabelProps } from './components/primitives/label.ts';

// Feedback
export { Skeleton } from './components/feedback/skeleton.ts';
export { EmptyState } from './components/feedback/empty-state.ts';
export { ErrorState } from './components/feedback/error-state.ts';
