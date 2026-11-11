/**
 * Arabic homepage placeholder.
 * Full design with RTL support implemented in Prompt 3 (design system) + Prompt 4 (editorial content).
 * [PLACEHOLDER — Arabic copy requires native speaker review and Marketing approval]
 */
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ميلستونز كوفي',
};

export default function ArHomePage() {
  return (
    <main lang="ar" dir="rtl">
      <h1>ميلستونز كوفي</h1>
      <p>[PLACEHOLDER — صفحة مؤقتة، سيتم التنفيذ الكامل في Prompt 3 + 4]</p>
    </main>
  );
}
