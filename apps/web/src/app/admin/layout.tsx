import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/shell';
import { isAdmin } from '@/lib/admin/guard';
import { getT } from '@/lib/admin/lang';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { lang, t } = await getT();
  const authed = await isAdmin();
  return (
    <AdminShell lang={lang} t={t} authed={authed}>
      {children}
    </AdminShell>
  );
}
