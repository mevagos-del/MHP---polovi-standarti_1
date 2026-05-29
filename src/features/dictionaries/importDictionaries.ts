import * as XLSX from 'xlsx';
import type { Channel, Dictionaries, Employee, PlanningMonth } from '../../types/domain';
import { createId } from '../../utils/ids';

type ImportResult =
  | { ok: true; dictionaries: Dictionaries }
  | { ok: false; errors: string[] };

const requiredSheets = ['Channels', 'Users', 'Months'] as const;

const requiredColumns = {
  Channels: ['channelCode', 'channelName', 'isActive'],
  Users: ['fullName', 'channelCode', 'isActive'],
  Months: ['monthName', 'monthCode', 'isActive'],
};

function isActive(value: unknown) {
  return String(value).trim().toLowerCase() === 'true';
}

function sheetToRows(workbook: XLSX.WorkBook, sheetName: string) {
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
}

function validateColumns(rows: Record<string, unknown>[], columns: string[], sheetName: string) {
  if (rows.length === 0) {
    return [`Аркуш ${sheetName} не містить даних.`];
  }

  const rowColumns = new Set(Object.keys(rows[0]));
  return columns
    .filter((column) => !rowColumns.has(column))
    .map((column) => `В аркуші ${sheetName} відсутня колонка ${column}.`);
}

export async function importDictionariesFromExcel(file: File): Promise<ImportResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const errors: string[] = [];

  requiredSheets.forEach((sheetName) => {
    if (!workbook.SheetNames.includes(sheetName)) {
      errors.push(`Відсутній обов'язковий аркуш ${sheetName}.`);
    }
  });

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const channelRows = sheetToRows(workbook, 'Channels');
  const userRows = sheetToRows(workbook, 'Users');
  const monthRows = sheetToRows(workbook, 'Months');

  errors.push(...validateColumns(channelRows, requiredColumns.Channels, 'Channels'));
  errors.push(...validateColumns(userRows, requiredColumns.Users, 'Users'));
  errors.push(...validateColumns(monthRows, requiredColumns.Months, 'Months'));

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const channels: Channel[] = channelRows
    .filter((row) => isActive(row.isActive))
    .map((row) => ({
      id: `channel-${String(row.channelCode).trim()}`,
      code: String(row.channelCode).trim(),
      name: String(row.channelName).trim(),
      isActive: true,
    }));
  const channelCodes = new Set(channels.map((channel) => channel.code));

  const employees: Employee[] = userRows
    .filter((row) => isActive(row.isActive))
    .map((row) => ({
      id: createId('emp'),
      fullName: String(row.fullName).trim(),
      channelCode: String(row.channelCode).trim(),
      isActive: true,
    }));

  employees.forEach((employee) => {
    if (!channelCodes.has(employee.channelCode)) {
      errors.push(`Канал ${employee.channelCode} для користувача ${employee.fullName} відсутній в Channels.`);
    }
  });

  const months: PlanningMonth[] = monthRows
    .filter((row) => isActive(row.isActive))
    .map((row) => ({
      id: `month-${String(row.monthCode).trim()}`,
      monthName: String(row.monthName).trim(),
      monthCode: String(row.monthCode).trim(),
      isActive: true,
    }));

  if (channels.length === 0) errors.push('Після фільтра isActive=TRUE немає активних каналів.');
  if (employees.length === 0) errors.push('Після фільтра isActive=TRUE немає активних користувачів.');
  if (months.length === 0) errors.push('Після фільтра isActive=TRUE немає активних місяців.');

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, dictionaries: { channels, employees, months } };
}
