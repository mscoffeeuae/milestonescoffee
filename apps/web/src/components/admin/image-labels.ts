import type { T } from '@/lib/admin/i18n';
import type { ImagePickerLabels } from './image-picker';

/** Resolves picker strings on the server so the client component receives plain text. */
export function imagePickerLabels(t: T): ImagePickerLabels {
  return {
    before: t('imgBefore'),
    after: t('imgAfter'),
    saved: t('imgSaved'),
    checking: t('imgChecking'),
    keptOriginal: t('imgKeptOriginal'),
    previewFail: t('imgPreviewFail'),
    errType: t('errImageType'),
    errSize: t('errImageSize'),
    errDecode: t('errImageDecode'),
  };
}
