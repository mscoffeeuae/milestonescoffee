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

  const isAr = locale === 'ar';

  return {
    title: {
      template: `%s — Milestones Coffee`,
      default: 'Milestones Coffee',
    },
    description: isAr
      ? 'اكتشف أفضل مقاهي أبوظبي في ميلستونز كوفي — ٣٠+ فرعاً في أبوظبي والعين'
      : "Discover Abu Dhabi's top cafés at Milestones Coffee. Enjoy the best coffee experience with 30+ branches across Abu Dhabi & Al-Ain.",
    openGraph: {
      siteName: 'Milestones Coffee',
      type: 'website',
      images: [
        {
          url: 'https://milestonescoffee.ae/wp-content/uploads/2024/11/mile_logo.png',
          width: 400,
          height: 120,
          alt: 'Milestones Coffee',
        },
      ],
    },
    twitter: {
      card: 'summary',
      site: '@milestones_coffee',
    },
    alternates: {
      languages: { en: '/en', ar: '/ar' },
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
