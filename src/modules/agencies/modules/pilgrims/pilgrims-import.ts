import * as ExcelJS from 'exceljs';
import { isPhoneNumber } from 'class-validator';

/**
 * Bulk pilgrim registration from Excel. Same fields and rules as the Hajji Guide app's register
 * form: phone, first name and last name are required; PINFL, country, region and district optional.
 * Everything here is pure (no DB) so the rules can be tested on their own.
 */

export type ImportField = 'phone' | 'first_name' | 'last_name' | 'pinfl' | 'country' | 'region' | 'district';

export type ImportErrorCode =
  | 'invalid_file' | 'no_sheet' | 'missing_column' | 'empty' | 'too_many_rows'
  | 'required' | 'invalid_phone' | 'invalid_pinfl' | 'too_long'
  | 'duplicate_in_file' | 'phone_taken' | 'pinfl_taken'
  | 'not_found' | 'ambiguous' | 'region_mismatch';

export interface ImportError {
  /** Excel row number (1 = header row); null for file-level errors. */
  row: number | null;
  field: ImportField | null;
  code: ImportErrorCode;
  /** The cell value as read, so the user can find it. */
  value?: string;
  /** Extra detail: the other row of a duplicate, the missing column's header, the row limit. */
  detail?: string;
}

export interface RefItem { id: string; name: string; parent_id?: string | null }
export interface ImportRefs { countries: RefItem[]; regions: RefItem[]; districts: RefItem[] }

export interface RawRow {
  row: number;
  phone: string; first_name: string; last_name: string; pinfl: string;
  country: string; region: string; district: string;
}

export interface ValidRow {
  row: number;
  phone: string; first_name: string; last_name: string;
  pinfl?: string; country_id?: string; region_id?: string; district_id?: string;
}

export const MAX_ROWS = 1000;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
const NAME_MAX = 100;

const SHEET = 'Ziyoratchilar';
const REF_SHEET = 'Ma’lumotnoma';
const LISTS_SHEET = 'Lists';

const COLUMNS: { field: ImportField; header: string; required: boolean; width: number; note: string }[] = [
  { field: 'phone', header: 'Telefon *', required: true, width: 18, note: 'Majburiy. Masalan: 998901234567 yoki 901234567' },
  { field: 'first_name', header: 'Ism *', required: true, width: 18, note: 'Majburiy' },
  { field: 'last_name', header: 'Familiya *', required: true, width: 20, note: 'Majburiy' },
  { field: 'pinfl', header: 'PINFL', required: false, width: 18, note: 'Ixtiyoriy. 14 ta raqam' },
  { field: 'country', header: 'Davlat', required: false, width: 18, note: 'Ixtiyoriy. Ro‘yxatdan tanlang' },
  { field: 'region', header: 'Viloyat', required: false, width: 24, note: 'Ixtiyoriy. Ro‘yxatdan tanlang' },
  { field: 'district', header: 'Tuman', required: false, width: 24, note: 'Ixtiyoriy. Ro‘yxatdan tanlang' },
];

/** Header texts accepted for each column (template header, other scripts and languages). */
const ALIASES: Record<ImportField, string[]> = {
  phone: ['telefon', 'telefon raqami', 'телефон', 'phone', 'phone number'],
  first_name: ['ism', 'исм', 'имя', 'first name', 'first_name'],
  last_name: ['familiya', 'фамилия', 'last name', 'last_name'],
  pinfl: ['pinfl', 'jshshir', 'пинфл', 'жшшир'],
  country: ['davlat', 'давлат', 'страна', 'country'],
  region: ['viloyat', 'вилоят', 'регион', 'область', 'region'],
  district: ['tuman', 'туман', 'район', 'district'],
};

/** Lower case, one kind of apostrophe, single spaces — for header and name matching. */
export function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’ʻʼ`´']/g, "'")
    .replace(/\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Text of a cell whatever ExcelJS hands back (number, rich text, formula result, hyperlink, date). */
export function cellText(v: ExcelJS.CellValue): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(v);
  if (typeof v === 'boolean') return String(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'object') {
    if ('richText' in v && Array.isArray(v.richText)) return v.richText.map((r) => r.text).join('').trim();
    if ('result' in v) return cellText((v as ExcelJS.CellFormulaValue).result as ExcelJS.CellValue);
    if ('text' in v) return String((v as ExcelJS.CellHyperlinkValue).text ?? '').trim();
  }
  return '';
}

/** Digits of a phone; a 9-digit local number gets the 998 prefix. '' when it isn't a valid number. */
export function normalizeImportPhone(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (d.length === 9) d = `998${d}`;
  if (d.length < 9 || d.length > 15) return '';
  return isPhoneNumber(`+${d}`) ? d : '';
}

/** Reads the first sheet: header row 1, data from row 2. Empty rows are skipped. */
export async function parseWorkbook(buffer: Buffer): Promise<{ rows: RawRow[]; errors: ImportError[] }> {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buffer as any);
  } catch {
    return { rows: [], errors: [{ row: null, field: null, code: 'invalid_file' }] };
  }
  const ws = wb.getWorksheet(SHEET) ?? wb.worksheets[0];
  if (!ws) return { rows: [], errors: [{ row: null, field: null, code: 'no_sheet' }] };

  const colOf: Partial<Record<ImportField, number>> = {};
  ws.getRow(1).eachCell((cell, col) => {
    const h = norm(cellText(cell.value));
    for (const [field, names] of Object.entries(ALIASES) as [ImportField, string[]][]) {
      if (colOf[field] === undefined && names.includes(h)) colOf[field] = col;
    }
  });
  const missing = COLUMNS.filter((c) => c.required && colOf[c.field] === undefined);
  if (missing.length) {
    return {
      rows: [],
      errors: missing.map((c) => ({ row: 1, field: c.field, code: 'missing_column' as const, detail: c.header.replace(' *', '') })),
    };
  }

  const rows: RawRow[] = [];
  const read = (r: ExcelJS.Row, f: ImportField) => (colOf[f] ? cellText(r.getCell(colOf[f]!).value) : '');
  for (let i = 2; i <= ws.rowCount; i++) {
    const r = ws.getRow(i);
    const row: RawRow = {
      row: i,
      phone: read(r, 'phone'), first_name: read(r, 'first_name'), last_name: read(r, 'last_name'),
      pinfl: read(r, 'pinfl'), country: read(r, 'country'), region: read(r, 'region'), district: read(r, 'district'),
    };
    if (Object.entries(row).every(([k, v]) => k === 'row' || v === '')) continue;
    rows.push(row);
    if (rows.length > MAX_ROWS) {
      return { rows: [], errors: [{ row: null, field: null, code: 'too_many_rows', detail: String(MAX_ROWS) }] };
    }
  }
  if (rows.length === 0) return { rows: [], errors: [{ row: null, field: null, code: 'empty' }] };
  return { rows, errors: [] };
}

/** Items whose name matches, optionally only under one parent. */
function byName(items: RefItem[], name: string, parentId?: string): RefItem[] {
  const n = norm(name);
  return items.filter((i) => norm(i.name) === n && (parentId === undefined || i.parent_id === parentId));
}

/**
 * Checks every row against the register-form rules, the reference lists and the phones / PINFLs
 * already taken. Returns the rows ready to create, or every problem found (nothing is created then).
 */
export function validateRows(
  rows: RawRow[],
  refs: ImportRefs,
  taken: { phones: Set<string>; pinfls: Set<string> },
): { items: ValidRow[]; errors: ImportError[] } {
  const errors: ImportError[] = [];
  const items: ValidRow[] = [];
  const seenPhone = new Map<string, number>();
  const seenPinfl = new Map<string, number>();

  for (const r of rows) {
    const err = (field: ImportField, code: ImportErrorCode, value?: string, detail?: string) =>
      errors.push({ row: r.row, field, code, ...(value ? { value } : {}), ...(detail ? { detail } : {}) });
    const before = errors.length;

    // Phone
    let phone = '';
    if (!r.phone) err('phone', 'required');
    else {
      phone = normalizeImportPhone(r.phone);
      if (!phone) err('phone', 'invalid_phone', r.phone);
      else if (seenPhone.has(phone)) err('phone', 'duplicate_in_file', r.phone, String(seenPhone.get(phone)));
      else if (taken.phones.has(phone)) err('phone', 'phone_taken', r.phone);
      if (phone && !seenPhone.has(phone)) seenPhone.set(phone, r.row);
    }

    // Names
    for (const f of ['first_name', 'last_name'] as const) {
      if (!r[f]) err(f, 'required');
      else if (r[f].length > NAME_MAX) err(f, 'too_long', r[f].slice(0, 30), String(NAME_MAX));
    }

    // PINFL
    let pinfl: string | undefined;
    if (r.pinfl) {
      const d = r.pinfl.replace(/\s/g, '');
      if (!/^\d{14}$/.test(d)) err('pinfl', 'invalid_pinfl', r.pinfl);
      else if (seenPinfl.has(d)) err('pinfl', 'duplicate_in_file', r.pinfl, String(seenPinfl.get(d)));
      else if (taken.pinfls.has(d)) err('pinfl', 'pinfl_taken', r.pinfl);
      else pinfl = d;
      if (/^\d{14}$/.test(d) && !seenPinfl.has(d)) seenPinfl.set(d, r.row);
    }

    // Country → region → district (each optional; a lower level fills in the higher one)
    let countryId: string | undefined;
    let regionId: string | undefined;
    let districtId: string | undefined;
    if (r.country) {
      const found = byName(refs.countries, r.country);
      if (found.length === 0) err('country', 'not_found', r.country);
      else if (found.length > 1) err('country', 'ambiguous', r.country);
      else countryId = found[0].id;
    }
    const countryOk = !r.country || !!countryId;
    if (r.region && countryOk) {
      const found = byName(refs.regions, r.region, countryId);
      if (found.length === 0) {
        err('region', countryId && byName(refs.regions, r.region).length ? 'region_mismatch' : 'not_found', r.region);
      } else if (found.length > 1) err('region', 'ambiguous', r.region);
      else {
        regionId = found[0].id;
        countryId = countryId ?? found[0].parent_id ?? undefined;
      }
    }
    const regionOk = !r.region || !!regionId;
    if (r.district && countryOk && regionOk) {
      let found = byName(refs.districts, r.district, regionId);
      // Without a region, the district must also sit in the chosen country.
      if (!regionId && countryId) {
        const regionsInCountry = new Set(refs.regions.filter((x) => x.parent_id === countryId).map((x) => x.id));
        found = found.filter((d) => d.parent_id && regionsInCountry.has(d.parent_id));
      }
      if (found.length === 0) {
        err('district', regionId && byName(refs.districts, r.district).length ? 'region_mismatch' : 'not_found', r.district);
      } else if (found.length > 1) err('district', 'ambiguous', r.district);
      else {
        districtId = found[0].id;
        if (!regionId) {
          regionId = found[0].parent_id ?? undefined;
          countryId = countryId ?? refs.regions.find((x) => x.id === regionId)?.parent_id ?? undefined;
        }
      }
    }

    if (errors.length === before) {
      items.push({
        row: r.row, phone, first_name: r.first_name, last_name: r.last_name,
        ...(pinfl ? { pinfl } : {}),
        ...(countryId ? { country_id: countryId } : {}),
        ...(regionId ? { region_id: regionId } : {}),
        ...(districtId ? { district_id: districtId } : {}),
      });
    }
  }
  return { items, errors };
}

/** The template: the pilgrims sheet (text-formatted phone and PINFL, dropdowns) and the name lists. */
export async function buildTemplate(refs: ImportRefs): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Hajji';
  const ws = wb.addWorksheet(SHEET, { views: [{ state: 'frozen', ySplit: 1 }] });
  const lists = wb.addWorksheet(REF_SHEET);

  ws.columns = COLUMNS.map((c) => ({ header: c.header, key: c.field, width: c.width }));
  const head = ws.getRow(1);
  head.height = 22;
  COLUMNS.forEach((c, i) => {
    const cell = head.getCell(i + 1);
    cell.font = { bold: true, color: { argb: c.required ? 'FFFFFFFF' : 'FF1C1C1C' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: c.required ? 'FF1B6B3A' : 'FFE8F1EA' } };
    cell.alignment = { vertical: 'middle' };
    cell.note = c.note;
  });

  // Phone and PINFL as text, so Excel keeps every digit.
  for (const f of ['phone', 'pinfl'] as const) ws.getColumn(f).numFmt = '@';

  // Name lists: country | region (country) | district (region).
  const countryName = new Map(refs.countries.map((c) => [c.id, c.name]));
  const regionName = new Map(refs.regions.map((r) => [r.id, r.name]));
  const sortByName = (a: RefItem, b: RefItem) => a.name.localeCompare(b.name);
  lists.columns = [
    { header: 'Davlat', key: 'country', width: 22 },
    { header: 'Viloyat', key: 'region', width: 28 },
    { header: 'Viloyat qaysi davlatda', key: 'region_parent', width: 22 },
    { header: 'Tuman', key: 'district', width: 28 },
    { header: 'Tuman qaysi viloyatda', key: 'district_parent', width: 28 },
  ];
  lists.getRow(1).font = { bold: true };
  const countries = [...refs.countries].sort(sortByName);
  const regions = [...refs.regions].sort(sortByName);
  const districts = [...refs.districts].sort(sortByName);
  const n = Math.max(countries.length, regions.length, districts.length);
  for (let i = 0; i < n; i++) {
    lists.addRow({
      country: countries[i]?.name,
      region: regions[i]?.name,
      region_parent: regions[i]?.parent_id ? countryName.get(regions[i].parent_id!) : undefined,
      district: districts[i]?.name,
      district_parent: districts[i]?.parent_id ? regionName.get(districts[i].parent_id!) : undefined,
    });
  }

  // Dropdowns that follow each other: the region list shows only the chosen country's regions and
  // the district list only the chosen region's districts (all of them while the level above is empty).
  // A hidden sheet holds the lists; INDIRECT(VLOOKUP(parent)) picks the right one for each row.
  //   cols 1-3: every country / region / district
  //   cols 5-6: country → address of its regions; cols 8-9: region → address of its districts
  //   col 4 stays empty (the list of a parent without children); cols 11+: the child lists
  const hidden = wb.addWorksheet(LISTS_SHEET, { state: 'veryHidden' });
  const letter = (col: number) => hidden.getColumn(col).letter;
  const range = (fromCol: number, toCol: number, rows: number) =>
    `'${LISTS_SHEET}'!$${letter(fromCol)}$1:$${letter(toCol)}$${Math.max(rows, 1)}`;
  const putColumn = (col: number, names: string[]) => names.forEach((v, i) => { hidden.getCell(i + 1, col).value = v; });

  putColumn(1, countries.map((c) => c.name));
  putColumn(2, regions.map((r) => r.name));
  putColumn(3, districts.map((d) => d.name));
  let nextCol = 11;
  const childMap = (mapCol: number, parents: RefItem[], children: RefItem[]) => {
    parents.forEach((parent, i) => {
      const names = children.filter((c) => c.parent_id === parent.id).map((c) => c.name).sort((a, b) => a.localeCompare(b));
      let address = range(4, 4, 1);
      if (names.length) {
        putColumn(nextCol, names);
        address = range(nextCol, nextCol, names.length);
        nextCol++;
      }
      hidden.getCell(i + 1, mapCol).value = parent.name;
      hidden.getCell(i + 1, mapCol + 1).value = address;
    });
    return range(mapCol, mapCol + 1, parents.length);
  };
  const countryMap = childMap(5, countries, regions);
  const regionMap = childMap(8, regions, districts);

  const colOfField = (f: ImportField) => ws.getColumn(COLUMNS.findIndex((c) => c.field === f) + 1).letter;
  const [cC, rC, dC] = [colOfField('country'), colOfField('region'), colOfField('district')];
  const dependent = (all: string, parentCell: string, map: string) =>
    `IF(${parentCell}="",${all},INDIRECT(VLOOKUP(${parentCell},${map},2,FALSE)))`;
  const rule = (formula: string, what: string): ExcelJS.DataValidation => ({
    type: 'list', allowBlank: true, formulae: [formula],
    showErrorMessage: true, errorStyle: 'stop',
    errorTitle: 'Ro‘yxatda yo‘q',
    error: `${what} faqat ro‘yxatdan tanlanadi: katakni bosing va ▼ tugmasidan tanlang.`,
  });
  for (let r = 2; r <= MAX_ROWS + 1; r++) {
    if (countries.length) ws.getCell(`${cC}${r}`).dataValidation = rule(range(1, 1, countries.length), 'Davlat');
    if (regions.length) ws.getCell(`${rC}${r}`).dataValidation = rule(dependent(range(2, 2, regions.length), `$${cC}${r}`, countryMap), 'Viloyat');
    if (districts.length) ws.getCell(`${dC}${r}`).dataValidation = rule(dependent(range(3, 3, districts.length), `$${rC}${r}`, regionMap), 'Tuman');
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}
