import Image from 'next/image';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/guard';
import { getT } from '@/lib/admin/lang';
import { getGalleryBranch, MAX_GALLERY } from '@/lib/admin/branch-gallery-data';
import { formatBytes } from '@/lib/admin/format-bytes';
import { writeConfigured } from '@/lib/admin/menu-data';
import { Card } from '@/components/admin/ui';
import { ImagePicker } from '@/components/admin/image-picker';
import { imagePickerLabels } from '@/components/admin/image-labels';
import { addGalleryAction, removeGalleryAction } from './actions';

export const dynamic = 'force-dynamic';

const ERR = {
  config: 'errConfig', nofile: 'errImageType', imagetype: 'errImageType', imagesize: 'errImageSize',
  imagedecode: 'errImageDecode', full: 'galleryMax', save: 'errSave',
} as const;

export default async function BranchGalleryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ err?: string; msg?: string }>;
}) {
  await requireAdmin();
  const { id: rawId } = await params;
  const { err, msg } = await searchParams;
  const { lang, t } = await getT();
  const branch = await getGalleryBranch(decodeURIComponent(rawId));
  const errKey = err && err in ERR ? ERR[err as keyof typeof ERR] : null;

  if (!branch) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-text-muted)]">{t('notFound')}</p>
        <Link href="/admin/branches" className="text-sm text-[var(--color-interactive-hover)] hover:underline">{t('branches')}</Link>
      </div>
    );
  }
  const name = lang === 'ar' && branch.nameAr ? branch.nameAr : branch.nameEn;
  const full = branch.items.length >= MAX_GALLERY;

  return (
    <div className="space-y-[var(--spacing-lg)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
          {t('gallery')}: {name} <span className="text-base font-normal text-[var(--color-text-muted)]">({branch.items.length}/{MAX_GALLERY})</span>
        </h1>
        <Link href="/admin/branches" className="text-sm text-[var(--color-interactive-hover)] hover:underline">{t('branches')}</Link>
      </div>
      {errKey && <p role="alert" className="text-sm text-[var(--color-error)]">{t(errKey)}</p>}
      {msg && !errKey && <p role="status" className="text-sm text-[var(--color-success)]">{msg === 'removed' ? t('msgDeleted') : t('msgSaved')}</p>}
      {!writeConfigured() && <p role="alert" className="text-sm text-[var(--color-warning)]">{t('errConfig')}</p>}

      <Card>
        {branch.items.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">{t('galleryEmpty')}</p>
        ) : (
          <ul role="list" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {branch.items.map((it) => (
              <li key={it.key} className="space-y-1 text-xs text-[var(--color-text-secondary)]">
                <Image
                  src={it.thumbUrl ?? it.url}
                  alt=""
                  width={it.meta?.thumbWidth ?? it.width ?? 600}
                  height={it.meta?.thumbHeight ?? it.height ?? 400}
                  sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                  {...(it.lqip ? { placeholder: 'blur' as const, blurDataURL: it.lqip } : {})}
                  className="aspect-[4/3] w-full rounded-[var(--radius-md)] object-cover"
                />
                {it.meta && (
                  <p>
                    {it.meta.width}×{it.meta.height} · {formatBytes(it.meta.fullBytes)} ({t('imgBefore')}: {formatBytes(it.meta.originalBytes)})
                  </p>
                )}
                <form action={removeGalleryAction}>
                  <input type="hidden" name="id" value={branch.id} />
                  <input type="hidden" name="key" value={it.key} />
                  <button type="submit" className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-2.5 py-1 text-[var(--color-error)] hover:bg-[var(--color-bg-muted)]">
                    {t('galleryRemove')}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {!full && (
        <Card title={t('galleryAdd')}>
          <form action={addGalleryAction} className="space-y-4">
            <input type="hidden" name="id" value={branch.id} />
            <ImagePicker name="images" multiple label={t('galleryAdd')} labels={imagePickerLabels(t)} />
            <button type="submit" className="rounded-[var(--radius-md)] bg-[var(--color-interactive)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--color-interactive-hover)]">
              {t('save')}
            </button>
          </form>
        </Card>
      )}
    </div>
  );
}
