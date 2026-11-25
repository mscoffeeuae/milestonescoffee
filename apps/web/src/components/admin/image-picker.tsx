'use client';

import { useEffect, useRef, useState } from 'react';
import { formatBytes } from '@/lib/admin/format-bytes';

export interface ImagePickerLabels {
  before: string;
  after: string;
  saved: string;
  checking: string;
  keptOriginal: string;
  previewFail: string;
  errType: string;
  errSize: string;
  errDecode: string;
}

interface Preview {
  before: { bytes: number; width: number; height: number };
  after: { bytes: number; width: number; height: number; thumbBytes: number; avifBytes: number | null; keptOriginal: boolean; dataUrl: string };
  savedBytes: number;
}

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * File input that shows a before/after preview (from POST /admin/images/preview) before the form is
 * saved. The original file stays in the input; the server optimises it again on save.
 */
export function ImagePicker({
  name = 'image', multiple = false, label, labels,
}: { name?: string; multiple?: boolean; label: string; labels: ImagePickerLabels }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const seq = useRef(0);

  useEffect(() => () => { if (beforeUrl) URL.revokeObjectURL(beforeUrl); }, [beforeUrl]);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const mine = ++seq.current;
    setPreview(null);
    setError(null);
    setBeforeUrl(null);
    // Several files (gallery): the preview is single-file; the server still optimises each on save.
    if (!file || (e.target.files?.length ?? 0) > 1) return;
    if (file.size > MAX_BYTES) { setError(labels.errSize); return; }
    setBeforeUrl(URL.createObjectURL(file));
    setBusy(true);
    try {
      const body = new FormData();
      body.set('image', file);
      const res = await fetch('/admin/images/preview', { method: 'POST', body });
      const data = (await res.json()) as { ok: boolean; code?: string } & Partial<Preview>;
      if (mine !== seq.current) return;
      if (!data.ok) {
        setBeforeUrl(null);
        setError(data.code === 'type' ? labels.errType : data.code === 'size' ? labels.errSize : data.code === 'decode' ? labels.errDecode : labels.previewFail);
      } else {
        setPreview(data as Preview);
      }
    } catch {
      if (mine === seq.current) setError(labels.previewFail);
    } finally {
      if (mine === seq.current) setBusy(false);
    }
  }

  const pct = preview && preview.before.bytes > 0 ? Math.round((preview.savedBytes / preview.before.bytes) * 100) : 0;
  const fig = 'flex w-40 flex-col gap-1 text-xs text-[var(--color-text-secondary)]';
  const img = 'size-40 rounded-[var(--radius-md)] bg-[var(--color-bg-muted)] object-contain ring-1 ring-black/10';
  return (
    <div>
      <label className="block text-sm">
        <span className="mb-1 block text-[var(--color-text-secondary)]">{label}</span>
        <input
          name={name}
          type="file"
          multiple={multiple}
          accept="image/jpeg,image/png,image/webp,image/heic,.heic"
          onChange={onChange}
          className="text-sm"
        />
      </label>
      {busy && <p role="status" className="mt-2 text-xs text-[var(--color-text-muted)]">{labels.checking}</p>}
      {error && <p role="alert" className="mt-2 text-sm text-[var(--color-error)]">{error}</p>}
      {preview && beforeUrl && (
        <div className="mt-3 flex flex-wrap items-start gap-4" aria-live="polite">
          <figure className={fig} data-testid="img-before">
            {/* Local blob/data previews cannot go through next/image. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={beforeUrl} alt="" className={img} />
            <figcaption>
              <strong className="text-[var(--color-text-primary)]">{labels.before}</strong><br />
              {formatBytes(preview.before.bytes)} · {preview.before.width}×{preview.before.height}
            </figcaption>
          </figure>
          <figure className={fig} data-testid="img-after">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.after.dataUrl} alt="" className={img} />
            <figcaption>
              <strong className="text-[var(--color-text-primary)]">{labels.after}</strong><br />
              {formatBytes(preview.after.bytes)} · {preview.after.width}×{preview.after.height}
            </figcaption>
          </figure>
          <p className="self-center text-sm" data-testid="img-saved">
            <strong style={{ color: preview.savedBytes > 0 ? 'var(--color-success)' : 'inherit' }}>
              {labels.saved}: {formatBytes(Math.max(0, preview.savedBytes))} ({Math.max(0, pct)}%)
            </strong>
            {preview.after.keptOriginal && <><br /><span className="text-xs text-[var(--color-text-muted)]">{labels.keptOriginal}</span></>}
            <br />
            <span className="text-xs text-[var(--color-text-muted)]">
              +600px thumb {formatBytes(preview.after.thumbBytes)}{preview.after.avifBytes ? ` · AVIF ${formatBytes(preview.after.avifBytes)}` : ''}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
