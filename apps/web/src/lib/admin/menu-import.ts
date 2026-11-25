import ExcelJS from 'exceljs';
import { unzipSync } from 'fflate';
import { ImageError, sniffImage, validateImage, type ImageKind } from './image-optimise';
import {
  ALLERGEN_OPTIONS,
  DIETARY_OPTIONS,
  saveProduct,
  type AdminCategory,
  type AdminProduct,
  type ImageFile,
  type ProductInput,
} from './menu-data';

/** Hard limits (also enforced in the upload route before anything is stored). */
export const LIMITS = {
  sheetBytes: 2 * 1024 * 1024,
  zipBytes: 50 * 1024 * 1024,
  imageBytes: 5 * 1024 * 1024,
  rows: 500,
} as const;

export const COLUMNS = [
  'id', 'category', 'name_en', 'name_ar', 'description_en', 'description_ar', 'price_aed',
  'dietary_flags', 'allergens', 'featured', 'sort_order', 'hidden', 'image_filename',
] as const;
type Col = (typeof COLUMNS)[number];
type RawRow = Record<Col, string>;

const DIET = DIETARY_OPTIONS.map((o) => o.value) as string[];
const ALLERGEN = ALLERGEN_OPTIONS.map((o) => o.value) as string[];
const FLAG_SEP = '|';
const MAX_CELL = 2000;

/* ───────────── CSV ───────────── */

/** Cells that spreadsheet apps would run as formulas get a leading ' on CSV export. */
const FORMULA_START = /^[=+\-@\t\r]/;
export function csvSafe(v: string): string {
  return FORMULA_START.test(v) ? `'${v}` : v;
}
/** Inverse of csvSafe. Imported cells are only ever stored as plain text, never evaluated. */
function unguard(v: string): string {
  return /^'[=+\-@\t\r]/.test(v) ? v.slice(1) : v;
}

export function toCsv(rows: string[][]): string {
  const esc = (s: string) => (/[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  // BOM so Excel opens UTF-8 (Arabic) correctly.
  return '﻿' + rows.map((r) => r.map((c) => esc(csvSafe(c))).join(',')).join('\r\n') + '\r\n';
}

export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else cell += ch;
    } else if (ch === '"' && cell === '') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((c) => c !== '')) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c !== '')) rows.push(row);
  return rows;
}

/* ───────────── XLSX ───────────── */

function cellText(v: ExcelJS.CellValue): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object') {
    // A formula cell is never evaluated: its source is kept as literal text.
    if ('formula' in v && typeof v.formula === 'string') return `=${v.formula}`;
    if ('sharedFormula' in v) return '';
    if ('richText' in v && Array.isArray(v.richText)) return v.richText.map((r) => r.text).join('');
    if ('text' in v && typeof v.text === 'string') return v.text;
    if ('error' in v) return '';
  }
  return '';
}

/** Rejects zip bombs: total declared size of an .xlsx's parts must stay sane. */
function assertSaneZip(buf: Uint8Array, maxTotal: number): void {
  let total = 0;
  unzipSync(buf, { filter: (f) => { total += f.originalSize; return false; } });
  if (total > maxTotal) throw new Error('The spreadsheet expands to an unreasonable size.');
}

async function readXlsx(buf: Buffer): Promise<string[][]> {
  assertSaneZip(buf, 40 * 1024 * 1024);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ArrayBuffer);
  const ws = wb.worksheets[0];
  if (!ws) return [];
  const rows: string[][] = [];
  ws.eachRow({ includeEmpty: false }, (row) => {
    const vals = row.values as ExcelJS.CellValue[];
    const out: string[] = [];
    for (let i = 1; i < vals.length; i++) out.push(cellText(vals[i] ?? null));
    if (out.some((c) => c !== '')) rows.push(out);
  });
  return rows;
}

export async function toXlsx(rows: (string | number)[][]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Menu');
  // Plain values only (strings/numbers) so nothing is ever written as a formula.
  rows.forEach((r) => ws.addRow(r.map((c) => (typeof c === 'string' ? c : c))));
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.columns.forEach((c) => { c.width = 22; });
  return Buffer.from(await wb.xlsx.writeBuffer());
}

/* ───────────── Export ───────────── */

export function imageFilenameOf(p: AdminProduct): string {
  if (!p.imageUrl) return '';
  return p.imageMeta?.originalFilename || p.imageFilename || decodeURIComponent(p.imageUrl.split('/').pop() ?? '');
}

export function exportRows(products: AdminProduct[], categories: AdminCategory[], asNumbers: boolean): (string | number)[][] {
  const catName = new Map(categories.map((c) => [c._id, c.nameEn]));
  const rows: (string | number)[][] = [[...COLUMNS]];
  for (const p of products) {
    const price: string | number = p.displayPriceAed == null ? '' : asNumbers ? p.displayPriceAed : String(p.displayPriceAed);
    rows.push([
      p._id,
      (p.categoryId && catName.get(p.categoryId)) || p.categoryEn || '',
      p.nameEn,
      p.nameAr ?? '',
      p.descriptionEn ?? '',
      p.descriptionAr ?? '',
      price,
      (p.dietaryFlags ?? []).join(FLAG_SEP),
      (p.allergens ?? []).join(FLAG_SEP),
      p.isFeatured ? 'true' : 'false',
      asNumbers ? (p.sortOrder ?? 100) : String(p.sortOrder ?? 100),
      p.isActive ? 'false' : 'true',
      imageFilenameOf(p),
    ]);
  }
  return rows;
}

export function templateRows(exampleCategory: string, asNumbers: boolean): (string | number)[][] {
  return [
    [...COLUMNS],
    [
      '', exampleCategory || 'Hot Drinks', 'Example Latte', 'لاتيه مثال', 'Espresso with steamed milk', 'إسبريسو مع حليب مبخّر',
      asNumbers ? 18 : '18', 'vegetarian', 'dairy', 'false', asNumbers ? 100 : '100', 'true', 'example-latte.jpg',
    ],
  ];
}

/* ───────────── Parse + plan ───────────── */

export type PlanAction = 'create' | 'update' | 'unchanged' | 'error';
export interface PlanRow {
  line: number;
  action: PlanAction;
  nameEn: string;
  targetId: string | null;
  changes: string[];
  errors: string[];
  input: ProductInput | null;
  image: ImageFile | null;
  imageName: string;
}
export interface Plan {
  fatal: string | null;
  rows: PlanRow[];
  counts: { create: number; update: number; unchanged: number; error: number };
}

const norm = (s: string) => s.trim().toLowerCase();
const headerKey = (s: string) => norm(s).replace(/[\s-]+/g, '_');

function toBool(v: string): boolean | null | 'bad' {
  const s = norm(v);
  if (s === '') return null;
  if (['true', 'yes', 'y', '1'].includes(s)) return true;
  if (['false', 'no', 'n', '0'].includes(s)) return false;
  return 'bad';
}

function toFlags(v: string, allowed: string[], label: string, errors: string[]): string[] {
  const out: string[] = [];
  for (const part of v.split(/[|;,]/).map((x) => x.trim().toLowerCase()).filter(Boolean)) {
    if (!allowed.includes(part)) errors.push(`Unknown ${label} "${part}"`);
    else if (!out.includes(part)) out.push(part);
  }
  return out;
}

const sameSet = (a: string[] | null | undefined, b: string[]) => {
  const x = [...(a ?? [])].sort().join('|');
  return x === [...b].sort().join('|');
};

const EXT_TYPE: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic' };
const KIND_TYPE: Record<ImageKind, string> = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic' };

interface ZipImages {
  files: Map<string, { name: string; bytes: Uint8Array }>;
  tooBig: Set<string>;
  /** key -> reason, for files whose contents are not a decodable image. */
  invalid: Map<string, string>;
  error: string | null;
}

async function readZip(zip: Buffer | null): Promise<ZipImages> {
  const res: ZipImages = { files: new Map(), tooBig: new Set(), invalid: new Map(), error: null };
  if (!zip) return res;
  try {
    const entries = unzipSync(zip, {
      filter: (f) => {
        const base = f.name.split('/').pop() ?? '';
        if (!base || f.name.startsWith('__MACOSX/') || base.startsWith('.')) return false;
        if (!EXT_TYPE[base.split('.').pop()?.toLowerCase() ?? '']) return false;
        if (f.originalSize > LIMITS.imageBytes) { res.tooBig.add(base.toLowerCase()); return false; }
        return true;
      },
    });
    for (const [path, bytes] of Object.entries(entries)) {
      const name = path.split('/').pop() ?? path;
      res.files.set(name.toLowerCase(), { name, bytes });
    }
  } catch {
    res.error = 'The ZIP file could not be read.';
    return res;
  }
  for (const [key, f] of res.files) {
    try {
      await validateImage(Buffer.from(f.bytes));
    } catch (err) {
      res.invalid.set(key, err instanceof ImageError ? err.message : 'Image could not be read.');
    }
  }
  return res;
}

export async function buildPlan(
  sheet: Buffer,
  ext: 'csv' | 'xlsx',
  zip: Buffer | null,
  products: AdminProduct[],
  categories: AdminCategory[],
): Promise<Plan> {
  const empty = { create: 0, update: 0, unchanged: 0, error: 0 };
  const fatal = (m: string): Plan => ({ fatal: m, rows: [], counts: empty });

  let table: string[][];
  try {
    table = ext === 'csv' ? parseCsv(sheet.toString('utf8')) : await readXlsx(sheet);
  } catch {
    return fatal('The spreadsheet could not be read. Check that it is a valid .csv or .xlsx file.');
  }
  if (table.length === 0) return fatal('The file is empty.');

  const header = table[0]!.map(headerKey);
  const missingCols = COLUMNS.filter((c) => c !== 'id' && !header.includes(c));
  if (!header.includes('name_en') || missingCols.length > 0) {
    return fatal(`Missing column(s): ${missingCols.join(', ')}. Use the template for the exact headers.`);
  }
  const dataRows = table.slice(1);
  if (dataRows.length === 0) return fatal('The file has a header row but no items.');
  if (dataRows.length > LIMITS.rows) return fatal(`Too many rows: ${dataRows.length}. The limit is ${LIMITS.rows} per import.`);

  const zipImgs = await readZip(zip);
  if (zipImgs.error) return fatal(zipImgs.error);

  const byId = new Map(products.map((p) => [p._id, p]));
  const byName = new Map<string, AdminProduct[]>();
  for (const p of products) byName.set(norm(p.nameEn), [...(byName.get(norm(p.nameEn)) ?? []), p]);
  const catLookup = new Map<string, AdminCategory>();
  for (const c of categories) {
    catLookup.set(norm(c.nameEn), c);
    if (c.nameAr) catLookup.set(norm(c.nameAr), c);
    catLookup.set(norm(c._id), c);
  }

  const seenTargets = new Set<string>();
  const seenNewNames = new Set<string>();
  const rows: PlanRow[] = [];

  dataRows.forEach((cells, idx) => {
    const raw = {} as RawRow;
    for (const c of COLUMNS) {
      const i = header.indexOf(c);
      raw[c] = unguard((i >= 0 ? cells[i] ?? '' : '').trim());
    }
    const errors: string[] = [];
    const row: PlanRow = {
      line: idx + 2, action: 'error', nameEn: raw.name_en, targetId: null, changes: [], errors, input: null, image: null, imageName: raw.image_filename,
    };
    for (const c of COLUMNS) if (raw[c].length > MAX_CELL) errors.push(`${c} is longer than ${MAX_CELL} characters`);

    // Target
    let existing: AdminProduct | null = null;
    if (raw.id) {
      existing = byId.get(raw.id) ?? null;
      if (!existing) errors.push(`id "${raw.id}" does not exist`);
    } else if (raw.name_en) {
      const hits = byName.get(norm(raw.name_en)) ?? [];
      if (hits.length > 1) errors.push('name_en matches several existing items; add the id column value');
      else existing = hits[0] ?? null;
    }
    if (existing) {
      if (seenTargets.has(existing._id)) errors.push('duplicate of an earlier row for the same item');
      seenTargets.add(existing._id);
    } else if (raw.name_en) {
      const k = norm(raw.name_en);
      if (seenNewNames.has(k)) errors.push('duplicate name_en earlier in the file');
      seenNewNames.add(k);
    }
    row.targetId = existing?._id ?? null;

    // Fields
    if (raw.name_en.length < 2 || raw.name_en.length > 100) errors.push('name_en is required (2–100 characters)');
    // name_ar may be blank only on rows that end up hidden (checked below once `hidden` is known).
    if (raw.name_ar && (raw.name_ar.length < 2 || raw.name_ar.length > 100)) errors.push('name_ar must be 2–100 characters');
    const cat = raw.category ? catLookup.get(norm(raw.category)) : undefined;
    if (!raw.category) errors.push('category is missing');
    else if (!cat) errors.push(`unknown category "${raw.category}"`);
    if (raw.description_en.length > 400 || raw.description_ar.length > 400) errors.push('descriptions are limited to 400 characters');

    let price: number | null = null;
    if (raw.price_aed === '') errors.push('price_aed is missing');
    else {
      price = Number(raw.price_aed);
      if (!/^\d+(\.\d{1,2})?$/.test(raw.price_aed) || !Number.isFinite(price) || price < 0 || price > 10000) {
        errors.push(`invalid price "${raw.price_aed}" (a number from 0 to 10000)`);
        price = null;
      }
    }
    let sort: number | null = null;
    if (raw.sort_order !== '') {
      sort = Number(raw.sort_order);
      if (!/^\d+$/.test(raw.sort_order) || !Number.isSafeInteger(sort)) { errors.push(`invalid sort_order "${raw.sort_order}"`); sort = null; }
    }
    const featured = toBool(raw.featured);
    if (featured === 'bad') errors.push(`invalid featured "${raw.featured}" (true or false)`);
    const hidden = toBool(raw.hidden);
    if (hidden === 'bad') errors.push(`invalid hidden "${raw.hidden}" (true or false)`);
    const willBeVisible = hidden === null ? Boolean(existing?.isActive) : hidden === false;
    if (!raw.name_ar && willBeVisible) errors.push('name_ar is required unless the row is hidden');
    const dietary = toFlags(raw.dietary_flags, DIET, 'dietary flag', errors);
    const allergens = toFlags(raw.allergens, ALLERGEN, 'allergen', errors);

    // Image
    const currentImg = existing ? imageFilenameOf(existing) : '';
    let image: ImageFile | null = null;
    if (raw.image_filename) {
      const key = raw.image_filename.split('/').pop()!.toLowerCase();
      const found = zipImgs.files.get(key);
      if (found) {
        const kind = sniffImage(found.bytes);
        const type = kind ? KIND_TYPE[kind] : null;
        const claimed = EXT_TYPE[key.split('.').pop() ?? ''];
        const bad = zipImgs.invalid.get(key);
        if (!type || type !== claimed) errors.push(`image "${raw.image_filename}" is not a valid ${claimed?.split('/')[1]?.toUpperCase()} file`);
        else if (bad) errors.push(`image "${raw.image_filename}": ${bad}`);
        else image = { bytes: Buffer.from(found.bytes), filename: found.name, contentType: type };
      } else if (zipImgs.tooBig.has(key)) errors.push(`image "${raw.image_filename}" is larger than 5 MB`);
      else if (!(existing && raw.image_filename.toLowerCase() === currentImg.toLowerCase())) {
        errors.push(`image file "${raw.image_filename}" not found in the ZIP`);
      }
    }

    if (errors.length > 0 || !cat || price == null) {
      row.action = 'error';
      rows.push(row);
      return;
    }

    const input: ProductInput = {
      nameEn: raw.name_en,
      nameAr: raw.name_ar,
      categoryId: cat._id,
      descriptionEn: raw.description_en,
      descriptionAr: raw.description_ar,
      displayPriceAed: price,
      allergens,
      dietaryFlags: dietary,
      // New items stay hidden unless hidden=false. Blank on an existing item keeps its state.
      isActive: hidden === null ? (existing ? Boolean(existing.isActive) : false) : hidden === false,
      isFeatured: featured === null || featured === 'bad' ? (existing ? Boolean(existing.isFeatured) : false) : featured,
      sortOrder: sort ?? (existing ? existing.sortOrder ?? 100 : 100),
    };
    row.input = input;
    row.image = image;

    if (!existing) {
      row.action = 'create';
    } else {
      const diff: string[] = [];
      if (input.nameEn !== existing.nameEn) diff.push('name_en');
      if (input.nameAr !== (existing.nameAr ?? '')) diff.push('name_ar');
      if (input.categoryId !== existing.categoryId) diff.push('category');
      if (input.descriptionEn !== (existing.descriptionEn ?? '')) diff.push('description_en');
      if (input.descriptionAr !== (existing.descriptionAr ?? '')) diff.push('description_ar');
      if (input.displayPriceAed !== existing.displayPriceAed) diff.push('price_aed');
      if (!sameSet(existing.dietaryFlags, input.dietaryFlags)) diff.push('dietary_flags');
      if (!sameSet(existing.allergens, input.allergens)) diff.push('allergens');
      if (input.isFeatured !== Boolean(existing.isFeatured)) diff.push('featured');
      if (input.sortOrder !== (existing.sortOrder ?? 100)) diff.push('sort_order');
      if (input.isActive !== Boolean(existing.isActive)) diff.push('hidden');
      if (image) diff.push('image');
      row.changes = diff;
      row.action = diff.length === 0 ? 'unchanged' : 'update';
    }
    rows.push(row);
  });

  const counts = { ...empty };
  for (const r of rows) counts[r.action]++;
  return { fatal: null, rows, counts };
}

/* ───────────── Apply ───────────── */

export interface ImportSummary {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  failures: { line: number; name: string; message: string }[];
  skippedInvalid: number;
  unchanged: number;
}

/** Writes valid rows through saveProduct (the same write path as the single-item form). */
export async function applyPlan(plan: Plan): Promise<ImportSummary> {
  const s: ImportSummary = { created: 0, updated: 0, skipped: 0, failed: 0, failures: [], skippedInvalid: 0, unchanged: 0 };
  for (const r of plan.rows) {
    if (r.action === 'error') { s.skipped++; s.skippedInvalid++; continue; }
    if (r.action === 'unchanged') { s.skipped++; s.unchanged++; continue; }
    try {
      await saveProduct(r.action === 'update' ? r.targetId : null, r.input!, r.image, false);
      if (r.action === 'create') s.created++; else s.updated++;
    } catch (err) {
      s.failed++;
      s.failures.push({ line: r.line, name: r.nameEn, message: err instanceof Error ? err.message.slice(0, 160) : 'write failed' });
    }
  }
  return s;
}
