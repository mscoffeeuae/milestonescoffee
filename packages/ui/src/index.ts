/**
 * @milestones/ui — Shared component library
 *
 * Dependency boundary: web and admin apps may import from here.
 * api and worker must NOT import UI components.
 *
 * All components target WCAG 2.2 AA accessibility.
 */

// Utilities
export { cn } from './lib/utils.js';

// Primitives
export { Button } from './components/primitives/button.js';
export type { ButtonProps } from './components/primitives/button.js';

export { Input } from './components/primitives/input.js';
export type { InputProps } from './components/primitives/input.js';

export { Label } from './components/primitives/label.js';
export type { LabelProps } from './components/primitives/label.js';

// Feedback
export { Skeleton } from './components/feedback/skeleton.js';
export { EmptyState } from './components/feedback/empty-state.js';
export { ErrorState } from './components/feedback/error-state.js';
