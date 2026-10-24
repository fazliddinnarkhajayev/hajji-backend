import * as ExcelJS from 'exceljs';

export type DocumentsExportType = 'visa' | 'ticket';

const VISA_LABEL: Record<string, string> = { NONE: 'Topshirilmagan', SUBMITTED: 'Topshirildi', ISSUED: 'Berildi', REJECTED: 'Rad etildi' };
const TICKET_LABEL: Record<string, string> = { NONE: 'Yo‘q', BOOKED: 'Bron qilindi', ISSUED: 'Berildi' };
const GENDER: Record<string, string> = { MALE: 'M', FEMALE: 'F' };

/**
 * Date-only columns come back from pg as Date at local midnight. ExcelJS writes dates as UTC, so
 * re-anchor the calendar day at UTC midnight or east-of-UTC servers would show the previous day.
 */
function asDate(v: unknown): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(String(v));
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

interface Column { header: string; key: string; width: number; date?: boolean }

const PERSON: Column[] = [
  { header: '№', key: 'n', width: 5 },
  { header: 'Familiya', key: 'last_name', width: 18 },
  { header: 'Ism', key: 'first_name', width: 16 },
  { header: 'Otasining ismi', key: 'middle_name', width: 18 },
  { header: 'Jinsi', key: 'gender', width: 7 },
  { header: 'Tug‘ilgan sana', key: 'birth_date', width: 14, date: true },
  { header: 'Fuqaroligi', key: 'citizenship', width: 11 },
  { header: 'Pasport raqami', key: 'passport_number', width: 15 },
  { header: 'Pasport berilgan', key: 'passport_issued_at', width: 15, date: true },
  { header: 'Pasport muddati', key: 'passport_expires_at', width: 15, date: true },
  { header: 'PINFL', key: 'pinfl', width: 16 },
  { header: 'Telefon', key: 'phone', width: 16 },
];

const VISA: Column[] = [
  { header: 'Viza holati', key: 'visa_label', width: 15 },
  { header: 'Viza raqami', key: 'visa_number', width: 16 },
  { header: 'Viza berilgan', key: 'visa_issued_at', width: 14, date: true },
  { header: 'Viza muddati', key: 'visa_expires_at', width: 14, date: true },
];

const TICKET: Column[] = [
  { header: 'Bilet holati', key: 'ticket_label', width: 14 },
  { header: 'Reys', key: 'flight_number', width: 11 },
  { header: 'Reys sanasi', key: 'flight_date', width: 14, date: true },
  { header: 'PNR', key: 'pnr', width: 10 },
  { header: 'Bilet raqami', key: 'ticket_number', width: 18 },
];

/**
 * One sheet: group header lines, then one row per member. Missing passport data is left blank and
 * highlighted so the staff see what to fill in before sending the file on.
 */
export async function buildDocumentsWorkbook(
  type: DocumentsExportType,
  group: { name: string; departure_date: Date | string; return_date: Date | string },
  members: any[],
): Promise<Buffer> {
  const columns = [...PERSON, ...(type === 'visa' ? VISA : TICKET), { header: 'Izoh', key: 'documents_note', width: 30 }];
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Hajji';
  wb.created = new Date();
  const ws = wb.addWorksheet(type === 'visa' ? 'Viza' : 'Aviabilet', { views: [{ state: 'frozen', ySplit: 4 }] });

  ws.columns = columns.map((c) => ({ key: c.key, width: c.width }));
  ws.mergeCells(1, 1, 1, columns.length);
  ws.getCell(1, 1).value = `${group.name} — ${type === 'visa' ? 'viza ro‘yxati' : 'aviabilet ro‘yxati'}`;
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  ws.mergeCells(2, 1, 2, columns.length);
  const fmt = (d: unknown) => { const x = asDate(d); return x ? x.toLocaleDateString('ru-RU') : '—'; };
  ws.getCell(2, 1).value = `Jo‘nash: ${fmt(group.departure_date)} · Qaytish: ${fmt(group.return_date)} · ${members.length} kishi`;

  const header = ws.getRow(4);
  columns.forEach((c, i) => { header.getCell(i + 1).value = c.header; });
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.alignment = { vertical: 'middle', wrapText: true };
  header.height = 30;
  header.eachCell((cell) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B7A50' } }; });

  const required = ['last_name', 'first_name', 'birth_date', 'gender', 'passport_number', 'passport_expires_at'];
  members.forEach((m, i) => {
    const values: Record<string, unknown> = {
      ...m,
      n: i + 1,
      gender: GENDER[m.gender] ?? m.gender ?? null,
      visa_label: VISA_LABEL[m.visa_status] ?? m.visa_status,
      ticket_label: TICKET_LABEL[m.ticket_status] ?? m.ticket_status,
    };
    const row = ws.getRow(5 + i);
    columns.forEach((c, ci) => {
      const cell = row.getCell(ci + 1);
      const v = values[c.key];
      cell.value = c.date ? asDate(v) : (v ?? null) as ExcelJS.CellValue;
      if (c.date) cell.numFmt = 'dd.mm.yyyy';
      if (c.key === 'pinfl' || c.key === 'phone' || c.key === 'passport_number') cell.numFmt = '@';
      if (required.includes(c.key) && (v === null || v === undefined || v === '')) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF1D6' } };
      }
    });
  });

  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + members.length, column: columns.length } };
  return Buffer.from(await wb.xlsx.writeBuffer());
}
