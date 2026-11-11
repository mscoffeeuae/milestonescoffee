/**
 * Root layout — minimal shell.
 * Full bilingual layout with RTL support implemented in Prompt 3.
 */
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Milestones Coffee',
    default: 'Milestones Coffee',
  },
  description: '[PLACEHOLDER — requires Marketing-approved copy]',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
