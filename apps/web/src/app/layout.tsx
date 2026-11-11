import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s — Milestones Coffee',
    default: 'Milestones Coffee',
  },
  description: 'Milestones Coffee — specialty coffee across the UAE',
  // ⚠ Update with approved brand description in en and ar before launch
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // lang and dir are set per-locale in [locale]/layout.tsx
    // Root layout has no lang attribute to avoid hydration mismatch
    <html suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
