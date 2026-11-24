import QRCode from 'qrcode';

/** Server-rendered QR (inline SVG) for the branch page URL; nothing leaves the server. */
export async function BranchQr({ isAr, url, name }: { isAr: boolean; url: string; name: string }) {
  const svg = await QRCode.toString(url, { type: 'svg', margin: 1, width: 160, color: { dark: '#3B1F0E', light: '#FFFFFF' } });
  return (
    <section className="ms-surface ms-pad text-center">
      <h2 className="mb-3 text-lg font-bold text-[var(--color-brand-espresso,#3B1F0E)]">
        {isAr ? 'شارك هذا الفرع' : 'Share this branch'}
      </h2>
      <div
        role="img"
        aria-label={isAr ? `رمز QR لصفحة ${name}` : `QR code for the ${name} page`}
        className="mx-auto h-40 w-40"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p className="mt-2 text-xs text-black/50">{isAr ? 'امسح الرمز لفتح الصفحة' : 'Scan to open this page'}</p>
    </section>
  );
}
