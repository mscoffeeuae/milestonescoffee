import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDict } from '@milestones/i18n';
import type { Locale } from '@milestones/contracts';

export const supportedLocales: Locale[] = ['en', 'ar'];

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return supportedLocales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!supportedLocales.includes(locale as Locale)) return {};

  const dict = getDict(locale as Locale);
  return {
    title: {
      template: `%s — ${dict.nav.menu}`,
      default: 'Milestones Coffee',
    },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!supportedLocales.includes(locale as Locale)) {
    notFound();
  }

  const isRtl = locale === 'ar';

  return (
    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'}>
      <body>{children}</body>
    </html>
  );
}
