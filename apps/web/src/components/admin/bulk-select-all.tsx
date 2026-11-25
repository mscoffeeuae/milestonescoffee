'use client';

/** Header checkbox for the menu table: ticks every row checkbox that belongs to the bulk form. */
export function BulkSelectAll({ label }: { label: string }) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      onChange={(e) => {
        const on = e.currentTarget.checked;
        document.querySelectorAll<HTMLInputElement>('input[name="ids"][form="bulk"]').forEach((c) => { c.checked = on; });
      }}
    />
  );
}
