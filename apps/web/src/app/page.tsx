/**
 * Root redirect — redirect to default locale.
 * Full homepage implemented in Prompt 3 (design system) + Prompt 4 (editorial).
 */
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/en');
}
